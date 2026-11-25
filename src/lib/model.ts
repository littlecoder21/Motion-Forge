export type Layout = 'standard' | 'hero' | 'multi' | 'centered' | 'coverflow' | 'stack' | 'vertical' | 'marquee';
export type Motion = 'slide' | 'fade' | 'zoom' | 'lift' | 'elastic';
export type Slide = { id: string; name: string; eyebrow: string; title: string; body: string; cta: string; image: string; color: string; accent: string; focal: string };
export type Project = { version: 1; name: string; layout: Layout; motion: Motion; easing: string; duration: number; interval: number; gap: number; visible: number; autoplay: boolean; loop: boolean; seamlessLoop: boolean; slides: Slide[]; active: number };
const layouts: Layout[] = ['standard', 'hero', 'multi', 'centered', 'coverflow', 'stack', 'vertical', 'marquee'];
const motions: Motion[] = ['slide', 'fade', 'zoom', 'lift', 'elastic'];
const slideFields: (keyof Slide)[] = ['id', 'name', 'eyebrow', 'title', 'body', 'cta', 'image', 'color', 'accent', 'focal'];

export function parseProject(value: unknown): Project | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.version !== 1 ||
    typeof candidate.name !== 'string' ||
    !layouts.includes(candidate.layout as Layout) ||
    !motions.includes(candidate.motion as Motion) ||
    typeof candidate.easing !== 'string' ||
    !['Ease out', 'Ease in out', 'Linear', 'Spring', 'Back'].includes(candidate.easing) ||
    !Number.isFinite(candidate.duration) ||
    !Number.isFinite(candidate.interval) ||
    !Number.isFinite(candidate.gap) ||
    !Number.isFinite(candidate.visible) ||
    typeof candidate.autoplay !== 'boolean' ||
    typeof candidate.loop !== 'boolean' ||
    (candidate.seamlessLoop !== undefined && typeof candidate.seamlessLoop !== 'boolean') ||
    !Array.isArray(candidate.slides) ||
    candidate.slides.length === 0 ||
    !Number.isInteger(candidate.active)
  ) return null;

  const slides = candidate.slides as unknown[];
  if (!slides.every((slide) => {
    if (!slide || typeof slide !== 'object' || Array.isArray(slide)) return false;
    const record = slide as Record<string, unknown>;
    return slideFields.every((field) => typeof record[field] === 'string');
  })) return null;

  return {
    version: 1,
    name: candidate.name,
    layout: candidate.layout as Layout,
    motion: candidate.motion as Motion,
    easing: candidate.easing,
    duration: Math.max(250, Math.min(1800, Number(candidate.duration))),
    interval: Math.max(1200, Math.min(8000, Number(candidate.interval))),
    gap: Math.max(0, Math.min(48, Number(candidate.gap))),
    visible: Math.max(2, Math.min(5, Math.round(Number(candidate.visible)))),
    autoplay: candidate.autoplay,
    loop: candidate.loop,
    seamlessLoop: candidate.seamlessLoop === undefined ? true : candidate.seamlessLoop,
    slides: slides as Slide[],
    active: Math.max(0, Math.min(Number(candidate.active), slides.length - 1)),
  };
}

export const freshSlide = (index: number): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: `Slide ${String(index + 1).padStart(2, '0')}`,
  eyebrow: ['FIELD NOTES / 01', 'NEW COLLECTION', 'STUDIO JOURNAL', 'OBJECTS IN MOTION'][index % 4],
  title: ['A quieter kind of bold.', 'Objects with a point of view.', 'Make room for wonder.', 'Form follows feeling.'][index % 4],
  body: ['A study in shape, light, and the space between.', 'Small details. Considered materials. A little unexpected.', 'A new perspective on the things we live with.', 'A collection made to be seen differently.'][index % 4],
  cta: 'Explore the story', image: '', color: ['#34455a', '#4d4738', '#354d49', '#4c3947'][index % 4],
  accent: ['#c6dbd1', '#e2b78a', '#d4b7a2', '#d7c9aa'][index % 4], focal: '50% 50%',
});
export const initialProject = (): Project => ({
  version: 1, name: 'Motion studies — 01', layout: 'centered', motion: 'slide', easing: 'Ease out', duration: 720, interval: 3600, gap: 20,
  visible: 1, autoplay: false, loop: true, seamlessLoop: true, slides: [freshSlide(0), freshSlide(1), freshSlide(2), freshSlide(3)], active: 0,
});
