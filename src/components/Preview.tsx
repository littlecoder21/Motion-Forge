import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { createCarousel } from '@/lib/runtime';
import { RUNTIME_CSS } from '@/lib/runtime-css';
import type { Project } from '@/lib/model';

type Props = {
  project: Project; playing: boolean; onSelect: (index: number) => void; onAuto: (index: number) => void; onPlayState: (playing: boolean) => void;
  device: string; zoom: number; grid: boolean; safe: boolean; ratio: string; /** Fill the parent box instead of using the aspect ratio (mobile fit mode). */ fill?: boolean;
};
const CSS_ID = 'mf-runtime-css';
function ensureRuntimeCss() {
  if (document.getElementById(CSS_ID)) return;
  const style = document.createElement('style'); style.id = CSS_ID; style.textContent = RUNTIME_CSS; document.head.appendChild(style);
}

/**
 * Thin React wrapper around the shared motion runtime — the exact function every export ships.
 * React never re-renders slides: the runtime owns the DOM and animates it frame by frame.
 */
export function Preview({ project, playing, onSelect, onAuto, onPlayState, device, zoom, grid, safe, ratio, fill = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<ReturnType<typeof createCarousel> | null>(null);
  const latest = useRef({ project, playing, onSelect, onAuto, onPlayState });
  latest.current = { project, playing, onSelect, onAuto, onPlayState };

  useEffect(() => {
    ensureRuntimeCss();
    const el = host.current; if (!el) return;
    const carousel = createCarousel(el, latest.current.project, {
      preview: true,
      onChange: (index: number, source: string) => (source === 'auto' ? latest.current.onAuto(index) : latest.current.onSelect(index)),
      onPlay: (value: boolean) => latest.current.onPlayState(value),
    });
    carousel.setPlaying(latest.current.playing);
    instance.current = carousel;
    return () => { carousel.destroy(); instance.current = null; };
  }, []);
  useEffect(() => { instance.current?.update(project); }, [project]);
  useEffect(() => { instance.current?.goTo(project.active, true); }, [project.active]);
  useEffect(() => { instance.current?.setPlaying(playing); }, [playing]);

  const style = { '--ratio': ratio, '--zoom': zoom } as CSSProperties;
  return <div className="preview-shell" data-device={device}>
    <div className={`mf-wrap ${fill ? 'fill' : ''}`} style={style}>
      <div ref={host} className="mf-host" />
      {grid && <div className="mf-grid" aria-hidden="true" />}
      {safe && <div className="safe-guides" aria-hidden="true" />}
    </div>
    <div className="canvas-caption"><span><b className="live-dot" /> LIVE PREVIEW</span><span>{Math.round(100 * zoom)}% · {device.toUpperCase()}</span></div>
  </div>;
}
