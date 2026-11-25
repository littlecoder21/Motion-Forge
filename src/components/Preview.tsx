import { useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight } from 'lucide-react';
import type { Project } from '../lib/model';

type Props = { project: Project; onSelect: (index: number) => void; device: string; zoom: number; grid: boolean; safe: boolean; ratio: string };
export function Preview({ project, onSelect, device, zoom, grid, safe, ratio }: Props) {
 const start = useRef<number | null>(null);
 const active = project.slides[project.active] ?? project.slides[0];
 const isVertical = project.layout === 'vertical';
  const renderedSlides = project.layout === 'marquee' ? [...project.slides, ...project.slides] : project.slides;
 const slideDelta = (index: number) => {
 const difference = index - project.active;
 if (!project.loop || !project.seamlessLoop || project.slides.length < 2) return difference;
 return ((difference + project.slides.length / 2) % project.slides.length + project.slides.length) % project.slides.length - project.slides.length / 2;
 };
 const slideStyle = (index: number): CSSProperties => {
 const delta = slideDelta(index);
  let transform = '';
  if (project.layout === 'standard' || project.layout === 'hero') {
   if (project.motion === 'slide' || project.motion === 'elastic') transform = `translateX(${delta * 100}%)`;
   if (project.motion === 'zoom') transform = `scale(${index === project.active ? 1 : .9})`;
   if (project.motion === 'lift') transform = `translateY(${index === project.active ? 0 : 14}%)`;
  }
  if (project.layout === 'vertical') {
   if (project.motion === 'slide' || project.motion === 'elastic') transform = `translateY(${delta * 100}%)`;
   if (project.motion === 'zoom') transform = `scale(${index === project.active ? 1 : .9})`;
   if (project.motion === 'lift') transform = `translateY(${index === project.active ? 0 : 14}%)`;
  }
  if (project.layout === 'centered') transform = `translateX(calc(${delta} * (100% + var(--gap)))) scale(${index === project.active ? 1 : .82})`;
  if (project.layout === 'multi') transform = `translateX(calc(${delta} * (100% + var(--gap))))`;
  if (project.layout === 'coverflow') transform = `translateX(${delta * 16}%) rotateY(${delta * -22}deg) scale(${index === project.active ? 1 : .78})`;
  if (project.layout === 'stack') transform = `translate(${delta * 10}px, ${Math.abs(delta) * 12}px) rotate(${delta * 2}deg) scale(${Math.max(.78, 1 - Math.abs(delta) * .06)})`;
  return { backgroundColor: project.slides[index].color, backgroundImage: project.slides[index].image ? `linear-gradient(0deg, rgba(8,13,15,.82), rgba(8,13,15,.04) 75%), url("${project.slides[index].image}")` : `radial-gradient(ellipse at 80% 12%, ${project.slides[index].accent}55, transparent 43%)`, backgroundPosition: project.slides[index].focal, transform, zIndex: 20 - Math.abs(delta), opacity: project.layout === 'coverflow' && Math.abs(delta) > 2 ? .2 : 1 } as CSSProperties;
 };
 const pointerDown = (event: PointerEvent<HTMLDivElement>) => { start.current = isVertical ? event.clientY : event.clientX; };
 const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
  if (start.current === null) return;
  const end = isVertical ? event.clientY : event.clientX; const distance = end - start.current;
  if (Math.abs(distance) > 42) {
   const next = project.active + (distance < 0 ? 1 : -1);
   onSelect(project.loop ? (next + project.slides.length) % project.slides.length : Math.max(0, Math.min(project.slides.length - 1, next)));
  }
  start.current = null;
 };
 const go = (dir: number) => {
  const next = project.active + dir;
  onSelect(project.loop ? (next + project.slides.length) % project.slides.length : Math.max(0, Math.min(project.slides.length - 1, next)));
 };
 const visible = project.layout === 'multi' ? Math.max(2, project.visible) : project.layout === 'centered' ? 1.35 : 1;
 return <div className="preview-shell" data-device={device}>
   <div className={`preview-canvas ${project.layout} ${grid ? 'show-grid' : ''}`} style={{ '--zoom': zoom, '--gap': `${project.gap}px`, '--visible': visible, '--duration': `${project.duration}ms`, '--curve': project.easing === 'Spring' || project.easing === 'Back' ? 'cubic-bezier(.34,1.56,.64,1)' : project.easing === 'Linear' ? 'linear' : project.easing === 'Ease in out' ? 'cubic-bezier(.4,0,.2,1)' : 'cubic-bezier(.22,.75,.25,1)', aspectRatio: ratio } as CSSProperties}
   onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={() => { start.current = null; }} onKeyDown={e => { if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); go(-1); } }} tabIndex={0} aria-label="Carousel preview. Use arrow keys to change slides.">
   {safe && <div className="safe-guides" aria-hidden="true" />}
   <div className={`preview-track ${isVertical ? 'vertical-track' : ''}`} style={project.layout === 'marquee' ? { animationDuration: `${Math.max(9, 30 - project.duration / 100)}s` } : undefined}>
     {renderedSlides.map((slide, renderedIndex) => {
      const i = renderedIndex % project.slides.length;
      const delta = slideDelta(i);
     const allowed = project.layout === 'standard' || project.layout === 'hero' || project.layout === 'vertical' ? i === project.active : Math.abs(delta) <= (project.layout === 'marquee' ? project.slides.length : project.layout === 'multi' ? 3 : 2);
      return <article className={`preview-slide ${i === project.active ? 'selected' : ''} ${allowed ? 'visible-slide' : 'away'}`} key={`${slide.id}-${renderedIndex}`} style={slideStyle(i)} onClick={() => onSelect(i)} aria-current={i === project.active ? 'true' : undefined}>
      <div className="slide-sheen" />
      <div className="slide-copy"><div className="eyebrow"><i />{slide.eyebrow}</div><h2>{slide.title}</h2><p>{slide.body}</p><span className="story-link">{slide.cta}<ArrowUpRight size={14} /></span></div>
      <span className="slide-index mono">{String(i + 1).padStart(2, '0')} <span>/ {String(project.slides.length).padStart(2, '0')}</span></span>
     </article>;
    })}
   </div>
   {project.layout !== 'marquee' && <div className="preview-nav">
    <div className="pagination">{project.slides.map((slide, i) => <button key={slide.id} aria-label={`Go to slide ${i + 1}`} className={i === project.active ? 'current' : ''} onClick={e => { e.stopPropagation(); onSelect(i); }} />)}</div>
     <div className="arrow-pair"><button aria-label="Previous slide" disabled={!project.loop && project.active === 0} onClick={e => { e.stopPropagation(); go(-1); }}>{isVertical ? <ArrowUp size={16} /> : <ArrowLeft size={16} />}</button><button aria-label="Next slide" disabled={!project.loop && project.active === project.slides.length - 1} onClick={e => { e.stopPropagation(); go(1); }}>{isVertical ? <ArrowDown size={16} /> : <ArrowRight size={16} />}</button></div>
   </div>}
   {project.layout === 'marquee' && <div className="marquee-label mono">CONTINUOUS / LOOP</div>}
  </div>
  <div className="canvas-caption"><span><b className="live-dot" /> LIVE PREVIEW</span><span>{Math.round(100 * zoom)}% · {device.toUpperCase()}</span></div>
 </div>;
}
