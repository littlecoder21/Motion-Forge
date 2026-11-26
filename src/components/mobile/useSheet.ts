import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

const KEY = 'mf-sheet-frac';
export const SNAPS = [0.3, 0.52, 0.84];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Resizable bottom sheet. Returns the height in px plus props for the drag handle.
 * Drag = free resize; release near a snap point (or with a flick) settles on a snap; the choice is remembered.
 */
export function useSheet(avail: number) {
  const [frac, setFrac] = useState(() => { try { const v = Number(localStorage.getItem(KEY)); return v > 0.15 && v < 0.95 ? v : SNAPS[1]; } catch { return SNAPS[1]; } });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; h: number; t: number; vy: number; ly: number; lt: number } | null>(null);
  const minFrac = Math.min(0.5, 120 / Math.max(avail, 1));
  const maxFrac = 0.9;
  const heightPx = Math.round(clamp(frac, minFrac, maxFrac) * avail);
  useEffect(() => { try { localStorage.setItem(KEY, String(frac)); } catch { /* storage unavailable */ } }, [frac]);

  const settle = useCallback((f: number, vy: number) => {
    const snaps = SNAPS.filter((s) => s >= minFrac);
    if (Math.abs(vy) > 0.5) { // flick: go to the next snap in that direction
      const up = vy < 0;
      const next = up ? snaps.find((s) => s > f + 0.02) ?? snaps[snaps.length - 1] : [...snaps].reverse().find((s) => s < f - 0.02) ?? snaps[0];
      return next;
    }
    const nearest = snaps.reduce((a, b) => (Math.abs(b - f) < Math.abs(a - f) ? b : a));
    return Math.abs(nearest - f) * avail < 28 ? nearest : f; // stay at custom heights unless close to a snap
  }, [avail, minFrac]);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { y: e.clientY, h: heightPx, t: e.timeStamp, vy: 0, ly: e.clientY, lt: e.timeStamp };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current; if (!d) return;
    setFrac(clamp((d.h + (d.y - e.clientY)) / avail, minFrac, maxFrac));
    const dt = e.timeStamp - d.lt; if (dt > 0) { d.vy = (e.clientY - d.ly) / dt; d.ly = e.clientY; d.lt = e.timeStamp; }
  };
  const end = () => {
    const d = drag.current; drag.current = null; setDragging(false);
    if (d) setFrac((f) => settle(f, d.vy));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); setFrac((f) => clamp(f + 0.08, minFrac, maxFrac)); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFrac((f) => clamp(f - 0.08, minFrac, maxFrac)); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFrac((f) => { const i = SNAPS.findIndex((s) => s > f + 0.02); return SNAPS[i === -1 ? 0 : i]; }); }
  };
  const cycle = () => setFrac((f) => { const i = SNAPS.findIndex((s) => s > f + 0.02); return SNAPS[i === -1 ? 0 : i]; });
  return { heightPx, frac, dragging, setFrac, handleProps: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onKeyDown, onDoubleClick: cycle } };
}
