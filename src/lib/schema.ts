import { Box, Film, LayoutGrid, Palette, Settings2, Sparkles, type LucideIcon } from 'lucide-react';
import { defaultFx, defaultLook, defaultSpatial, isPaged, LAYOUTS, type Formation, type Layout, type Motion, type Project } from './model';

/**
 * Every control in the editor is described here once. The desktop inspector and the mobile sheet both render
 * this schema, so a setting can never exist on one surface and not the other — and a control is only shown
 * when it actually affects the current layout/transition (no dead controls).
 */
export type Opt = { value: string | number; label: string; note?: string };
type Gate = (p: Project) => boolean;
type Base = { show?: Gate; hint?: string | ((p: Project) => string) };
export type Ctl =
  | (Base & { kind: 'range'; key: string; label: string; min: number; max: number; step?: number; unit?: string; fmt?: (v: number) => string })
  | (Base & { kind: 'toggle'; key: string; label: string })
  | (Base & { kind: 'select'; key: string; label: string; options: Opt[] })
  | (Base & { kind: 'segment'; key: string; label: string; options: Opt[] })
  | (Base & { kind: 'choice'; key: string; label: string; family: 'layout' | 'motion' | 'formation'; options: Opt[]; onPick?: (p: Project, value: string) => Project })
  | (Base & { kind: 'color'; key: string; label: string })
  | (Base & { kind: 'direction'; key: string; label: string })
  | (Base & { kind: 'curve' })
  | (Base & { kind: 'actions'; label: string; items: { label: string; apply: (p: Project) => Project }[] })
  | (Base & { kind: 'note'; text: string });
export type Sub = { id: string; label: string; nested?: boolean; summary?: (p: Project) => string; controls?: Ctl[]; custom?: 'slides' | 'presets' };
export type Cat = { id: string; label: string; icon: LucideIcon; subs: Sub[] };

export const LAYOUT_META: { id: Layout; label: string; descriptor: string }[] = [
  { id: 'standard', label: 'Standard', descriptor: 'One slide at a time' }, { id: 'hero', label: 'Hero', descriptor: 'Immersive full bleed' },
  { id: 'centered', label: 'Centered', descriptor: 'Focused side-peek' }, { id: 'multi', label: 'Multi-card', descriptor: 'Browse a collection' },
  { id: 'coverflow', label: 'Coverflow', descriptor: 'Perspective depth' }, { id: 'stack', label: 'Stack', descriptor: 'Layered cards' },
  { id: 'vertical', label: 'Vertical', descriptor: 'Up and down motion' }, { id: 'marquee', label: 'Marquee', descriptor: 'Continuous loop' },
  { id: 'spotlight', label: 'Spotlight', descriptor: 'Lit focus, soft edges' }, { id: 'accordion', label: 'Accordion', descriptor: 'Panels that expand' },
  { id: 'fan', label: 'Fan', descriptor: 'Hand-of-cards arc' }, { id: 'wheel', label: 'Wheel', descriptor: 'Circular gallery' },
  { id: 'deck', label: 'Infinite deck', descriptor: 'Swipe cards away' }, { id: 'spatial', label: 'Spatial 3D', descriptor: 'Rings, helixes, spheres' },
];
export const MOTION_META: { id: Motion; label: string; descriptor: string }[] = [
  { id: 'slide', label: 'Slide', descriptor: 'Directional travel' }, { id: 'fade', label: 'Fade', descriptor: 'Clean crossfade' }, { id: 'zoom', label: 'Zoom', descriptor: 'Scale and fade' },
  { id: 'lift', label: 'Lift', descriptor: 'Rise into place' }, { id: 'elastic', label: 'Elastic', descriptor: 'Spring settle' }, { id: 'zoomthrough', label: 'Fly-through', descriptor: 'Dolly into the next' },
  { id: 'flip', label: 'Flip', descriptor: 'Single-sided 3D flip' }, { id: 'tilt', label: 'Tilt', descriptor: 'Slide with a turn' }, { id: 'depthpush', label: 'Depth push', descriptor: 'Push through Z' },
  { id: 'wipe', label: 'Wipe', descriptor: 'Directional reveal' }, { id: 'diagonal', label: 'Diagonal', descriptor: 'Angled reveal' }, { id: 'circle', label: 'Iris', descriptor: 'Circular reveal' },
  { id: 'blinds', label: 'Blinds', descriptor: 'Slatted reveal' }, { id: 'blur', label: 'Focus pull', descriptor: 'Blur dissolve' }, { id: 'parallax', label: 'Parallax', descriptor: 'Layered speeds' },
  { id: 'wave', label: 'Liquid wave', descriptor: 'Rippling edge' },
];
export const FORMATION_META: { id: Formation; label: string; descriptor: string }[] = [
  { id: 'ring', label: 'Ring', descriptor: 'Circular carousel' }, { id: 'cylinder', label: 'Cylinder', descriptor: 'Edge-to-edge panels' }, { id: 'helix', label: 'Helix', descriptor: 'Climbing spiral' },
  { id: 'spiral', label: 'Spiral', descriptor: 'Inward spiral' }, { id: 'tunnel', label: 'Tunnel', descriptor: 'Receding depth' }, { id: 'wave', label: 'Wave', descriptor: 'Rolling sine wave' },
  { id: 'orbit', label: 'Orbit', descriptor: 'Tilted halo' }, { id: 'sphere', label: 'Sphere', descriptor: 'Globe of cards (8+)' }, { id: 'multi', label: 'Multi-orbit', descriptor: 'Two staggered rings' },
];
export const EASING_OPTS: Opt[] = ['Ease out', 'Ease in out', 'Linear', 'Spring', 'Back', 'Expo out', 'Quart in out', 'Circ out', 'Custom'].map((v) => ({ value: v, label: v }));

const toOpts = (m: { id: string; label: string; descriptor: string }[]): Opt[] => m.map((x) => ({ value: x.id, label: x.label, note: x.descriptor }));

// ---- gates: a control appears only when the engine actually reads it ----
const paged: Gate = (p) => isPaged(p.layout);
const spatial: Gate = (p) => p.layout === 'spatial';
const notSpatial: Gate = (p) => p.layout !== 'spatial';
const isFormation = (...f: Formation[]): Gate => (p) => p.layout === 'spatial' && f.includes(p.spatial.formation);
const usesCardW: Gate = (p) => (['centered', 'coverflow', 'stack', 'spotlight', 'fan', 'wheel', 'deck', 'accordion'] as Layout[]).includes(p.layout);
const usesCardH: Gate = (p) => !isPaged(p.layout) && p.layout !== 'spatial';
const usesGap: Gate = (p) => (['multi', 'centered', 'accordion', 'marquee'] as Layout[]).includes(p.layout) || (p.layout === 'spatial' && p.spatial.formation === 'cylinder');
const usesSpring: Gate = (p) => p.layout !== 'marquee' && (p.fx.spring || (isPaged(p.layout) && p.motion === 'elastic'));
const tweenTiming: Gate = (p) => p.layout !== 'marquee' && !usesSpring(p);
const usesIntensity: Gate = (p) => {
  if (isPaged(p.layout)) return (['zoom', 'lift', 'zoomthrough', 'tilt', 'parallax', 'blur', 'wave'] as Motion[]).includes(p.motion) || (['zoom', 'lift', 'zoomthrough', 'tilt', 'parallax', 'blur', 'wave'] as string[]).includes(p.motionOut);
  return (['centered', 'coverflow', 'stack', 'spotlight', 'fan', 'wheel', 'deck', 'spatial'] as Layout[]).includes(p.layout);
};
const usesDepth: Gate = (p) => p.layout === 'coverflow' || (isPaged(p.layout) && (p.motion === 'depthpush' || p.motionOut === 'depthpush'));
const usesBlur: Gate = (p) => p.layout === 'spotlight' || (isPaged(p.layout) && (p.motion === 'blur' || p.motionOut === 'blur'));
const autoRotating: Gate = (p) => p.layout === 'spatial' && p.spatial.autoRotate;

const patchSpatial = (patch: Partial<Project['spatial']>) => (p: Project): Project => ({ ...p, spatial: { ...p.spatial, ...patch } });
const range = (key: string, label: string, min: number, max: number, extra: Partial<Extract<Ctl, { kind: 'range' }>> = {}): Ctl => ({ kind: 'range', key, label, min, max, ...extra });
const toggle = (key: string, label: string, extra: Partial<Base> = {}): Ctl => ({ kind: 'toggle', key, label, ...extra });
const gateNot3D: Ctl = { kind: 'actions', label: 'The 3D controls apply to the Spatial 3D layout.', show: notSpatial, items: [{ label: 'Switch to Spatial 3D', apply: (p) => ({ ...p, layout: 'spatial', angle: 0 }) }] };

export const setLayoutValue = (p: Project, v: string): Project => {
  const layout = v as Layout;
  if (!LAYOUTS.includes(layout)) return p;
  return { ...p, layout, angle: layout === 'vertical' ? 90 : p.layout === 'vertical' && p.angle === 90 ? 0 : p.angle };
};

export const CATEGORIES: Cat[] = [
  {
    id: 'carousel', label: 'Carousel', icon: LayoutGrid, subs: [
      { id: 'layout', label: 'Layout', nested: true, summary: (p) => LAYOUT_META.find((l) => l.id === p.layout)?.label ?? p.layout, controls: [
        { kind: 'choice', key: 'layout', label: 'Layout system', family: 'layout', options: toOpts(LAYOUT_META), onPick: setLayoutValue },
      ] },
      { id: 'slides', label: 'Slides', nested: true, custom: 'slides', summary: (p) => `${p.slides.length} slide${p.slides.length === 1 ? '' : 's'}` },
      { id: 'structure', label: 'Structure', controls: [
        range('visible', 'Visible cards', 2, 5, { show: (p) => p.layout === 'multi' }),
        range('gap', 'Card gap', 0, 48, { unit: 'px', show: usesGap }),
        range('look.cardW', 'Card width', 30, 100, { unit: '%', show: usesCardW, hint: (p) => (p.layout === 'accordion' ? 'Width of the expanded panel.' : '') }),
        range('look.cardH', 'Card height', 40, 100, { unit: '%', show: usesCardH }),
        { kind: 'note', text: 'Standard, Hero and Vertical show one full-bleed slide at a time, so they have no card geometry.', show: paged },
        { kind: 'note', text: 'Spatial 3D card size and spacing live in the 3D tab.', show: spatial },
      ] },
      { id: 'navigation', label: 'Navigation', controls: [
        toggle('nav.arrows', 'Arrow buttons'),
        { kind: 'segment', key: 'nav.pagination', label: 'Pagination', options: [{ value: 'dots', label: 'Bars' }, { value: 'fraction', label: '01 / 04' }, { value: 'none', label: 'None' }] },
        { kind: 'segment', key: 'nav.position', label: 'Controls position', options: [{ value: 'bottom', label: 'Split' }, { value: 'center', label: 'Center' }, { value: 'sides', label: 'Sides' }] },
        toggle('nav.thumbs', 'Thumbnail strip'), toggle('nav.progress', 'Progress bar'),
        toggle('nav.drag', 'Drag / swipe'), range('nav.sensitivity', 'Swipe sensitivity', 40, 250, { unit: '%', show: (p) => p.nav.drag }),
        toggle('nav.keyboard', 'Keyboard arrows'), toggle('nav.wheel', 'Mouse wheel / trackpad'),
      ] },
    ],
  },
  {
    id: 'motion', label: 'Motion', icon: Film, subs: [
      { id: 'transition', label: 'Transition', nested: true, summary: (p) => (isPaged(p.layout) ? (MOTION_META.find((m) => m.id === p.motion)?.label ?? p.motion) : 'Layout-driven'), controls: [
        { kind: 'note', text: 'Transitions apply to Standard, Hero and Vertical. Other layouts animate through their own geometry — shape that with Timing, Easing and Dynamics.', show: (p) => !isPaged(p.layout) },
        { kind: 'actions', label: 'Switch to a layout that uses transitions.', show: (p) => !isPaged(p.layout), items: [{ label: 'Hero', apply: (p) => setLayoutValue(p, 'hero') }, { label: 'Standard', apply: (p) => setLayoutValue(p, 'standard') }] },
        { kind: 'choice', key: 'motion', label: 'Incoming transition', family: 'motion', options: toOpts(MOTION_META), show: paged },
        { kind: 'select', key: 'motionOut', label: 'Outgoing slide', show: paged, options: [{ value: '', label: 'Same as incoming' }, ...MOTION_META.map((m) => ({ value: m.id, label: m.label }))], hint: 'Give the leaving slide its own exit.' },
      ] },
      { id: 'direction', label: 'Direction', controls: [
        { kind: 'direction', key: 'angle', label: 'Travel direction', show: paged },
        { kind: 'segment', key: 'fx.origin', label: 'Transform origin', show: paged, options: ['center', 'top', 'bottom', 'left', 'right'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) },
        range('fx.speed', 'Scroll speed', 10, 300, { unit: 'px/s', show: (p) => p.layout === 'marquee' }),
        toggle('fx.reverse', 'Reverse direction', { show: (p) => p.layout === 'marquee' }),
        { kind: 'note', text: 'Direction only applies to the paged layouts and the marquee.', show: (p) => !isPaged(p.layout) && p.layout !== 'marquee' },
      ] },
      { id: 'timing', label: 'Timing', controls: [
        range('duration', 'Duration', 250, 2400, { step: 50, unit: 'ms', show: tweenTiming }),
        range('fx.delay', 'Start delay', 0, 1000, { step: 20, unit: 'ms', show: (p) => p.layout !== 'marquee' }),
        range('fx.stagger', 'Stagger', 0, 300, { step: 10, unit: 'ms', show: (p) => p.layout !== 'marquee' && p.layout !== 'accordion' && p.layout !== 'spatial', hint: 'Cards farther from the active one start later.' },),
        { kind: 'note', text: 'Spring physics sets its own duration — tune it in Dynamics.', show: (p) => p.layout !== 'marquee' && usesSpring(p) },
      ] },
      { id: 'easing', label: 'Easing', nested: true, summary: (p) => (usesSpring(p) ? 'Spring physics' : p.easing), controls: [
        { kind: 'select', key: 'easing', label: 'Curve', options: EASING_OPTS, show: tweenTiming },
        { kind: 'curve', show: (p) => tweenTiming(p) && p.easing === 'Custom' },
        range('fx.overshoot', 'Overshoot', 0, 100, { unit: '%', show: (p) => tweenTiming(p) && (p.easing === 'Back' || p.easing === 'Spring') }),
        { kind: 'note', text: 'Easing curves apply to timed motion. This project uses spring physics (see Dynamics).', show: (p) => p.layout !== 'marquee' && usesSpring(p) },
      ] },
      { id: 'dynamics', label: 'Dynamics', controls: [
        toggle('fx.spring', 'Spring physics', { show: (p) => p.layout !== 'marquee' }),
        range('fx.stiffness', 'Stiffness', 40, 600, { show: usesSpring }), range('fx.damping', 'Damping', 4, 60, { show: usesSpring, hint: 'Lower damping = more bounce.' }),
        toggle('fx.momentum', 'Momentum on release', { show: (p) => p.nav.drag && p.layout !== 'marquee' }),
        range('fx.inertia', 'Inertia', 0, 100, { unit: '%', show: (p) => p.nav.drag && p.fx.momentum && p.layout !== 'marquee' }),
      ] },
      { id: 'advanced', label: 'Advanced', controls: [
        range('fx.intensity', 'Intensity', 0, 200, { unit: '%', show: usesIntensity, hint: 'Scales rotation, scale and travel effects.' }),
        range('fx.depth', 'Depth', 0, 200, { unit: '%', show: usesDepth }),
        range('fx.blur', 'Blur amount', 0, 30, { unit: 'px', show: usesBlur }),
        { kind: 'note', text: 'This layout/transition has no extra tuning — everything it reads is in Timing and Dynamics.', show: (p) => !usesIntensity(p) && !usesDepth(p) && !usesBlur(p) },
      ] },
    ],
  },
  {
    id: 'style', label: 'Style', icon: Palette, subs: [
      { id: 'cards', label: 'Cards', controls: [
        range('look.radius', 'Corner radius', 0, 48, { unit: 'px' }), range('look.shadow', 'Shadow', 0, 100, { unit: '%' }),
        toggle('look.border', 'Hairline border'), toggle('look.sheen', 'Glass sheen'), { kind: 'color', key: 'look.stage', label: 'Stage background' },
      ] },
      { id: 'images', label: 'Images', nested: true, summary: (p) => `Overlay ${p.look.overlay}%`, controls: [
        range('look.overlay', 'Text overlay', 0, 100, { unit: '%', show: (p) => p.layers.overlay }), range('look.brightness', 'Image brightness', 50, 140, { unit: '%' }),
      ] },
      { id: 'type', label: 'Typography', controls: [
        { kind: 'segment', key: 'look.font', label: 'Typeface', options: [{ value: 'sans', label: 'Sans' }, { value: 'serif', label: 'Serif' }, { value: 'mono', label: 'Mono' }] },
        range('look.titleScale', 'Headline size', 60, 150, { unit: '%' }),
        { kind: 'segment', key: 'look.align', label: 'Text alignment', options: [{ value: 'start', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'Right' }] },
        { kind: 'segment', key: 'look.valign', label: 'Text position', options: [{ value: 'top', label: 'Top' }, { value: 'center', label: 'Middle' }, { value: 'end', label: 'Bottom' }] },
      ] },
      { id: 'effects', label: 'Effects', controls: [range('look.vignette', 'Vignette', 0, 100, { unit: '%' })] },
      { id: 'layers', label: 'Layers', controls: [
        toggle('layers.image', 'Background image'), toggle('layers.overlay', 'Color overlay'), toggle('layers.eyebrow', 'Eyebrow'), toggle('layers.title', 'Heading'),
        toggle('layers.body', 'Description'), toggle('layers.cta', 'Call to action'), toggle('layers.index', 'Slide counter'),
      ] },
    ],
  },
  {
    id: 'spatial', label: '3D', icon: Box, subs: [
      { id: 'formation', label: 'Formation', nested: true, summary: (p) => (p.layout === 'spatial' ? (FORMATION_META.find((f) => f.id === p.spatial.formation)?.label ?? '') : 'Off'), controls: [
        gateNot3D,
        { kind: 'choice', key: 'spatial.formation', label: 'Formation', family: 'formation', options: toOpts(FORMATION_META), show: spatial },
        { kind: 'actions', label: 'Quick shapes', show: spatial, items: [
          { label: 'Compact', apply: patchSpatial({ radius: 46, cardW: 24, spacing: 32, pitch: 0 }) }, { label: 'Wide arc', apply: patchSpatial({ radius: 60, cardW: 26, spacing: 30, pitch: -4 }) },
          { label: 'Dramatic', apply: patchSpatial({ pitch: -18, activeScale: 125, depthFade: 70, lighting: 60, perspective: 900 }) }, { label: 'Gallery', apply: patchSpatial({ radius: 52, cardW: 28, spacing: 34, pitch: 0, depthFade: 45 }) },
        ] },
        { kind: 'note', text: 'Cylinder and Sphere look best with 6–8+ slides.', show: isFormation('cylinder', 'sphere') },
      ] },
      { id: 'geometry', label: 'Geometry', controls: [
        gateNot3D,
        range('spatial.radius', 'Radius', 10, 90, { unit: '%', show: isFormation('ring', 'helix', 'spiral', 'orbit', 'sphere', 'multi', 'tunnel', 'wave') }),
        range('spatial.vRadius', 'Vertical radius', 0, 60, { unit: '%', show: isFormation('orbit') }),
        range('spatial.cardW', 'Card width', 12, 70, { unit: '%', show: spatial }), range('spatial.cardH', 'Card height', 20, 90, { unit: '%', show: spatial }),
        range('spatial.spacing', 'Angular spacing', 0, 120, { unit: '°', fmt: (v) => (v === 0 ? 'Auto' : `${v}°`), show: isFormation('ring', 'helix', 'spiral', 'orbit', 'multi'), hint: 'Auto spreads every slide around the full circle.' }),
        range('spatial.elevation', 'Height offset', -40, 40, { unit: '%', show: spatial }),
        range('spatial.rise', 'Rise per slide', -40, 40, { unit: '%', show: isFormation('helix', 'spiral') }),
        range('spatial.amplitude', 'Wave amplitude', 0, 40, { unit: '%', show: isFormation('wave') }),
        range('spatial.twist', 'Twist per slide', -60, 60, { unit: '°', show: isFormation('tunnel') }),
        range('gap', 'Panel gap', 0, 48, { unit: 'px', show: isFormation('cylinder') }),
      ] },
      { id: 'camera', label: 'Camera', nested: true, summary: (p) => (p.layout === 'spatial' ? `${p.spatial.perspective}px · ${p.spatial.pitch}°` : 'Off'), controls: [
        gateNot3D,
        range('spatial.perspective', 'Perspective', 300, 3000, { step: 50, unit: 'px', show: spatial }), range('spatial.distance', 'Camera distance', -800, 800, { step: 10, unit: 'px', show: spatial }),
        range('spatial.pitch', 'Tilt (pitch)', -75, 75, { unit: '°', show: spatial }), range('spatial.yaw', 'Turn (yaw)', -180, 180, { unit: '°', show: spatial }), range('spatial.roll', 'Roll', -45, 45, { unit: '°', show: spatial }),
        range('spatial.mouseTilt', 'Mouse parallax', 0, 30, { unit: '°', show: spatial }),
      ] },
      { id: 'rotation', label: 'Rotation', controls: [
        gateNot3D,
        { kind: 'segment', key: 'spatial.facing', label: 'Card facing', show: isFormation('ring', 'cylinder', 'helix', 'spiral', 'orbit', 'multi'), options: [{ value: 'out', label: 'Outward' }, { value: 'in', label: 'Inward' }, { value: 'front', label: 'Always front' }] },
        range('nav.sensitivity', 'Rotation sensitivity', 40, 250, { unit: '%', show: spatial }),
        toggle('spatial.snap', 'Snap to slide', { show: spatial }), toggle('fx.momentum', 'Momentum', { show: spatial }), range('fx.inertia', 'Inertia', 0, 100, { unit: '%', show: (p) => p.layout === 'spatial' && p.fx.momentum }),
      ] },
      { id: 'depth', label: 'Depth', controls: [
        gateNot3D,
        range('spatial.depthFade', 'Depth fade', 0, 100, { unit: '%', show: spatial }), range('spatial.depthBlur', 'Depth blur', 0, 12, { unit: 'px', show: spatial, hint: 'Blur is GPU-heavy — keep low on mobile.' }),
        range('spatial.lighting', 'Depth shading', 0, 90, { unit: '%', show: spatial }), range('spatial.activeScale', 'Active scale', 90, 170, { unit: '%', show: spatial }), range('spatial.activeLift', 'Active lift', 0, 300, { unit: 'px', show: spatial }),
      ] },
      { id: 'interaction', label: 'Interaction', controls: [
        gateNot3D, toggle('spatial.clickFocus', 'Click a card to focus', { show: spatial }), toggle('nav.drag', 'Drag to rotate', { show: spatial }), toggle('spatial.pauseHover', 'Pause on hover', { show: autoRotating }),
      ] },
      { id: 'animation', label: 'Animation', controls: [
        gateNot3D, toggle('spatial.autoRotate', 'Auto-rotate', { show: spatial }), range('spatial.speed', 'Rotation speed', 2, 120, { unit: '°/s', show: autoRotating }), toggle('spatial.reverse', 'Reverse', { show: autoRotating }),
      ] },
      { id: 'appearance', label: 'Appearance', controls: [
        gateNot3D, toggle('spatial.backface', 'Show card backs', { show: spatial }), range('look.shadow', 'Shadow', 0, 100, { unit: '%', show: spatial }),
      ] },
    ],
  },
  { id: 'presets', label: 'Presets', icon: Sparkles, subs: [{ id: 'library', label: 'Library', custom: 'presets' }] },
  {
    id: 'settings', label: 'Settings', icon: Settings2, subs: [
      { id: 'autoplay', label: 'Autoplay', controls: [
        toggle('autoplay', 'Autoplay'), range('interval', 'Interval', 1200, 8000, { step: 200, unit: 'ms', show: (p) => p.autoplay && !autoRotating(p) && p.layout !== 'marquee' }),
        toggle('nav.pauseOnHover', 'Pause on hover', { show: (p) => p.layout !== 'spatial' }),
        { kind: 'note', text: 'Spatial 3D auto-rotate is configured in the 3D tab.', show: autoRotating },
      ] },
      { id: 'loop', label: 'Loop', controls: [toggle('loop', 'Loop slides', { show: (p) => p.layout !== 'accordion' && p.layout !== 'marquee' && p.layout !== 'spatial' }), toggle('seamlessLoop', 'Seamless loop', { show: (p) => p.loop && !['accordion', 'marquee', 'spatial'].includes(p.layout) }),
        { kind: 'note', text: 'This layout always loops (or never does) by design.', show: (p) => ['accordion', 'marquee', 'spatial'].includes(p.layout) }] },
      { id: 'responsive', label: 'Responsive', nested: true, summary: (p) => (p.responsive.on ? `Below ${p.responsive.breakpoint}px` : 'Off'), controls: [
        toggle('responsive.on', 'Adapt on small screens', { hint: 'Measured on the carousel itself, so it also reacts inside narrow containers.' }),
        range('responsive.breakpoint', 'Breakpoint', 320, 900, { step: 10, unit: 'px', show: (p) => p.responsive.on }),
        { kind: 'select', key: 'responsive.mobile.layout', label: 'Layout on small screens', show: (p) => p.responsive.on, options: [{ value: '', label: 'Same as desktop' }, ...LAYOUT_META.map((l) => ({ value: l.id, label: l.label }))] },
        { kind: 'select', key: 'responsive.mobile.visible', label: 'Visible cards (Multi-card)', show: (p) => p.responsive.on, options: [{ value: 0, label: 'Same as desktop' }, { value: 2, label: '2' }, { value: 3, label: '3' }] },
        { kind: 'select', key: 'responsive.mobile.gap', label: 'Card gap', show: (p) => p.responsive.on, options: [{ value: -1, label: 'Same as desktop' }, { value: 0, label: '0 px' }, { value: 8, label: '8 px' }, { value: 12, label: '12 px' }, { value: 16, label: '16 px' }] },
        range('responsive.mobile.intensity', 'Motion intensity', 0, 200, { unit: '%', show: (p) => p.responsive.on }),
        toggle('responsive.mobile.arrows', 'Show arrow buttons', { show: (p) => p.responsive.on }),
      ] },
      { id: 'a11y', label: 'Accessibility', controls: [
        { kind: 'note', text: 'Built in, always on: ARIA carousel roles, keyboard arrows (toggle in Navigation), a Pause control whenever autoplay is enabled, off-screen pausing, and prefers-reduced-motion support (motion jumps instead of animating, autoplay and marquee stop).' },
      ] },
      { id: 'reset', label: 'Reset', controls: [
        { kind: 'actions', label: 'Reset a group to its defaults', items: [
          { label: 'Motion', apply: (p) => ({ ...p, fx: defaultFx(), easing: 'Ease out', duration: 720, motionOut: '', bezier: [0.22, 0.75, 0.25, 1] }) },
          { label: '3D', apply: (p) => ({ ...p, spatial: defaultSpatial() }) }, { label: 'Style', apply: (p) => ({ ...p, look: defaultLook() }) },
        ] },
      ] },
    ],
  },
];
