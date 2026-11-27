import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ChevronRight, Download, Eye, Maximize2, Pause, Play, Redo2, Settings2, Undo2 } from 'lucide-react';
import { CATEGORIES, type Sub } from '@/lib/schema';
import { CarouselThemes } from '../CarouselThemes';
import { Preview } from '../Preview';
import { ControlList } from '../controls';
import { PresetLibrary } from '../PresetLibrary';
import { SlideEditor, SlideList } from '../SlideEditor';
import type { EditorApi } from '../editor-types';
import { useSheet } from './useSheet';

export type Shell = {
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; playing: boolean; setPlaying: (v: boolean) => void; openExport: () => void;
  onSelect: (i: number) => void; onAuto: (i: number) => void; ratio: string; setRatio: (r: string) => void; saveState: 'saved' | 'saving'; setName: (n: string) => void;
  viewportH: number; mode: 'mobile' | 'tablet';
};
const RATIOS = ['auto', '16 / 9', '4 / 3', '1 / 1', '9 / 16'];
const parseRatio = (r: string, fallback: number) => { const m = r.match(/([\d.]+)\s*\/\s*([\d.]+)/); return m ? Number(m[1]) / Number(m[2]) : fallback; };

/** Fits a box of the given aspect ratio inside whatever space the sheet leaves free. */
function FitBox({ ratio, children }: { ratio: number; children: (w: number, h: number) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = 12, aw = Math.max(0, box.w - pad * 2), ah = Math.max(0, box.h - pad * 2);
  const w = Math.max(0, Math.min(aw, ah * ratio)), h = ratio ? w / ratio : 0;
  return <div ref={ref} className="m-fit">{w > 8 && h > 8 ? <div className="m-fit-box" style={{ width: w, height: h }}>{children(w, h)}</div> : null}</div>;
}

export function MobileEditor({ api, shell }: { api: EditorApi; shell: Shell }) {
  const { project } = api;
  const [catId, setCatId] = useState('carousel');
  const [subId, setSubId] = useState('layout');
  const [nested, setNested] = useState<string | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const toolbarRef = useRef<HTMLElement>(null);
  const [toolbarH, setToolbarH] = useState(56);
  useEffect(() => { if (toolbarRef.current) setToolbarH(toolbarRef.current.offsetHeight); }, [shell.mode, shell.viewportH]);
  const avail = Math.max(260, shell.viewportH - toolbarH);
  const sheet = useSheet(avail);
  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0];
  const sub: Sub = cat.subs.find((s) => s.id === subId) ?? cat.subs[0];
  const ratioFor = shell.ratio === 'auto' ? (shell.mode === 'mobile' ? '4 / 3' : '16 / 9') : shell.ratio;
  const ratioNum = useMemo(() => parseRatio(ratioFor, 16 / 9), [ratioFor]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollMemo = useRef<Record<string, number>>({});

  const pickCat = (id: string) => { setCatId(id); setSubId(CATEGORIES.find((c) => c.id === id)?.subs[0].id ?? ''); setNested(null); };
  const pickSub = (id: string) => { scrollMemo.current[`${catId}.${subId}`] = bodyRef.current?.scrollTop ?? 0; setSubId(id); setNested(null); };
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = scrollMemo.current[`${catId}.${subId}`] ?? 0; }, [catId, subId]);

  const renderSub = (s: Sub) => {
    if (s.custom === 'slides') return <><SlideList api={api.slides} touch /><SlideEditor api={api.slides} /></>;
    if (s.custom === 'presets') return <PresetLibrary project={project} onApply={api.applyPreset} notify={api.notify} touch />;
    if (s.custom === 'themes') return <CarouselThemes project={project} onApply={(next) => api.apply(() => next)} />;
    return s.controls ? <ControlList controls={s.controls} project={project} onChange={api.set} onApply={api.apply} /> : null;
  };

  const preview = <Preview project={project} playing={shell.playing} onSelect={shell.onSelect} onAuto={shell.onAuto} onPlayState={shell.setPlaying} device={shell.mode === 'mobile' ? 'Mobile' : 'Tablet'} zoom={1} grid={false} safe={false} ratio={ratioFor} fill />;
  const nestedOpen = !!nested && sub.nested;

  return <main className={`m-app ${shell.mode} ${previewOnly ? 'preview-only' : ''}`} style={{ height: shell.viewportH }}>
    <header className="m-toolbar" ref={toolbarRef}>
      <div className="m-brand"><div className="brand-mark"><span /><span /><span /></div></div>
      <input className="m-title" aria-label="Project name" value={project.name} onChange={(e) => shell.setName(e.target.value)} />
      <span className={`m-save ${shell.saveState}`} title={shell.saveState === 'saving' ? 'Saving…' : 'Saved locally'} />
      <button type="button" className="m-icon" aria-label="Undo" onClick={shell.undo} disabled={!shell.canUndo}><Undo2 size={17} /></button>
      <button type="button" className="m-icon" aria-label="Redo" onClick={shell.redo} disabled={!shell.canRedo}><Redo2 size={17} /></button>
      <button type="button" className={`m-icon ${shell.playing ? 'on' : ''}`} aria-label={shell.playing ? 'Pause preview' : 'Play preview'} onClick={() => shell.setPlaying(!shell.playing)}>{shell.playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}</button>
      <button type="button" className="m-export" onClick={shell.openExport}><Download size={15} /><span>Export</span></button>
    </header>

    <section className="m-preview" aria-label="Live preview">
      <div className="m-preview-tools">
        <label className="m-ratio"><span>Ratio</span><select value={shell.ratio} aria-label="Preview aspect ratio" onChange={(e) => shell.setRatio(e.target.value)}>{RATIOS.map((r) => <option key={r} value={r}>{r === 'auto' ? 'Auto' : r.replace(' / ', ':')}</option>)}</select></label>
        <button type="button" className="m-icon small" aria-label="Fullscreen preview" onClick={() => { const el = document.querySelector('.m-fit-box .mf-wrap'); if (el instanceof HTMLElement && el.requestFullscreen) void el.requestFullscreen(); }}><Maximize2 size={15} /></button>
        <button type="button" className="m-icon small" aria-label={previewOnly ? 'Show controls' : 'Focus on preview'} onClick={() => setPreviewOnly((v) => !v)}>{previewOnly ? <Settings2 size={15} /> : <Eye size={15} />}</button>
      </div>
      <FitBox ratio={ratioNum}>{() => preview}</FitBox>
    </section>

    {previewOnly ? <button type="button" className="m-fab" onClick={() => setPreviewOnly(false)}><Settings2 size={16} /> Edit</button> : <section className={`m-sheet ${sheet.dragging ? 'dragging' : ''}`} style={{ height: sheet.heightPx }} aria-label="Controls">
      <div className="m-grip" role="separator" aria-orientation="horizontal" aria-label="Resize controls panel. Drag, or use arrow keys." aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sheet.frac * 100)} tabIndex={0} {...sheet.handleProps}><i /></div>
      <nav className="m-cats" aria-label="Control categories">{CATEGORIES.map((c) => { const Icon = c.icon; return <button type="button" key={c.id} className={c.id === catId ? 'on' : ''} aria-current={c.id === catId ? 'true' : undefined} onClick={() => pickCat(c.id)}><Icon size={18} /><span>{c.label}</span></button>; })}</nav>
      {cat.subs.length > 1 && <nav className="m-subs" aria-label={`${cat.label} groups`}>{cat.subs.map((s) => <button type="button" key={s.id} className={s.id === subId ? 'on' : ''} aria-current={s.id === subId ? 'true' : undefined} onClick={() => pickSub(s.id)}>{s.label}{s.nested ? <ChevronRight size={12} /> : null}</button>)}</nav>}
      <div className="m-bodywrap">
        <div className={`m-body ${nestedOpen ? 'covered' : ''}`} ref={bodyRef}>
          {sub.nested
            ? <button type="button" className="m-launcher" onClick={() => setNested(sub.id)}><span><small>{cat.label.toUpperCase()}</small><strong>{sub.label}</strong>{sub.summary ? <em>{sub.summary(project)}</em> : null}</span><ChevronRight size={18} /></button>
            : renderSub(sub)}
        </div>
        {sub.nested && <div className={`m-nested ${nestedOpen ? 'open' : ''}`} aria-hidden={!nestedOpen}>
          <div className="m-nested-head"><button type="button" onClick={() => setNested(null)}><ArrowLeft size={16} /> Back</button><strong>{sub.label}</strong></div>
          <div className="m-nested-body">{nestedOpen ? renderSub(sub) : null}</div>
        </div>}
      </div>
    </section>}
  </main>;
}
