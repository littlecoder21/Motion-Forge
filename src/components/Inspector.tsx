import { useState } from 'react';
import { ChevronDown, ChevronRight, Type } from 'lucide-react';
import { CATEGORIES } from '@/lib/schema';
import { CarouselThemes } from './CarouselThemes';
import { ControlList } from './controls';
import { SlideEditor } from './SlideEditor';
import type { EditorApi } from './editor-types';

/** Desktop right panel. Renders the same schema as the mobile sheet; sub-groups are collapsible sections instead of nested panels. */
export function Inspector({ api }: { api: EditorApi }) {
  const [tab, setTab] = useState('design');
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const cats = CATEGORIES.filter((c) => c.id !== 'presets');
  const current = cats.find((c) => c.id === tab);
  const active = api.slides.activeSlide;
  return <>
    <div className="inspector-head"><div><span>INSPECTOR</span><small>{tab === 'design' ? (active?.name ?? 'Slide') : current?.label}</small></div></div>
    <div className="inspector-tabs" role="tablist" aria-label="Inspector sections">
      <button type="button" role="tab" aria-selected={tab === 'design'} className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')}><Type size={13} /><span>Design</span></button>
      {cats.map((c) => { const Icon = c.icon; return <button type="button" role="tab" aria-selected={tab === c.id} key={c.id} className={tab === c.id ? 'active' : ''} onClick={() => setTab(c.id)}><Icon size={13} /><span>{c.label}</span></button>; })}
    </div>
    <div className="inspector-content" role="tabpanel">
      {tab === 'design' && <SlideEditor api={api.slides} />}
      {current && current.subs.filter((s) => s.custom !== 'slides').map((s) => {
        const key = `${current.id}.${s.id}`, isClosed = !!closed[key];
        return <section className="inspector-section collapsible" key={key}>
          <button type="button" className="collapse-head" aria-expanded={!isClosed} onClick={() => setClosed((c) => ({ ...c, [key]: !c[key] }))}><span>{s.label.toUpperCase()}</span>{s.summary ? <em>{s.summary(api.project)}</em> : null}{isClosed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}</button>
          {!isClosed && s.custom === 'themes' && <CarouselThemes project={api.project} onApply={(next) => api.apply(() => next)} />}
          {!isClosed && s.controls && <ControlList controls={s.controls} project={api.project} onChange={api.set} onApply={api.apply} />}
        </section>;
      })}
    </div>
    <div className="inspector-footer"><span>Selected slide</span><span className="mono">{String(api.project.active + 1).padStart(2, '0')} / {String(api.project.slides.length).padStart(2, '0')}</span></div>
  </>;
}
