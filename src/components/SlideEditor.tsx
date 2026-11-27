import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, ChevronUp, Copy, Plus, RotateCcw, Trash2, Upload, X } from 'lucide-react';
import type { Project, Slide } from '@/lib/model';
import { SAMPLES, sampleUrl } from '@/lib/samples';
import { Segment } from './controls';
import '@/studio-v3.css';

export type SlideApi = {
  project: Project; activeSlide: Slide;
  patchSlide: (key: keyof Slide, value: string) => void; select: (i: number) => void; add: () => void; duplicate: () => void; remove: () => void;
  move: (from: number, to: number) => void; reset: () => void; upload: (file?: File) => void;
};
const SWATCHES = ['#34455a', '#4d4738', '#354d49', '#4c3947', '#393e55', '#3e4b4d', '#58433d', '#384451', '#4b3f53', '#3e4c3f'];
const thumbStyle = (s: Slide) => ({ backgroundColor: s.color, backgroundImage: s.image ? `url(${JSON.stringify(s.image)})` : `radial-gradient(ellipse at 80% 20%,${s.accent}70,transparent 60%)` });

export function SlideList({ api, touch = false }: { api: SlideApi; touch?: boolean }) {
  const { project } = api;
  const dragFrom = useRef<number | null>(null);
  const n = project.slides.length;
  return <div className={`slide-manager ${touch ? 'touch' : ''}`}>
    <div className="slide-list">{project.slides.map((s, i) => <div key={s.id} className={`slide-row ${i === project.active ? 'selected' : ''}`} draggable={!touch}
      onDragStart={() => { dragFrom.current = i; }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragFrom.current !== null) api.move(dragFrom.current, i); dragFrom.current = null; }}>
      <button type="button" className="slide-row-main" onClick={() => api.select(i)} aria-current={i === project.active ? 'true' : undefined}>
        <span className="slide-thumb" style={thumbStyle(s)}><span>{String(i + 1).padStart(2, '0')}</span></span>
        <span className="slide-row-info"><strong>{s.name}</strong><small>{s.title.slice(0, 30)}{s.title.length > 30 ? '…' : ''}</small></span>
      </button>
      {i === project.active && <span className="slide-row-tools">
        <button type="button" aria-label="Move slide earlier" title="Move earlier" disabled={i === 0} onClick={() => api.move(i, i - 1)}><ChevronUp size={14} /></button>
        <button type="button" aria-label="Move slide later" title="Move later" disabled={i === n - 1} onClick={() => api.move(i, i + 1)}><ChevronDown size={14} /></button>
      </span>}
    </div>)}</div>
    <div className="slide-actions"><button type="button" onClick={api.add}><Plus size={14} /> Add</button><button type="button" onClick={api.duplicate}><Copy size={14} /> Duplicate</button><button type="button" className="danger" onClick={api.remove}><Trash2 size={14} /> Delete</button></div>
  </div>;
}

const parseFocal = (f: string): [number, number] => { const m = f.match(/(-?[\d.]+)%\s+(-?[\d.]+)%/); return m ? [Number(m[1]), Number(m[2])] : [50, 50]; };
function FocalPad({ slide, onChange }: { slide: Slide; onChange: (v: string) => void }) {
  const [fx, fy] = parseFocal(slide.focal);
  const set = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))), y = Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)));
    onChange(`${x}% ${y}%`);
  };
  return <div className="focal-field"><span className="ctl-label">Focal point <b className="mono">{slide.focal}</b></span>
    <div className="focal-pad" role="slider" tabIndex={0} aria-label="Image focal point. Arrow keys move it." aria-valuetext={slide.focal} style={{ backgroundImage: `url(${JSON.stringify(slide.image)})` }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e); }} onPointerMove={(e) => { if (e.buttons) set(e); }}
      onKeyDown={(e) => { const d = e.shiftKey ? 10 : 2; const k = e.key; if (!k.startsWith('Arrow')) return; e.preventDefault(); onChange(`${Math.min(100, Math.max(0, fx + (k === 'ArrowRight' ? d : k === 'ArrowLeft' ? -d : 0)))}% ${Math.min(100, Math.max(0, fy + (k === 'ArrowDown' ? d : k === 'ArrowUp' ? -d : 0)))}%`); }}>
      <i style={{ left: `${fx}%`, top: `${fy}%` }} /></div></div>;
}

export function SlideEditor({ api }: { api: SlideApi }) {
  const s = api.activeSlide;
  const fileRef = useRef<HTMLInputElement>(null);
  if (!s) return null;
  const field = (label: string, key: keyof Slide, rows = 0, ph = '') => rows
    ? <label className="field-label">{label}<textarea rows={rows} value={String(s[key] ?? '')} placeholder={ph} onChange={(e) => api.patchSlide(key, e.target.value)} /></label>
    : <label className="field-label">{label}<input value={String(s[key] ?? '')} placeholder={ph} onChange={(e) => api.patchSlide(key, e.target.value)} /></label>;
  return <div className="slide-editor">
    <section className="inspector-section"><div className="section-row"><span>SLIDE CONTENT</span><button type="button" className="quiet-icon" title="Reset slide" aria-label="Reset slide" onClick={api.reset}><RotateCcw size={13} /></button></div>
      {field('Slide name', 'name')}{field('Eyebrow', 'eyebrow')}{field('Headline', 'title', 2)}{field('Description', 'body', 3)}{field('Button label', 'cta')}{field('Button link', 'href', 0, 'https://…')}
    </section>
    <section className="inspector-section"><div className="section-row"><span>IMAGE & BACKGROUND</span></div>
      <label className="field-label">Image URL<input value={s.image.startsWith('data:') ? '' : s.image} placeholder={s.image.startsWith('data:') ? 'Uploaded image in use' : 'Paste an image URL…'} onChange={(e) => api.patchSlide('image', e.target.value)} /></label>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { api.upload(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="field-buttons"><button type="button" onClick={() => fileRef.current?.click()}><Upload size={13} /> Upload</button><button type="button" onClick={() => api.patchSlide('image', '')} disabled={!s.image}><X size={13} /> Remove</button></div>
      {s.image ? <FocalPad slide={s} onChange={(v) => api.patchSlide('focal', v)} /> : null}
      <label className="field-label color-field"><span className="ctl-label">Background color</span><span className="color-input"><input type="color" value={s.color} onChange={(e) => api.patchSlide('color', e.target.value)} aria-label="Background color" /><span>{s.color}</span></span></label>
      <div className="swatches">{SWATCHES.map((c) => <button type="button" key={c} title={`Set background ${c}`} aria-label={`Set background ${c}`} style={{ background: c }} onClick={() => api.patchSlide('color', c)} />)}</div>
      <label className="field-label color-field"><span className="ctl-label">Accent color</span><span className="color-input"><input type="color" value={s.accent} onChange={(e) => api.patchSlide('accent', e.target.value)} aria-label="Accent color" /><span>{s.accent}</span></span></label>
    </section>
    <section className="inspector-section"><div className="section-row"><span>FREE SAMPLE IMAGES</span></div>
      <div className="sample-grid" role="list">{SAMPLES.map((x) => <button type="button" role="listitem" key={x.id} className={s.image === sampleUrl(x.id) ? 'picked' : ''} title={x.label} aria-label={`Use sample image: ${x.label}`}
        style={{ backgroundColor: x.color, backgroundImage: `url(${sampleUrl(x.id, 160, 120)})` }} onClick={() => api.patchSlide('image', sampleUrl(x.id))} />)}</div>
      <small className="sample-credit">Hot-linked from Lorem Picsum — free Unsplash photography. Swap in your own any time.</small>
    </section>
    <section className="inspector-section"><div className="section-row"><span>TEXT LAYOUT (THIS SLIDE)</span></div>
      <Segment label="Alignment" value={s.align ?? ''} options={[{ value: '', label: 'Default' }, { value: 'start', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'Right' }]} onChange={(v) => api.patchSlide('align', String(v))} />
      <Segment label="Position" value={s.valign ?? ''} options={[{ value: '', label: 'Default' }, { value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }]} onChange={(v) => api.patchSlide('valign', String(v))} />
    </section>
  </div>;
}
