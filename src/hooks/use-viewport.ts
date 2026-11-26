import { useEffect, useState } from 'react';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';
const read = () => {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const w = window.innerWidth, h = vv ? vv.height : window.innerHeight;
  const mode: ViewportMode = w < 700 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  return { w, h, mode };
};
/** Window size + layout mode. Uses visualViewport so the on-screen keyboard shrinks the editor instead of hiding it. */
export function useViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    window.visualViewport?.addEventListener('resize', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
      window.visualViewport?.removeEventListener('resize', on);
    };
  }, []);
  return vp;
}
