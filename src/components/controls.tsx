import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Check } from 'lucide-react';
import type { Ctl, Opt } from '@/lib/schema';
import type { Project } from '@/lib/model';
import { getPath } from '@/lib/utils';
import { Glyph } from './glyphs';

export function Range({ label, value, min, max, step = 1, unit = '', fmt, onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; fmt?: (v: number) => string; onChange: (v: number) => void; hint?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = fmt ? fmt(value) : `${value}${unit && unit !== '°' ? ` ${unit}` : unit}`;
  const commit = (raw: string) => { const n = Number(raw); if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n))); };
  const updateFromPointer = (clientX: number) => {
    const bounds = inputRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || max <= min) return;
    const ratio = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
    const raw = min + ratio * (max - min);
    const next = step > 0 ? min + Math.round((raw - min) / step) * step : raw;
    onChange(Number(Math.min(max, Math.max(min, next)).toPrecision(12)));
  };
  return <div className="ctl-range">
    <div className="range-top"><span>{label}</span><label className="range-num"><input type="number" inputMode="decimal" min={min} max={max} step={step} value={Number.isFinite(value) ? value : 0} aria-label={`${label} value`} onChange={(e) => commit(e.target.value)} /><em>{unit}</em></label></div>
    <input ref={inputRef} className="range-input" type="range" min={min} max={max} step={step} value={value} aria-label={label} aria-valuetext={shown} onChange={(e) => onChange(Number(e.target.value))} onPointerDown={(e) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX);
    }} onPointerMove={(e) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) updateFromPointer(e.clientX);
    }} />
    {hint ? <small className="ctl-hint">{hint}</small> : null}
  </div>;
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return <div className="toggle-row"><span>{label}{hint ? <small className="ctl-hint">{hint}</small> : null}</span><button type="button" role="switch" aria-checked={checked} aria-label={label} className={`switch ${checked ? 'checked' : ''}`} onClick={() => onChange(!checked)}><i /></button></div>;
}

export function Segment({ label, value, options, onChange }: { label: string; value: string | number; options: Opt[]; onChange: (v: string | number) => void }) {
  return <div className="segment-field"><span className="ctl-label">{label}</span><div className="segment" role="radiogroup" aria-label={label}>{options.map((o) => <button type="button" role="radio" aria-checked={o.value === value} key={String(o.value)} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>)}</div></div>;
}

export function SelectField({ label, value, options, onChange, hint }: { label: string; value: string | number; options: Opt[]; onChange: (v: string | number) => void; hint?: string }) {
  return <label className="field-label select-field"><span className="ctl-label">{label}</span><select value={String(value)} onChange={(e) => { const raw = e.target.value; const num = typeof options[0]?.value === 'number'; onChange(num ? Number(raw) : raw); }}>{options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}</select>{hint ? <small className="ctl-hint">{hint}</small> : null}</label>;
}

export function ChoiceGrid({ label, family, value, options, onChange }: { label: string; family: 'layout' | 'motion' | 'formation'; value: string; options: Opt[]; onChange: (v: string) => void }) {
  return <div className="choice-field"><span className="ctl-label">{label}</span><div className="choice-grid" role="group" aria-label={label}>{options.map((o) => <button type="button" key={String(o.value)} aria-pressed={o.value === value} className={`choice-tile ${o.value === value ? 'chosen' : ''}`} onClick={() => onChange(String(o.value))}><Glyph family={family} id={String(o.value)} /><strong>{o.label}</strong>{o.note ? <small>{o.note}</small> : null}{o.value === value ? <Check className="choice-check" size={12} /> : null}</button>)}</div></div>;
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const isColor = /^#[0-9a-f]{6}$/i.test(value);
  return <label className="field-label color-field"><span className="ctl-label">{label}</span><span className="color-input"><input type="color" value={isColor ? value : '#222d34'} onChange={(e) => onChange(e.target.value)} aria-label={label} /><span title={value}>{isColor ? value : 'Gradient'}</span></span></label>;
}

const PAD: { a: number; g: string; t: string }[] = [
  { a: 45, g: '↖', t: 'Up-left' }, { a: 90, g: '↑', t: 'Up' }, { a: 135, g: '↗', t: 'Up-right' },
  { a: 0, g: '←', t: 'Left' }, { a: -1, g: '', t: '' }, { a: 180, g: '→', t: 'Right' },
  { a: 315, g: '↙', t: 'Down-left' }, { a: 270, g: '↓', t: 'Down' }, { a: 225, g: '↘', t: 'Down-right' },
];
/** Arrows show where content travels when you go to the next slide. */
export function DirectionPad({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const norm = ((Math.round(value) % 360) + 360) % 360;
  return <div className="direction-field"><span className="ctl-label">{label}</span><div className="direction-wrap"><div className="direction-pad" role="group" aria-label={label}>{PAD.map((c, i) => c.a < 0
    ? <span key={i} className="pad-dot" aria-hidden="true" />
    : <button type="button" key={i} aria-label={`Content moves ${c.t.toLowerCase()}`} aria-pressed={norm === c.a} className={norm === c.a ? 'on' : ''} onClick={() => onChange(c.a)}>{c.g}</button>)}</div>
    <Range label="Custom angle" value={norm} min={0} max={359} unit="°" onChange={onChange} /></div></div>;
}

/** Drag the two handles to author a cubic-bezier easing curve. */
export function CurveEditor({ value, onChange }: { value: [number, number, number, number]; onChange: (v: [number, number, number, number]) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const W = 200, H = 130, PAD_X = 14, PAD_Y = 30, gw = W - PAD_X * 2, gh = H - PAD_Y * 2;
  const X = (x: number) => PAD_X + x * gw, Y = (y: number) => PAD_Y + (1 - y) * gh;
  const [x1, y1, x2, y2] = value;
  const drag = (which: 0 | 1) => (e: ReactPointerEvent<SVGCircleElement>) => {
    e.preventDefault(); e.stopPropagation();
    const svg = ref.current; if (!svg) return;
    const target = e.currentTarget; target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W, py = ((ev.clientY - r.top) / r.height) * H;
      const nx = Math.min(1, Math.max(0, (px - PAD_X) / gw)), ny = Math.min(1.8, Math.max(-0.8, 1 - (py - PAD_Y) / gh));
      const r2 = (v: number) => Math.round(v * 100) / 100;
      onChange(which === 0 ? [r2(nx), r2(ny), x2, y2] : [x1, y1, r2(nx), r2(ny)]);
    };
    const up = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); target.removeEventListener('pointercancel', up); };
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up);
  };
  return <div className="curve-editor"><svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Custom easing curve cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`}>
    <rect x={PAD_X} y={PAD_Y} width={gw} height={gh} className="curve-box" />
    <path d={`M${X(0)} ${Y(0)} L${X(1)} ${Y(1)}`} className="curve-diag" />
    <path d={`M${X(0)} ${Y(0)} L${X(x1)} ${Y(y1)} M${X(1)} ${Y(1)} L${X(x2)} ${Y(y2)}`} className="curve-handle-line" />
    <path d={`M${X(0)} ${Y(0)} C${X(x1)} ${Y(y1)} ${X(x2)} ${Y(y2)} ${X(1)} ${Y(1)}`} className="curve-line" />
    <circle cx={X(x1)} cy={Y(y1)} r="9" className="curve-knob" onPointerDown={drag(0)} />
    <circle cx={X(x2)} cy={Y(y2)} r="9" className="curve-knob" onPointerDown={drag(1)} />
  </svg><code>cubic-bezier({x1}, {y1}, {x2}, {y2})</code></div>;
}

type ListProps = { controls: Ctl[]; project: Project; onChange: (path: string, value: unknown, coalesce?: boolean) => void; onApply: (fn: (p: Project) => Project) => void };
/** Renders a slice of the schema. Controls whose gate is false are not rendered at all. */
export function ControlList({ controls, project, onChange, onApply }: ListProps) {
  return <div className="control-list">{controls.map((c, i) => {
    if (c.show && !c.show(project)) return null;
    const hint = typeof c.hint === 'function' ? c.hint(project) : c.hint;
    switch (c.kind) {
      case 'range': return <Range key={c.key} label={c.label} value={Number(getPath(project, c.key))} min={c.min} max={c.max} step={c.step} unit={c.unit} fmt={c.fmt} hint={hint} onChange={(v) => onChange(c.key, v, true)} />;
      case 'toggle': return <Toggle key={c.key} label={c.label} hint={hint} checked={Boolean(getPath(project, c.key))} onChange={(v) => onChange(c.key, v)} />;
      case 'segment': return <Segment key={c.key} label={c.label} value={getPath(project, c.key) as string | number} options={c.options} onChange={(v) => onChange(c.key, v)} />;
      case 'select': return <SelectField key={c.key} label={c.label} hint={hint} value={getPath(project, c.key) as string | number} options={c.options} onChange={(v) => onChange(c.key, v)} />;
      case 'choice': return <ChoiceGrid key={c.key} label={c.label} family={c.family} value={String(getPath(project, c.key))} options={c.options} onChange={(v) => (c.onPick ? onApply((p) => c.onPick!(p, v)) : onChange(c.key, v))} />;
      case 'color': return <ColorField key={c.key} label={c.label} value={String(getPath(project, c.key))} onChange={(v) => onChange(c.key, v, true)} />;
      case 'direction': return <DirectionPad key={c.key} label={c.label} value={Number(getPath(project, c.key))} onChange={(v) => onChange(c.key, v, true)} />;
      case 'curve': return <CurveEditor key={`curve-${i}`} value={project.bezier} onChange={(v) => onChange('bezier', v, true)} />;
      case 'actions': return <div className="action-row" key={`act-${i}`}><span className="ctl-label">{c.label}</span><div className="action-chips">{c.items.map((a) => <button type="button" key={a.label} onClick={() => onApply(a.apply)}>{a.label}</button>)}</div></div>;
      case 'note': return <p className="ctl-note" key={`note-${i}`}>{c.text}</p>;
      default: return null;
    }
  })}</div>;
}
