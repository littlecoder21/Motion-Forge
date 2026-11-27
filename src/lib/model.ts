import { sampleSlideFields } from './samples';

export type Layout =
  | 'standard' | 'hero' | 'multi' | 'centered' | 'coverflow' | 'stack' | 'vertical' | 'marquee'
  | 'spotlight' | 'accordion' | 'fan' | 'wheel' | 'deck' | 'spatial';
export type Motion =
  | 'slide' | 'fade' | 'zoom' | 'lift' | 'elastic'
  | 'zoomthrough' | 'flip' | 'tilt' | 'depthpush' | 'wipe' | 'diagonal' | 'circle' | 'blinds' | 'blur' | 'parallax' | 'wave';
export type Formation =
  | 'ring' | 'cylinder' | 'helix' | 'spiral' | 'tunnel' | 'wave' | 'orbit' | 'sphere' | 'multi'
  | 'cascade' | 'isometric' | 'arc' | 'vortex';
export type Easing = 'Ease out' | 'Ease in out' | 'Linear' | 'Spring' | 'Back' | 'Expo out' | 'Quart in out' | 'Circ out' | 'Custom';
export type CardStyle = 'classic' | 'frame' | 'polaroid' | 'glass' | 'glow';
export type WheelMode = 'swipe' | 'scroll';
export const THEME_IDS = ['custom', 'midnight-prism', 'neon-aurora', 'violet-nebula', 'mountain-dawn', 'mountain-dawn-mesh', 'ocean-glass', 'paper-ink', 'sage-atelier', 'citrus-pop', 'electric-lime'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type Slide = {
  id: string; name: string; eyebrow: string; title: string; body: string; cta: string; image: string; color: string; accent: string; focal: string;
  href?: string; align?: string; valign?: string;
};
export type Fx = {
  intensity: number; depth: number; blur: number; delay: number; stagger: number; overshoot: number;
  spring: boolean; stiffness: number; damping: number; momentum: boolean; inertia: number;
  origin: 'center' | 'top' | 'bottom' | 'left' | 'right'; speed: number; reverse: boolean;
};
export type Spatial = {
  formation: Formation; radius: number; vRadius: number; cardW: number; cardH: number; spacing: number; elevation: number;
  rise: number; amplitude: number; twist: number; perspective: number; distance: number; pitch: number; yaw: number; roll: number;
  mouseTilt: number; mouseDepth: number; facing: 'out' | 'in' | 'front'; depthFade: number; depthBlur: number; lighting: number;
  activeScale: number; activeLift: number; snap: boolean; autoRotate: boolean; speed: number; reverse: boolean;
  pauseHover: boolean; clickFocus: boolean; backface: boolean;
  /** Extra turn / tilt applied to every card on top of the formation's own orientation. */
  cardYaw: number; cardPitch: number;
  /** Depth added per slide (% of card width) — cascade and vortex. */
  depthStep: number;
};
export type Nav = {
  arrows: boolean; pagination: 'dots' | 'fraction' | 'none'; progress: boolean; thumbs: boolean; position: 'bottom' | 'center' | 'sides';
  arrowStyle: 'round' | 'square' | 'minimal'; paginationStyle: 'bar' | 'dot' | 'line';
  keyboard: boolean; /** Mouse drag. */ drag: boolean; /** Touch / pen swipe. */ touch: boolean; /** Touchpad swipe or mouse wheel. */ wheel: boolean;
  wheelMode: WheelMode; invert: boolean; sensitivity: number; pauseOnHover: boolean;
};
export type Look = {
  radius: number; shadow: number; overlay: number; brightness: number; align: 'start' | 'center' | 'end'; valign: 'top' | 'center' | 'end';
  titleScale: number; font: 'sans' | 'serif' | 'mono'; stage: string; cardBackground: string; text: string; overlayTint: string; grain: number; theme: ThemeId; vignette: number; sheen: boolean; border: boolean; cardW: number; cardH: number;
  cardStyle: CardStyle; /** Frame thickness, % of card width (frame + polaroid styles). */ frame: number; /** Edge glow strength (glow style). */ glow: number; /** Floor reflection strength. */ reflect: number;
};
export type Layers = { image: boolean; overlay: boolean; eyebrow: boolean; title: boolean; body: boolean; cta: boolean; index: boolean };
export type Responsive = { on: boolean; breakpoint: number; mobile: { layout: '' | Layout; visible: number; gap: number; intensity: number; arrows: boolean } };

export type Project = {
  version: 1; name: string; layout: Layout; motion: Motion; easing: string; duration: number; interval: number; gap: number; visible: number;
  autoplay: boolean; loop: boolean; seamlessLoop: boolean; slides: Slide[]; active: number;
  motionOut: '' | Motion; angle: number; bezier: [number, number, number, number];
  fx: Fx; spatial: Spatial; nav: Nav; look: Look; layers: Layers; responsive: Responsive;
};

export const LAYOUTS: Layout[] = ['standard', 'hero', 'multi', 'centered', 'coverflow', 'stack', 'vertical', 'marquee', 'spotlight', 'accordion', 'fan', 'wheel', 'deck', 'spatial'];
export const MOTIONS: Motion[] = ['slide', 'fade', 'zoom', 'lift', 'elastic', 'zoomthrough', 'flip', 'tilt', 'depthpush', 'wipe', 'diagonal', 'circle', 'blinds', 'blur', 'parallax', 'wave'];
export const FORMATIONS: Formation[] = ['ring', 'cylinder', 'helix', 'spiral', 'tunnel', 'wave', 'orbit', 'sphere', 'multi', 'cascade', 'isometric', 'arc', 'vortex'];
export const CARD_STYLES: CardStyle[] = ['classic', 'frame', 'polaroid', 'glass', 'glow'];
export const EASINGS: Easing[] = ['Ease out', 'Ease in out', 'Linear', 'Spring', 'Back', 'Expo out', 'Quart in out', 'Circ out', 'Custom'];
export const PAGED: Layout[] = ['standard', 'hero', 'vertical'];
export const isPaged = (layout: Layout) => PAGED.includes(layout);

const slideFields = ['id', 'name', 'eyebrow', 'title', 'body', 'cta', 'image', 'color', 'accent', 'focal'] as const;

export const defaultFx = (): Fx => ({ intensity: 100, depth: 100, blur: 12, delay: 0, stagger: 0, overshoot: 60, spring: false, stiffness: 170, damping: 18, momentum: true, inertia: 50, origin: 'center', speed: 60, reverse: false });
export const defaultSpatial = (): Spatial => ({
  formation: 'ring', radius: 50, vRadius: 22, cardW: 28, cardH: 62, spacing: 36, elevation: 0, rise: 14, amplitude: 14, twist: 16,
  perspective: 1200, distance: 0, pitch: 0, yaw: 0, roll: 0, mouseTilt: 6, mouseDepth: 0, facing: 'out', depthFade: 55, depthBlur: 0, lighting: 45,
  activeScale: 112, activeLift: 40, snap: true, autoRotate: false, speed: 14, reverse: false, pauseHover: true, clickFocus: true, backface: false,
  cardYaw: 0, cardPitch: 0, depthStep: 12,
});
export const defaultNav = (): Nav => ({ arrows: true, pagination: 'dots', progress: false, thumbs: false, position: 'bottom', arrowStyle: 'round', paginationStyle: 'bar', keyboard: true, drag: true, touch: true, wheel: true, wheelMode: 'swipe', invert: false, sensitivity: 100, pauseOnHover: true });
export const defaultLook = (): Look => ({
  radius: 14, shadow: 35, overlay: 82, brightness: 100, align: 'start', valign: 'end', titleScale: 100, font: 'sans', stage: '#222d34', cardBackground: '', text: '#f6f5ef', overlayTint: '#080d0f', grain: 0, theme: 'custom', vignette: 0, sheen: false, border: false, cardW: 72, cardH: 88,
  cardStyle: 'classic', frame: 3, glow: 55, reflect: 0,
});
export const defaultLayers = (): Layers => ({ image: true, overlay: true, eyebrow: true, title: true, body: true, cta: true, index: true });
export const defaultResponsive = (): Responsive => ({ on: false, breakpoint: 560, mobile: { layout: '', visible: 0, gap: -1, intensity: 100, arrows: true } });

export const freshSlide = (index: number): Slide => ({
  id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...sampleSlideFields(index),
  cta: 'Explore the story', focal: '50% 50%', href: '#', align: '', valign: '',
});

/** First-run project: ten free sample photos on a slowly drifting 3D ring. */
export const initialProject = (): Project => ({
  version: 1, name: 'Motion studies — 01', layout: 'spatial', motion: 'slide', easing: 'Expo out', duration: 900, interval: 3600, gap: 20,
  visible: 1, autoplay: false, loop: true, seamlessLoop: true, slides: Array.from({ length: 10 }, (_, i) => freshSlide(i)), active: 0,
  motionOut: '', angle: 0, bezier: [0.22, 0.75, 0.25, 1],
  fx: defaultFx(), spatial: { ...defaultSpatial(), formation: 'ring', spacing: 34, radius: 52, cardW: 26, cardH: 64, pitch: -6, mouseTilt: 8 },
  nav: defaultNav(), look: { ...defaultLook(), radius: 12, shadow: 50, overlay: 70 }, layers: defaultLayers(), responsive: defaultResponsive(),
});

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, def: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : def);
const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
const pick = <T extends string>(v: unknown, list: readonly T[], def: T): T => (list.includes(v as T) ? (v as T) : def);
const str = (v: unknown, def: string) => (typeof v === 'string' ? v : def);
const cssBackground = (v: unknown, def: string) => typeof v === 'string' && v.length <= 256 && (/^#[0-9a-f]{3,8}$/i.test(v) || /^(?:linear|radial)-gradient\([#(),\s.%a-z0-9-]+\)$/i.test(v)) ? v : def;

function normalizeSlide(raw: unknown, index: number): Slide {
  const base = freshSlide(index);
  const r = isObj(raw) ? raw : {};
  const out = { ...base } as Slide;
  for (const f of slideFields) if (typeof r[f] === 'string') out[f] = r[f] as string;
  out.href = str(r.href, '#');
  out.align = pick(r.align, ['', 'start', 'center', 'end'] as const, '');
  out.valign = pick(r.valign, ['', 'top', 'center', 'end'] as const, '');
  return out;
}

/** Tolerant: fills every missing v2 field with defaults so old saved projects keep working. */
export function normalizeProject(raw: unknown): Project {
  const d = initialProject();
  if (!isObj(raw)) return d;
  const fx = isObj(raw.fx) ? raw.fx : {}, sp = isObj(raw.spatial) ? raw.spatial : {}, nv = isObj(raw.nav) ? raw.nav : {};
  const lk = isObj(raw.look) ? raw.look : {}, ly = isObj(raw.layers) ? raw.layers : {}, rs = isObj(raw.responsive) ? raw.responsive : {};
  const rm = isObj(rs.mobile) ? rs.mobile : {};
  const dfx = d.fx, dsp = d.spatial, dnv = d.nav, dlk = d.look, drs = d.responsive;
  const slides = Array.isArray(raw.slides) && raw.slides.length ? raw.slides.map(normalizeSlide) : d.slides;
  const layout = pick(raw.layout, LAYOUTS, d.layout);
  const bz = Array.isArray(raw.bezier) && raw.bezier.length === 4 && raw.bezier.every((v) => typeof v === 'number' && Number.isFinite(v)) ? (raw.bezier as number[]) : d.bezier;
  const dragOn = bool(nv.drag, dnv.drag);
  return {
    version: 1,
    name: str(raw.name, d.name),
    layout,
    motion: pick(raw.motion, MOTIONS, d.motion),
    easing: pick(raw.easing, EASINGS, d.easing),
    duration: num(raw.duration, d.duration, 250, 2400),
    interval: num(raw.interval, d.interval, 1200, 8000),
    gap: num(raw.gap, d.gap, 0, 48),
    visible: Math.round(num(raw.visible, d.visible, 1, 5)),
    autoplay: bool(raw.autoplay, d.autoplay),
    loop: bool(raw.loop, d.loop),
    seamlessLoop: bool(raw.seamlessLoop, d.seamlessLoop),
    slides,
    active: Math.round(num(raw.active, 0, 0, slides.length - 1)),
    motionOut: raw.motionOut === '' || raw.motionOut === undefined ? '' : pick(raw.motionOut, MOTIONS, 'slide'),
    angle: num(raw.angle, layout === 'vertical' ? 90 : 0, -360, 360),
    bezier: [num(bz[0], 0.22, 0, 1), num(bz[1], 0.75, -1, 2), num(bz[2], 0.25, 0, 1), num(bz[3], 1, -1, 2)],
    fx: {
      intensity: num(fx.intensity, dfx.intensity, 0, 200), depth: num(fx.depth, dfx.depth, 0, 200), blur: num(fx.blur, dfx.blur, 0, 30),
      delay: num(fx.delay, dfx.delay, 0, 1000), stagger: num(fx.stagger, dfx.stagger, 0, 300), overshoot: num(fx.overshoot, dfx.overshoot, 0, 100),
      spring: bool(fx.spring, dfx.spring), stiffness: num(fx.stiffness, dfx.stiffness, 40, 600), damping: num(fx.damping, dfx.damping, 4, 60),
      momentum: bool(fx.momentum, dfx.momentum), inertia: num(fx.inertia, dfx.inertia, 0, 100),
      origin: pick(fx.origin, ['center', 'top', 'bottom', 'left', 'right'] as const, 'center'), speed: num(fx.speed, dfx.speed, 10, 300), reverse: bool(fx.reverse, false),
    },
    spatial: {
      formation: pick(sp.formation, FORMATIONS, dsp.formation), radius: num(sp.radius, dsp.radius, 10, 90), vRadius: num(sp.vRadius, dsp.vRadius, 0, 60),
      cardW: num(sp.cardW, dsp.cardW, 6, 70), cardH: num(sp.cardH, dsp.cardH, 20, 90), spacing: num(sp.spacing, dsp.spacing, 0, 120), elevation: num(sp.elevation, dsp.elevation, -40, 40),
      rise: num(sp.rise, dsp.rise, -40, 40), amplitude: num(sp.amplitude, dsp.amplitude, 0, 40), twist: num(sp.twist, dsp.twist, -60, 60),
      perspective: num(sp.perspective, dsp.perspective, 300, 3000), distance: num(sp.distance, dsp.distance, -800, 800),
      pitch: num(sp.pitch, dsp.pitch, -75, 75), yaw: num(sp.yaw, dsp.yaw, -180, 180), roll: num(sp.roll, dsp.roll, -45, 45), mouseTilt: num(sp.mouseTilt, dsp.mouseTilt, 0, 30), mouseDepth: num(sp.mouseDepth, dsp.mouseDepth, 0, 200),
      facing: pick(sp.facing, ['out', 'in', 'front'] as const, 'out'), depthFade: num(sp.depthFade, dsp.depthFade, 0, 100), depthBlur: num(sp.depthBlur, dsp.depthBlur, 0, 12),
      lighting: num(sp.lighting, dsp.lighting, 0, 90), activeScale: num(sp.activeScale, dsp.activeScale, 90, 170), activeLift: num(sp.activeLift, dsp.activeLift, 0, 300),
      snap: bool(sp.snap, dsp.snap), autoRotate: bool(sp.autoRotate, dsp.autoRotate), speed: num(sp.speed, dsp.speed, 2, 120), reverse: bool(sp.reverse, false),
      pauseHover: bool(sp.pauseHover, dsp.pauseHover), clickFocus: bool(sp.clickFocus, dsp.clickFocus), backface: bool(sp.backface, dsp.backface),
      cardYaw: num(sp.cardYaw, dsp.cardYaw, -85, 85), cardPitch: num(sp.cardPitch, dsp.cardPitch, -85, 85), depthStep: num(sp.depthStep, dsp.depthStep, 0, 100),
    },
    nav: {
      arrows: bool(nv.arrows, dnv.arrows), pagination: pick(nv.pagination, ['dots', 'fraction', 'none'] as const, 'dots'), progress: bool(nv.progress, dnv.progress),
      thumbs: bool(nv.thumbs, dnv.thumbs), position: pick(nv.position, ['bottom', 'center', 'sides'] as const, 'bottom'), keyboard: bool(nv.keyboard, dnv.keyboard),
      arrowStyle: pick(nv.arrowStyle, ['round', 'square', 'minimal'] as const, dnv.arrowStyle), paginationStyle: pick(nv.paginationStyle, ['bar', 'dot', 'line'] as const, dnv.paginationStyle),
      drag: dragOn,
      // Projects saved before touch had its own switch: "Drag / swipe" off meant touch was off too.
      touch: bool(nv.touch, nv.drag === false ? false : dnv.touch),
      wheel: bool(nv.wheel, dnv.wheel),
      // A saved project that already had the wheel on used the old step-per-notch behaviour.
      wheelMode: pick(nv.wheelMode, ['swipe', 'scroll'] as const, nv.wheel === true ? 'scroll' : dnv.wheelMode),
      invert: bool(nv.invert, dnv.invert),
      sensitivity: num(nv.sensitivity, dnv.sensitivity, 40, 250), pauseOnHover: bool(nv.pauseOnHover, dnv.pauseOnHover),
    },
    look: {
      radius: num(lk.radius, dlk.radius, 0, 48), shadow: num(lk.shadow, dlk.shadow, 0, 100), overlay: num(lk.overlay, dlk.overlay, 0, 100), brightness: num(lk.brightness, dlk.brightness, 50, 140),
      align: pick(lk.align, ['start', 'center', 'end'] as const, 'start'), valign: pick(lk.valign, ['top', 'center', 'end'] as const, 'end'), titleScale: num(lk.titleScale, dlk.titleScale, 60, 150),
      font: pick(lk.font, ['sans', 'serif', 'mono'] as const, 'sans'), stage: cssBackground(lk.stage, dlk.stage),
      cardBackground: cssBackground(lk.cardBackground, dlk.cardBackground), text: typeof lk.text === 'string' && /^#[0-9a-f]{6}$/i.test(lk.text) ? lk.text : dlk.text,
      overlayTint: typeof lk.overlayTint === 'string' && /^#[0-9a-f]{6}$/i.test(lk.overlayTint) ? lk.overlayTint : dlk.overlayTint,
      grain: num(lk.grain, dlk.grain, 0, 100),
      theme: pick(lk.theme, THEME_IDS, dlk.theme),
      vignette: num(lk.vignette, dlk.vignette, 0, 100), sheen: bool(lk.sheen, dlk.sheen), border: bool(lk.border, dlk.border), cardW: num(lk.cardW, dlk.cardW, 30, 100), cardH: num(lk.cardH, dlk.cardH, 40, 100),
      cardStyle: pick(lk.cardStyle, CARD_STYLES, 'classic'), frame: num(lk.frame, dlk.frame, 0, 12), glow: num(lk.glow, dlk.glow, 0, 100), reflect: num(lk.reflect, 0, 0, 100),
    },
    layers: {
      image: bool(ly.image, true), overlay: bool(ly.overlay, true), eyebrow: bool(ly.eyebrow, true), title: bool(ly.title, true), body: bool(ly.body, true), cta: bool(ly.cta, true), index: bool(ly.index, true),
    },
    responsive: {
      on: bool(rs.on, drs.on), breakpoint: num(rs.breakpoint, drs.breakpoint, 320, 900),
      mobile: {
        layout: rm.layout === '' || rm.layout === undefined ? '' : pick(rm.layout, LAYOUTS, ''), visible: Math.round(num(rm.visible, 0, 0, 5)), gap: num(rm.gap, -1, -1, 48),
        intensity: num(rm.intensity, 100, 0, 200), arrows: bool(rm.arrows, true),
      },
    },
  };
}

/** Strict import validation (same contract as v1) — then normalised so v1 files load into the v2 shape. */
export function parseProject(value: unknown): Project | null {
  if (!isObj(value)) return null;
  const c = value;
  if (
    c.version !== 1 || typeof c.name !== 'string' || !LAYOUTS.includes(c.layout as Layout) || !MOTIONS.includes(c.motion as Motion) ||
    typeof c.easing !== 'string' || !(EASINGS as string[]).includes(c.easing) ||
    !Number.isFinite(c.duration) || !Number.isFinite(c.interval) || !Number.isFinite(c.gap) || !Number.isFinite(c.visible) ||
    typeof c.autoplay !== 'boolean' || typeof c.loop !== 'boolean' || (c.seamlessLoop !== undefined && typeof c.seamlessLoop !== 'boolean') ||
    !Array.isArray(c.slides) || c.slides.length === 0 || !Number.isInteger(c.active)
  ) return null;
  const ok = (c.slides as unknown[]).every((s) => isObj(s) && slideFields.every((f) => typeof s[f] === 'string'));
  return ok ? normalizeProject(c) : null;
}
