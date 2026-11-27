import {
  defaultFx, defaultLayers, defaultLook, defaultNav, defaultSpatial, freshSlide, normalizeProject,
  type Fx, type Layers, type Layout, type Look, type Motion, type Nav, type Project, type Spatial,
} from './model';

export type PresetPatch = Partial<Pick<Project, 'layout' | 'motion' | 'motionOut' | 'easing' | 'duration' | 'gap' | 'visible' | 'angle' | 'loop' | 'seamlessLoop'>> & {
  fx?: Partial<Fx>; spatial?: Partial<Spatial>; nav?: Partial<Nav>; look?: Partial<Look>; layers?: Partial<Layers>;
};
export type Preset = {
  name: string; category: string; layout: Layout; motion: Motion; easing: string; duration: number; visible: number; gap: number; note: string; tone: string;
  patch?: PresetPatch;
  /** Presets that need a crowd (rings, tunnels, cascades) top the slide list up with sample slides. Never removes yours. */
  minSlides?: number;
};

/** Library order = tab order. */
export const PRESET_CATEGORIES = [
  'Coverflow & albums', 'Rings & carousels', 'Panoramas & drums', 'Arcs & wheels', 'Tunnels & spirals', 'Cascades & rails',
  'Stacks & decks', 'Focus & cards', 'Slide transitions', 'Kinetic', 'Continuous',
] as const;

// Layer recipes: image-only galleries read like the reference art; captions keep just the headline.
const IMAGES_ONLY: Partial<Layers> = { overlay: false, eyebrow: false, title: false, body: false, cta: false, index: false };
const CAPTION: Partial<Layers> = { eyebrow: false, body: false, cta: false, index: false };

type Opts = { min?: number; easing?: string; duration?: number };
const P = (name: string, category: (typeof PRESET_CATEGORIES)[number], note: string, tone: string, patch: PresetPatch, o: Opts = {}): Preset => {
  const layout = patch.layout ?? 'standard', motion = patch.motion ?? 'slide', easing = patch.easing ?? o.easing ?? 'Expo out', duration = patch.duration ?? o.duration ?? 900;
  return {
    name, category, layout, motion, easing, duration, visible: patch.visible ?? 1, gap: patch.gap ?? 20, note, tone, minSlides: o.min,
    patch: { ...patch, layout, motion, easing, duration },
  };
};
const sp = (spatial: Partial<Spatial>, look: Partial<Look> = {}, layers?: Partial<Layers>, extra: PresetPatch = {}): PresetPatch => ({ layout: 'spatial', ...extra, spatial, look, layers });

export const presets: Preset[] = [
  // ───────────── Coverflow & albums ─────────────
  P('Album Coverflow', 'Coverflow & albums', 'Square covers on a dark stage with a glossy floor reflection.', '#2e2e2e',
    { layout: 'coverflow', gap: 46, look: { stage: '#2c2c2c', cardW: 30, cardH: 54, radius: 3, shadow: 70, reflect: 65 }, layers: IMAGES_ONLY, fx: { intensity: 150, depth: 150 } }, { min: 9, easing: 'Expo out' }),
  P('Gallery Light', 'Coverflow & albums', 'A bright gallery wall: soft shadows, large centre piece, calm neighbours.', '#d9d5e6',
    { layout: 'coverflow', gap: 40, look: { stage: '#f3f1f7', cardW: 26, cardH: 70, radius: 16, shadow: 45 }, layers: IMAGES_ONLY, fx: { intensity: 80, depth: 70 } }, { min: 9 }),
  P('Glass Coverflow', 'Coverflow & albums', 'Frosted frames around every photo, with a quiet floor reflection.', '#34424f',
    { layout: 'coverflow', gap: 42, look: { stage: '#10151b', cardW: 28, cardH: 62, radius: 18, shadow: 55, cardStyle: 'glass', reflect: 30 }, layers: CAPTION, fx: { intensity: 120 } }, { min: 9 }),
  P('Polaroid Coverflow', 'Coverflow & albums', 'Photo prints with white borders and a caption strip.', '#6b6258',
    { layout: 'coverflow', gap: 40, look: { stage: '#1a1816', cardW: 24, cardH: 72, radius: 4, shadow: 60, cardStyle: 'polaroid', frame: 4 }, layers: CAPTION, fx: { intensity: 110 } }, { min: 9 }),
  P('Neon Coverflow', 'Coverflow & albums', 'Glowing edges on the active card; the rest fall back into the dark.', '#2b3a58',
    { layout: 'coverflow', gap: 42, look: { stage: '#0a0c12', cardW: 26, cardH: 64, radius: 10, shadow: 0, cardStyle: 'glow', glow: 70 }, layers: IMAGES_ONLY, fx: { intensity: 130, depth: 120 } }, { min: 9 }),
  P('Peek Carousel', 'Coverflow & albums', 'A centred stage with its neighbours peeking in from both sides.', '#3a4d5c',
    { layout: 'centered', gap: 18, look: { stage: '#161b20', cardW: 50, cardH: 76, radius: 20, shadow: 50 }, layers: CAPTION }, { min: 6, easing: 'Expo out' }),

  // ───────────── Rings & carousels ─────────────
  P('Orbit Gallery', 'Rings & carousels', 'A curved gallery wall that turns toward the active card.', '#35506a',
    sp({ formation: 'ring', spacing: 34, radius: 52, cardW: 28, cardH: 64, pitch: -4 }, { stage: '#14181d', shadow: 55 }), { min: 10 }),
  P('Polaroid Ring', 'Rings & carousels', 'A floating band of framed prints, tipped toward you.', '#4a4338',
    sp({ formation: 'ring', spacing: 25, radius: 58, cardW: 19, cardH: 44, pitch: -20, roll: -4, elevation: -9, depthFade: 25, perspective: 1100 },
      { stage: '#08090c', shadow: 60, cardStyle: 'polaroid', frame: 4, radius: 3 }, CAPTION), { min: 14 }),
  P('Glow Ring', 'Rings & carousels', 'Two interleaved rings of tall cards with a soft edge glow.', '#2a2a3a',
    sp({ formation: 'multi', spacing: 20, radius: 44, cardW: 13, cardH: 44, pitch: -10, depthFade: 45, lighting: 40 },
      { stage: '#050505', shadow: 0, cardStyle: 'glow', glow: 60, radius: 5 }, IMAGES_ONLY), { min: 18 }),
  P('Floor Carousel', 'Rings & carousels', 'A ring seen from above, glowing, with reflections on the floor.', '#3a3a3a',
    sp({ formation: 'ring', spacing: 30, radius: 44, cardW: 16, cardH: 38, pitch: -20, elevation: -6, depthFade: 40, mouseTilt: 8, perspective: 1300 },
      { stage: '#141414', shadow: 0, cardStyle: 'glow', glow: 50, reflect: 45, radius: 4 }, IMAGES_ONLY), { min: 12 }),
  P('Pastel Ring', 'Rings & carousels', 'Soft rounded cards drifting around a dark stage.', '#5a4a6a',
    sp({ formation: 'ring', spacing: 26, radius: 46, cardW: 17, cardH: 52, pitch: -8, depthFade: 25, lighting: 25 }, { stage: '#0f1114', radius: 22, shadow: 40 }, IMAGES_ONLY), { min: 14 }),
  P('Halo Orbit', 'Rings & carousels', 'Cards orbit an invisible axis and always face you.', '#41506a',
    sp({ formation: 'orbit', facing: 'front', pitch: -12, vRadius: 20, radius: 44, cardW: 22, cardH: 54 }, { stage: '#12161b' }), { min: 8 }),
  P('Floating Gallery', 'Rings & carousels', 'Slow auto-rotation with mouse parallax.', '#3b4d6b',
    sp({ formation: 'ring', spacing: 34, radius: 52, cardW: 28, cardH: 64, autoRotate: true, speed: 9, mouseTilt: 10 }, { stage: '#14181d', shadow: 55 }, undefined, { easing: 'Linear' }), { min: 10 }),
  P('Double Ring', 'Rings & carousels', 'Two staggered rings for dense collections.', '#4f4a3a',
    sp({ formation: 'multi', cardW: 22, cardH: 44, radius: 46, spacing: 30 }, { stage: '#14181d' }), { min: 14 }),
  P('Planet', 'Rings & carousels', 'Slides distributed over a sphere.', '#33465a',
    sp({ formation: 'sphere', radius: 32, cardW: 22, cardH: 46, depthFade: 30 }, { stage: '#0e1217' }, undefined, { duration: 1000 }), { min: 14 }),

  // ───────────── Panoramas & drums ─────────────
  P('Slat Panorama', 'Panoramas & drums', 'Narrow upright slats on a wide curve, brightest in the centre.', '#4a4a4a',
    sp({ formation: 'ring', spacing: 8.5, radius: 78, cardW: 9.5, cardH: 64, depthFade: 40, lighting: 35, pitch: 0, mouseTilt: 4 }, { stage: '#1b1b1b', radius: 2, shadow: 0 }, IMAGES_ONLY), { min: 15 }),
  P('Inner Panorama', 'Panoramas & drums', 'Stand inside the cylinder: a wide curved band of tall photos.', '#c9c2bd',
    sp({ formation: 'ring', facing: 'in', spacing: 11, radius: 64, cardW: 14, cardH: 56, depthFade: 0, lighting: 0, perspective: 900, mouseTilt: 3 },
      { stage: '#f8f4f3', radius: 3, shadow: 18 }, IMAGES_ONLY), { min: 12 }),
  P('Perspective Row', 'Panoramas & drums', 'Rounded cards with gaps, bending toward you like a curved screen.', '#d8d4cf',
    sp({ formation: 'ring', facing: 'in', spacing: 13, radius: 62, cardW: 12.5, cardH: 52, depthFade: 0, lighting: 0, perspective: 900, mouseTilt: 3 },
      { stage: '#fbfaf8', radius: 18, shadow: 20 }, IMAGES_ONLY), { min: 12 }),
  P('Story Drum', 'Panoramas & drums', 'A turning drum of tall story cards.', '#7a4a1e',
    sp({ formation: 'cylinder', cardW: 20, cardH: 78, pitch: -4, depthFade: 30, lighting: 30, activeScale: 100, activeLift: 0, mouseTilt: 8 }, { stage: '#26160c', radius: 12, shadow: 40 }, CAPTION, { gap: 6 }), { min: 8 }),
  P('Glass Cylinder', 'Panoramas & drums', 'Edge-to-edge panels wrapped around a cylinder.', '#3d5a52',
    sp({ formation: 'cylinder', cardW: 24, depthFade: 40, lighting: 30, pitch: -6 }, { stage: '#10171a' }, undefined, { easing: 'Ease in out' }), { min: 8 }),

  // ───────────── Arcs & wheels ─────────────
  P('Riffle Arc', 'Arcs & wheels', 'A horseshoe of rounded cards that riffles past as you scroll.', '#3a3a40',
    sp({ formation: 'arc', radius: 30, vRadius: 26, spacing: 22, cardW: 12, cardH: 30, yaw: 24, pitch: -6, depthFade: 20, lighting: 25, perspective: 1300, elevation: -4 },
      { stage: '#0e0e10', radius: 14, shadow: 45 }, IMAGES_ONLY), { min: 15 }),
  P('Horizon Wheel', 'Arcs & wheels', 'Upright cards riding a wide ellipse like a Ferris wheel.', '#40505e',
    sp({ formation: 'arc', facing: 'front', radius: 38, vRadius: 26, spacing: 26, cardW: 15, cardH: 36, depthFade: 30, perspective: 1400 }, { stage: '#12171c', radius: 12 }, CAPTION), { min: 12 }),
  P('Arc Wheel', 'Arcs & wheels', 'A circular gallery that rolls under the viewer.', '#364a5c',
    { layout: 'wheel', look: { stage: '#12171c' } }, { min: 8, easing: 'Ease out', duration: 800 }),
  P('Wave Runner', 'Arcs & wheels', 'A rolling sine wave of cards.', '#5a4555',
    sp({ formation: 'wave', amplitude: 16, cardW: 26, depthFade: 35 }, { stage: '#16131a' }, undefined, { easing: 'Ease out', duration: 850 }), { min: 10 }),

  // ───────────── Tunnels & spirals ─────────────
  P('Wormhole', 'Tunnels & spirals', 'Fly down a tube lined with photographs.', '#2a2a2a',
    sp({ formation: 'vortex', radius: 52, spacing: 40, depthStep: 13, cardW: 18, cardH: 34, depthFade: 30, lighting: 12, perspective: 800, mouseTilt: 6 },
      { stage: '#060606', radius: 3, shadow: 0 }, IMAGES_ONLY), { min: 28, duration: 1000 }),
  P('Deep Tunnel', 'Tunnels & spirals', 'Slides recede into depth with a gentle twist.', '#2f4153',
    sp({ formation: 'tunnel', twist: 14, depthFade: 65, cardW: 34, cardH: 70 }, { stage: '#0e1217' }, undefined, { duration: 950 }), { min: 8 }),
  P('Spiral Gallery', 'Tunnels & spirals', 'Small slanted tiles on a wide ring, brightest at the front.', '#33333a',
    sp({ formation: 'ring', spacing: 12, radius: 62, cardW: 12, cardH: 34, cardYaw: 32, pitch: -4, depthFade: 35, lighting: 30, perspective: 1100 }, { stage: '#111113', radius: 4, shadow: 30 }, IMAGES_ONLY), { min: 20 }),
  P('Helix Tower', 'Tunnels & spirals', 'Cards climb a spiral staircase as you rotate.', '#4a4a66',
    sp({ formation: 'helix', spacing: 42, rise: 16, pitch: -10, cardW: 24, cardH: 56 }, { stage: '#12131b' }, undefined, { duration: 950 }), { min: 10 }),
  P('Inward Spiral', 'Tunnels & spirals', 'Slides wind in toward a vanishing point.', '#3f4a5a',
    sp({ formation: 'spiral', spacing: 30, radius: 50, rise: 10, cardW: 22, cardH: 52, pitch: -8 }, { stage: '#10151a' }), { min: 12 }),

  // ───────────── Cascades & rails ─────────────
  P('Cascade Stairs', 'Cascades & rails', 'A staircase of cards receding up and to the right.', '#1c1c1c',
    sp({ formation: 'cascade', spacing: 62, rise: 7, depthStep: 26, cardW: 28, cardH: 46, depthFade: 50, lighting: 35, perspective: 1500 }, { stage: '#000000', radius: 4, shadow: 0 }, IMAGES_ONLY), { min: 14 }),
  P('Cascade Light', 'Cascades & rails', 'The same staircase on a bright stage with soft shadows.', '#d6dae0',
    sp({ formation: 'cascade', spacing: 58, rise: 7, depthStep: 22, cardW: 27, cardH: 48, depthFade: 40, lighting: 20, perspective: 1500 }, { stage: '#f2f4f7', radius: 14, shadow: 40 }, IMAGES_ONLY), { min: 14 }),
  P('Isometric Plates', 'Cascades & rails', 'Parallel plates stepping along a diagonal, like pages of a book.', '#e4e4e4',
    sp({ formation: 'isometric', spacing: 44, rise: 9, cardW: 24, cardH: 56, cardYaw: -52, cardPitch: 8, depthFade: 0, lighting: 0, activeScale: 100, activeLift: 0, perspective: 1800 },
      { stage: '#ffffff', radius: 5, shadow: 35 }, IMAGES_ONLY), { min: 12 }),
  P('Isometric Night', 'Cascades & rails', 'Dark isometric plates with a soft edge glow.', '#26262e',
    sp({ formation: 'isometric', spacing: 44, rise: 9, cardW: 22, cardH: 54, cardYaw: -50, cardPitch: 6, depthFade: 35, lighting: 30, activeScale: 104, activeLift: 20, perspective: 1800 },
      { stage: '#08090d', radius: 6, shadow: 0, cardStyle: 'glow', glow: 40 }, IMAGES_ONLY), { min: 12 }),

  // ───────────── Stacks & decks ─────────────
  P('Infinite Deck', 'Stacks & decks', 'Swipe the top card away; it returns to the bottom of the deck.', '#3f4b43',
    { layout: 'deck', look: { stage: '#14191c' } }, { min: 6, easing: 'Expo out', duration: 700 }),
  P('Card Pile', 'Stacks & decks', 'Overlapping cards, depth-ranked, with a lift on the top one.', '#4a4f5a',
    { layout: 'stack', motion: 'lift', look: { stage: '#161a20', cardW: 60 } }, { min: 6 }),
  P('Layered Stack', 'Stacks & decks', 'A compact stack where scale and depth do the talking.', '#3a4a52',
    { layout: 'stack', motion: 'zoom', look: { stage: '#12171c', cardW: 64, radius: 22 } }, { min: 6, easing: 'Ease out', duration: 800 }),
  P('Fan Out', 'Stacks & decks', 'Cards fan out from a bottom pivot like a hand of cards.', '#55404a',
    { layout: 'fan', look: { stage: '#17141a' } }, { min: 7, easing: 'Spring', duration: 800 }),

  // ───────────── Focus & cards ─────────────
  P('Spotlight Focus', 'Focus & cards', 'The active card is lit; neighbours fall back, dim and soften.', '#2f4547',
    { layout: 'spotlight', fx: { blur: 14 }, look: { stage: '#0f1416' } }, { min: 7 }),
  P('Accordion Reveal', 'Focus & cards', 'Panels expand horizontally to reveal the selection.', '#4a3f3a',
    { layout: 'accordion', gap: 8, look: { cardW: 70, stage: '#16120f' } }, { min: 5, easing: 'Quart in out', duration: 750 }),
  P('Card Row', 'Focus & cards', 'Three cards across, easy to browse.', '#3c4a58',
    { layout: 'multi', visible: 3, gap: 16, look: { stage: '#12161b', cardH: 80, radius: 18 }, layers: CAPTION }, { min: 6, easing: 'Ease out', duration: 700 }),
  P('Wide Gallery', 'Focus & cards', 'Four slim cards in a wide, quick-to-scan catalogue.', '#454b4f',
    { layout: 'multi', visible: 4, gap: 10, look: { stage: '#101316', cardH: 84, radius: 10 }, layers: IMAGES_ONLY }, { min: 8, easing: 'Ease out', duration: 650 }),

  // ───────────── Slide transitions ─────────────
  P('Classic Slide', 'Slide transitions', 'A clean, direct slide for everyday stories.', '#3c5555', { layout: 'standard', motion: 'slide' }, { easing: 'Ease out', duration: 720 }),
  P('Crossfade', 'Slide transitions', 'Quiet dissolve with no spatial movement.', '#51433f', { layout: 'standard', motion: 'fade' }, { easing: 'Ease in out', duration: 900 }),
  P('Soft Lift', 'Slide transitions', 'The next frame rises gently into place.', '#374759', { layout: 'standard', motion: 'lift' }, { easing: 'Ease out', duration: 800 }),
  P('Zoom In', 'Slide transitions', 'Scale-led navigation with a gentle settle.', '#55485a', { layout: 'standard', motion: 'zoom' }, { easing: 'Ease out', duration: 800 }),
  P('Tilt Slide', 'Slide transitions', 'Slides travel with a slight turn.', '#405348', { layout: 'standard', motion: 'tilt', fx: { intensity: 100 } }, { easing: 'Ease out', duration: 850 }),
  P('Vertical Slide', 'Slide transitions', 'An editorial vertical progression.', '#4e493c', { layout: 'vertical', motion: 'slide', angle: 90 }, { easing: 'Expo out', duration: 800 }),
  P('Cinematic Push', 'Slide transitions', 'Slow camera push across an immersive full-bleed frame.', '#2c4a58', { layout: 'hero', motion: 'zoom' }, { easing: 'Ease in out', duration: 1100 }),
  P('Wipe Reveal', 'Slide transitions', 'A clean directional wipe across the frame.', '#3b4a5e', { layout: 'standard', motion: 'wipe' }, { easing: 'Quart in out', duration: 900 }),
  P('Diagonal Slice', 'Slide transitions', 'A diagonal reveal that follows your finger.', '#5a4650', { layout: 'standard', motion: 'diagonal' }, { easing: 'Quart in out', duration: 950 }),
  P('Iris Open', 'Slide transitions', 'A circular iris opens onto the next slide.', '#32495a', { layout: 'hero', motion: 'circle' }, { easing: 'Expo out', duration: 1000 }),
  P('Venetian Blinds', 'Slide transitions', 'Eight slats open in sequence.', '#4c4a38', { layout: 'standard', motion: 'blinds' }, { easing: 'Ease in out', duration: 900 }),
  P('Liquid Edge', 'Slide transitions', 'The reveal edge ripples like water.', '#2f4b52', { layout: 'hero', motion: 'wave' }, { easing: 'Ease in out', duration: 1100 }),
  P('Card Flip', 'Slide transitions', 'A single-sided 3D flip.', '#4a3d58', { layout: 'standard', motion: 'flip' }, { easing: 'Ease in out', duration: 900 }),
  P('Dolly Zoom', 'Slide transitions', 'Fly through the old slide into the new one.', '#2e4756', { layout: 'hero', motion: 'zoomthrough' }, { easing: 'Expo out', duration: 1000 }),
  P('Depth Push', 'Slide transitions', 'The old slide pushes toward you; the new one rises from depth.', '#3a4a60', { layout: 'hero', motion: 'depthpush' }, { easing: 'Expo out', duration: 1000 }),
  P('Parallax Panorama', 'Slide transitions', 'Background, copy and card move at different speeds.', '#364b45', { layout: 'hero', motion: 'parallax', fx: { intensity: 110 } }, { easing: 'Expo out', duration: 1000 }),
  P('Focus Pull', 'Slide transitions', 'Out-of-focus cross-dissolve, like a rack focus.', '#443e58', { layout: 'hero', motion: 'blur', fx: { blur: 18 } }, { easing: 'Ease in out', duration: 900 }),

  // ───────────── Kinetic ─────────────
  P('Spring Slide', 'Kinetic', 'Real spring physics with a natural settle.', '#40495a', { layout: 'standard', motion: 'elastic', fx: { spring: true, stiffness: 190, damping: 17 } }, { easing: 'Spring', duration: 800 }),
  P('Heavy Glide', 'Kinetic', 'Weighty, momentum-driven coverflow with staggered cards.', '#3a4552',
    { layout: 'coverflow', fx: { spring: true, stiffness: 120, damping: 20, stagger: 60, inertia: 80 }, look: { stage: '#12161b' } }, { min: 7, easing: 'Spring', duration: 800 }),
  P('Domino Stagger', 'Kinetic', 'Each card follows the last a beat later.', '#4a4538', { layout: 'centered', fx: { stagger: 90 }, look: { stage: '#16140f' } }, { min: 6, easing: 'Expo out', duration: 900 }),
  P('Mobile Snap', 'Kinetic', 'Tuned for touch: short travel, strong snap.', '#35504a', { layout: 'centered', visible: 1, look: { cardW: 82, stage: '#101614' }, fx: { inertia: 70 } }, { min: 5, easing: 'Expo out', duration: 520 }),

  // ───────────── Continuous ─────────────
  P('Marquee Strip', 'Continuous', 'Seamless continuous horizontal movement.', '#3c4a4a', { layout: 'marquee', look: { stage: '#12161a', cardH: 80 }, fx: { speed: 60 } }, { min: 5, easing: 'Linear' }),
  P('Slow Ribbon', 'Continuous', 'A slow, light ribbon of imagery.', '#46424a', { layout: 'marquee', look: { stage: '#14121a', cardH: 64, radius: 22 }, fx: { speed: 28 }, layers: IMAGES_ONLY }, { min: 5, easing: 'Linear' }),
  P('Fast Ticker', 'Continuous', 'A quick, repeating strip for busy catalogues.', '#4a4438', { layout: 'marquee', look: { stage: '#14130f', cardH: 70, radius: 8 }, fx: { speed: 150 }, layers: CAPTION }, { min: 5, easing: 'Linear' }),
  P('Infinite Catalogue', 'Continuous', 'A wide catalogue with quick, repeatable movement.', '#3c4252', { layout: 'multi', visible: 4, gap: 12, look: { stage: '#10131a', cardH: 80 }, layers: CAPTION }, { min: 8, easing: 'Ease out', duration: 560 }),
];

const LOOK_STYLE_RESET = (): Partial<Look> => {
  const d = defaultLook();
  // The visual style a preset owns. Typeface, headline size, alignment, overlay and brightness stay yours.
  return { radius: d.radius, shadow: d.shadow, border: d.border, sheen: d.sheen, vignette: d.vignette, stage: d.stage, cardBackground: d.cardBackground, text: d.text, overlayTint: d.overlayTint, grain: d.grain, theme: d.theme, cardW: d.cardW, cardH: d.cardH, cardStyle: d.cardStyle, frame: d.frame, glow: d.glow, reflect: d.reflect };
};

/** Apply a preset on top of a project. Slides, copy and your input / typography settings are kept. */
export function applyPresetTo(project: Project, preset: Preset): Project {
  const patch = preset.patch ?? {};
  const layout = patch.layout ?? preset.layout;
  let slides = project.slides;
  const need = preset.minSlides ?? 0;
  if (slides.length < need) slides = [...slides, ...Array.from({ length: need - slides.length }, (_, i) => freshSlide(slides.length + i))];
  const next: Project = {
    ...project, slides, layout, motion: patch.motion ?? preset.motion, motionOut: patch.motionOut ?? '', easing: patch.easing ?? preset.easing,
    duration: patch.duration ?? preset.duration, visible: patch.visible ?? preset.visible, gap: patch.gap ?? preset.gap,
    loop: patch.loop ?? project.loop, seamlessLoop: patch.seamlessLoop ?? project.seamlessLoop,
    angle: patch.angle ?? (layout === 'vertical' ? 90 : 0),
    fx: { ...defaultFx(), ...patch.fx }, spatial: { ...defaultSpatial(), ...patch.spatial }, nav: { ...project.nav, ...patch.nav },
    look: { ...project.look, ...LOOK_STYLE_RESET(), ...patch.look }, layers: { ...defaultLayers(), ...patch.layers },
  };
  return normalizeProject(next);
}

/** Saves the look and motion (not your input preferences) so "My presets" travel between projects. */
export const presetFromProject = (project: Project): NonNullable<Preset['patch']> => ({
  layout: project.layout, motion: project.motion, motionOut: project.motionOut, easing: project.easing, duration: project.duration, gap: project.gap, visible: project.visible,
  angle: project.angle, loop: project.loop, seamlessLoop: project.seamlessLoop, fx: project.fx, spatial: project.spatial, look: project.look, layers: project.layers,
  nav: { arrows: project.nav.arrows, pagination: project.nav.pagination, progress: project.nav.progress, thumbs: project.nav.thumbs, position: project.nav.position },
});

/** Which small diagram represents a preset in the library. */
export function presetGlyph(p: Preset): { family: 'layout' | 'motion' | 'formation'; id: string } {
  if (p.layout === 'spatial') return { family: 'formation', id: p.patch?.spatial?.formation ?? 'ring' };
  if (p.layout === 'standard' || p.layout === 'hero' || p.layout === 'vertical') return { family: 'motion', id: p.motion };
  return { family: 'layout', id: p.layout };
}
export { defaultNav };
