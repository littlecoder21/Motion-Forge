import type { ReactNode } from 'react';

const R = (x: number, y: number, w: number, h: number, o = 1, rx = 2) => <rect x={x} y={y} width={w} height={h} rx={rx} opacity={o} />;
const rot = (cx: number, cy: number, a: number, node: ReactNode) => <g transform={`rotate(${a} ${cx} ${cy})`}>{node}</g>;
const line = (d: string, o = 1) => <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity={o} />;

const LAYOUT: Record<string, ReactNode> = {
  standard: <>{R(6, 4, 32, 20)}{R(15, 26, 6, 1.6, 1, 1)}{R(23, 26, 6, 1.6, 0.4, 1)}</>,
  hero: <>{R(2, 3, 40, 24)}{R(7, 17, 14, 2.4, 0.35, 1)}{R(7, 21, 9, 1.8, 0.35, 1)}</>,
  centered: <>{R(1, 8, 8, 14, 0.4)}{R(13, 4, 18, 22)}{R(35, 8, 8, 14, 0.4)}</>,
  multi: <>{R(2, 6, 12, 18)}{R(16, 6, 12, 18, 0.7)}{R(30, 6, 12, 18, 0.45)}</>,
  coverflow: <><path d="M2 8 L11 5 V25 L2 22Z" opacity=".45" /><path d="M42 8 L33 5 V25 L42 22Z" opacity=".45" />{R(14, 3, 16, 24)}</>,
  stack: <>{R(8, 3, 28, 16, 0.3)}{R(6, 7, 32, 16, 0.55)}{R(4, 11, 36, 16)}</>,
  vertical: <>{R(6, 2, 32, 7, 0.4)}{R(6, 11.5, 32, 7)}{R(6, 21, 32, 7, 0.4)}</>,
  marquee: <>{R(1, 8, 9, 14, 0.5)}{R(12, 8, 9, 14)}{R(23, 8, 9, 14, 0.8)}{R(34, 8, 9, 14, 0.4)}</>,
  spotlight: <>{R(15, 3, 14, 24)}<circle cx="7" cy="15" r="4.5" opacity=".35" /><circle cx="37" cy="15" r="4.5" opacity=".35" /></>,
  accordion: <>{R(2, 4, 22, 22)}{R(26, 4, 4, 22, 0.55)}{R(32, 4, 4, 22, 0.4)}{R(38, 4, 4, 22, 0.3)}</>,
  fan: <>{rot(22, 34, -22, R(15, 6, 14, 20, 0.4))}{rot(22, 34, 0, R(15, 4, 14, 22))}{rot(22, 34, 22, R(15, 6, 14, 20, 0.4))}</>,
  wheel: <>{rot(22, 44, -28, R(17, 7, 10, 14, 0.35))}{rot(22, 44, -14, R(17, 4, 10, 14, 0.6))}{rot(22, 44, 0, R(17, 3, 10, 14))}{rot(22, 44, 14, R(17, 4, 10, 14, 0.6))}{rot(22, 44, 28, R(17, 7, 10, 14, 0.35))}</>,
  deck: <>{R(9, 5, 26, 15, 0.3)}{R(7, 9, 30, 15, 0.55)}{R(5, 13, 34, 14)}</>,
  spatial: <><ellipse cx="22" cy="17" rx="17" ry="6" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".5" />{R(16, 4, 12, 18)}{R(3, 12, 7, 10, 0.5)}{R(34, 12, 7, 10, 0.5)}</>,
};
const MOTION: Record<string, ReactNode> = {
  slide: <>{R(3, 6, 20, 18, 0.4)}{R(21, 6, 20, 18)}</>,
  fade: <>{R(5, 5, 24, 18, 0.5)}{R(15, 8, 24, 18, 0.5)}</>,
  zoom: <>{R(3, 3, 38, 24, 0.3)}{R(12, 8, 20, 14)}</>,
  lift: <>{R(6, 3, 32, 14, 0.4)}{R(6, 14, 32, 13)}</>,
  elastic: <>{R(3, 6, 18, 14, 0.4)}{R(23, 6, 18, 14)}{line('M4 26 Q14 18 22 26 T40 26', 0.8)}</>,
  zoomthrough: <>{R(2, 2, 40, 26, 0.25)}{R(10, 7, 24, 16, 0.5)}{R(17, 11, 10, 8)}</>,
  flip: <><path d="M4 6 L20 3 V27 L4 24Z" opacity=".4" /><path d="M40 6 L24 3 V27 L40 24Z" /></>,
  tilt: <>{rot(14, 15, -10, R(3, 7, 20, 16, 0.4))}{rot(30, 15, 10, R(21, 7, 20, 16))}</>,
  depthpush: <>{R(2, 2, 40, 26, 0.25)}{R(9, 7, 26, 16, 0.5)}{R(16, 11, 12, 8)}</>,
  wipe: <>{R(3, 4, 38, 22, 0.35)}<path d="M20 4 H39 a2 2 0 0 1 2 2 V24 a2 2 0 0 1 -2 2 H20Z" /></>,
  diagonal: <>{R(3, 4, 38, 22, 0.35)}<path d="M26 4 H39 a2 2 0 0 1 2 2 V24 a2 2 0 0 1 -2 2 H14Z" /></>,
  circle: <>{R(3, 4, 38, 22, 0.35)}<circle cx="22" cy="15" r="9" /></>,
  blinds: <>{R(3, 4, 38, 22, 0.3)}{R(6, 4, 3, 22, 1, 1)}{R(14, 4, 3, 22, 1, 1)}{R(22, 4, 3, 22, 1, 1)}{R(30, 4, 3, 22, 1, 1)}{R(37, 4, 3, 22, 1, 1)}</>,
  blur: <>{R(3, 6, 22, 18, 0.25)}{R(14, 6, 22, 18, 0.5)}{R(8, 9, 28, 12, 0.35)}</>,
  parallax: <>{R(2, 5, 26, 20, 0.25)}{R(10, 8, 24, 16, 0.5)}{R(18, 11, 22, 12)}</>,
  wave: <><path d="M3 6 H20 Q25 12 20 15 T20 24 H3Z" opacity=".4" /><path d="M24 6 Q29 12 24 15 T24 24 H41 V6Z" /></>,
};
const FORMATION: Record<string, ReactNode> = {
  ring: <><ellipse cx="22" cy="16" rx="17" ry="7" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".4" />{R(16, 7, 12, 16)}{R(2, 11, 7, 9, 0.5)}{R(35, 11, 7, 9, 0.5)}</>,
  cylinder: <>{R(4, 6, 8, 18, 0.4, 1)}{R(13, 5, 18, 20, 1, 1)}{R(32, 6, 8, 18, 0.4, 1)}</>,
  helix: <>{R(15, 11, 14, 8)}{R(3, 3, 9, 6, 0.5)}{R(32, 21, 9, 6, 0.5)}{line('M7 9 Q22 2 37 21', 0.5)}</>,
  spiral: <>{line('M22 15 m0 0 a3 3 0 1 1 3 3 a7 7 0 1 1 -8 -8 a11 11 0 1 1 14 14', 0.9)}</>,
  tunnel: <>{R(3, 2, 38, 26, 0.2)}{R(9, 6, 26, 18, 0.4)}{R(15, 10, 14, 10)}</>,
  wave: <><path d="M2 18 Q9 6 16 16 T30 14 T42 8" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".4" />{R(3, 14, 8, 10, 0.5)}{R(15, 10, 10, 14)}{R(30, 8, 8, 10, 0.6)}</>,
  orbit: <>{rot(22, 15, -14, <ellipse cx="22" cy="15" rx="18" ry="6" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".5" />)}{R(16, 9, 12, 14)}{R(2, 9, 6, 8, 0.5)}{R(36, 14, 6, 8, 0.5)}</>,
  sphere: <><circle cx="22" cy="15" r="12" fill="none" stroke="currentColor" strokeWidth="1.3" opacity=".5" /><ellipse cx="22" cy="15" rx="12" ry="4" fill="none" stroke="currentColor" strokeWidth="1" opacity=".35" />{R(18, 10, 8, 10)}{R(8, 7, 5, 6, 0.5)}{R(31, 19, 5, 6, 0.5)}</>,
  multi: <><ellipse cx="22" cy="19" rx="17" ry="6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".4" /><ellipse cx="22" cy="10" rx="11" ry="4" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".4" />{R(17, 14, 10, 12)}{R(18, 3, 8, 8, 0.6)}</>,
  // Receding staircase climbing to the upper right.
  cascade: <>{R(30, 2, 5, 6, 0.3, 1)}{R(25, 5, 6.5, 8, 0.45, 1)}{R(18, 9, 8.5, 10.5, 0.65, 1)}{R(9, 14, 11, 13, 1, 1.5)}</>,
  // Parallel slanted plates stepping along a diagonal.
  isometric: <>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${5 + i * 7} ${22 - i * 3} l5 -4 v13 l-5 4Z`} opacity={0.4 + i * 0.15} />)}</>,
  // Horseshoe of cards riding an ellipse.
  arc: <><path d="M6 24 A16 14 0 1 1 38 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".4" />{rot(22, 29, -62, R(18, 3, 7, 9, 0.5))}{rot(22, 29, -24, R(18, 1, 8, 10, 0.75))}{rot(22, 29, 24, R(18, 1, 8, 10, 0.75))}{rot(22, 29, 62, R(18, 3, 7, 9, 0.5))}{R(17, 19, 10, 9)}</>,
  // Tiles lining a tube that runs away from the viewer.
  vortex: <><circle cx="22" cy="15" r="13" fill="none" stroke="currentColor" strokeWidth="1" opacity=".3" /><circle cx="22" cy="15" r="7.5" fill="none" stroke="currentColor" strokeWidth="1" opacity=".4" /><circle cx="22" cy="15" r="3" fill="none" stroke="currentColor" strokeWidth="1" opacity=".5" />
    {[0, 60, 120, 180, 240, 300].map((a) => rot(22, 15, a, R(19.5, 1.5, 5, 5.5, 0.85, 1)))}{[30, 90, 150, 210, 270, 330].map((a) => rot(22, 15, a, R(20.5, 7.4, 3, 3, 0.55, 0.6)))}</>,
};
/** Small schematic icons so every layout / transition / formation is recognisable at a glance. */
export function Glyph({ family, id }: { family: 'layout' | 'motion' | 'formation'; id: string }) {
  const map = family === 'layout' ? LAYOUT : family === 'motion' ? MOTION : FORMATION;
  return <svg className="glyph" viewBox="0 0 44 30" width="44" height="30" fill="currentColor" aria-hidden="true">{map[id] ?? null}</svg>;
}
