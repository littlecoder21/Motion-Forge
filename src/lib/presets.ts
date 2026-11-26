import { defaultFx, defaultNav, defaultSpatial, normalizeProject, type Fx, type Layout, type Look, type Motion, type Nav, type Project, type Spatial } from './model';

export type PresetPatch = Partial<Pick<Project, 'layout' | 'motion' | 'motionOut' | 'easing' | 'duration' | 'gap' | 'visible' | 'angle' | 'loop' | 'seamlessLoop'>> & {
  fx?: Partial<Fx>; spatial?: Partial<Spatial>; nav?: Partial<Nav>; look?: Partial<Look>;
};
export type Preset = { name: string; category: string; layout: Layout; motion: Motion; easing: string; duration: number; visible: number; gap: number; note: string; tone: string; patch?: PresetPatch };

const source: [string, Layout, Motion, string][] = [
 ['Classic', 'standard','slide','A clean, direct transition for everyday stories.'],['Classic','vertical','slide','An editorial vertical progression.'],['Classic','standard','fade','Quiet crossfade with no spatial movement.'],['Classic','standard','lift','A soft lift into the next frame.'],['Classic','standard','zoom','Scale-led navigation with a gentle settle.'],['Classic','multi','slide','A flexible row of browsable cards.'],['Classic','centered','slide','A centered stage with neighboring previews.'],['Classic','standard','elastic','A responsive spring at the end of travel.'],
 ['Cinematic','hero','zoom','Slow camera push across an immersive frame.'],['Cinematic','hero','fade','Long-form dissolve for atmospheric imagery.'],['Cinematic','hero','lift','A layered rise for a full-bleed story.'],['Cinematic','hero','slide','Wide directional movement with a soft landing.'],['Cinematic','centered','zoom','Depth-led focus on the selected frame.'],['Cinematic','hero','elastic','An expressive, deliberate arrival.'],['Cinematic','stack','lift','A dimensional reveal from the stack.'],['Cinematic','hero','fade','A low-contrast editorial dissolve.'],
 ['Creative','standard','elastic','A lively reveal with spring-like easing.'],['Creative','coverflow','slide','A rotated, perspective-led slide change.'],['Creative','stack','zoom','Scale and depth in a compact deck.'],['Creative','vertical','lift','A vertical lift with crisp pacing.'],['Creative','marquee','slide','Continuous movement for a living strip.'],['Creative','multi','elastic','Cards settle with a little energy.'],['Creative','centered','fade','Soft focus on the center card.'],['Creative','coverflow','zoom','Perspective and scale in equal measure.'],
 ['3D & depth','coverflow','slide','Rotate adjacent cards into the scene.'],['3D & depth','stack','lift','Depth-ranked overlapping cards.'],['3D & depth','coverflow','elastic','A weighty 3D carousel with spring.'],['3D & depth','stack','zoom','Compact stack with an active-card lift.'],['3D & depth','centered','zoom','Depth focus with a calm center.'],['3D & depth','coverflow','fade','Perspective cards with subtle opacity.'],['3D & depth','stack','elastic','An expressive deck transition.'],['3D & depth','multi','lift','A broad card track with light elevation.'],
 ['Modern cards','centered','lift','A small rise gives the active card presence.'],['Modern cards','multi','slide','Balanced multi-card navigation.'],['Modern cards','stack','zoom','A layered set with clear active focus.'],['Modern cards','centered','elastic','Center focus with spring response.'],['Modern cards','multi','fade','An understated card-to-card dissolve.'],['Modern cards','centered','slide','Side-peek composition with crisp travel.'],['Modern cards','stack','slide','Cards fan forward with each selection.'],['Modern cards','multi','zoom','A measured scale transition across the row.'],
 ['Continuous','marquee','slide','Seamless continuous horizontal movement.'],['Continuous','marquee','lift','A light moving ribbon of imagery.'],['Continuous','marquee','fade','Flowing strip with a softer visual edge.'],['Continuous','marquee','zoom','Scale variation across the loop.'],['Continuous','multi','slide','A wide catalog with quick, repeatable motion.'],['Continuous','vertical','slide','Vertical flow for a compact column.'],['Continuous','marquee','elastic','A lively loop with springy card movement.'],['Continuous','multi','lift','Continuous browsing with a gentle rise.'],
 ['Editorial','hero','lift','Headline-first reveal with composed timing.'],['Editorial','hero','fade','Photography and type arrive in one breath.'],['Editorial','centered','slide','A magazine-like centered image sequence.'],['Editorial','standard','zoom','Typography-led story with a camera push.'],['Editorial','hero','elastic','Expressive transition for an artful feature.'],['Editorial','multi','fade','A clean index of editorial stories.'],['Editorial','vertical','lift','Long-form vertical narrative.'],['Editorial','coverflow','slide','The next story enters from the wings.'],
 ['Experimental','coverflow','elastic','Elastic perspective movement with weight.'],['Experimental','stack','elastic','A playful, tactile card pile.'],['Experimental','vertical','elastic','Elastic vertical travel.'],['Experimental','hero','zoom','Large-scale camera movement.'],['Experimental','centered','zoom','Zoom-led center focus with side peek.'],['Experimental','multi','elastic','Springing multi-card track.'],['Experimental','stack','fade','A more restrained stacked transition.'],['Experimental','coverflow','lift','Depth with a subtle vertical drift.'],
];
const generated: Preset[] = source.map(([category, layout, motion, note], i) => ({
 name: `${['', 'Soft', 'Wide', 'Slow', 'Deep', 'Quiet', 'Bold', 'Fluid'][i % 8]} ${['Classic','Cinematic','Creative','Depth','Card','Flow','Editorial','Studio'][Math.floor(i / 8)]} ${['01','02','03','04'][i % 4]}`.trim(),
 category, layout, motion, easing: ['Ease out','Ease in out','Linear','Spring','Back'][i % 5], duration: 480 + (i % 7) * 130, visible: layout === 'multi' ? 3 + (i % 2) : 1,
 gap: 12 + (i % 5) * 6, note, tone: ['#3c5555','#51433f','#374759','#55485a','#405348','#4e493c'][i % 6],
}));

const p = (name: string, category: string, layout: Layout, motion: Motion, note: string, tone: string, patch: PresetPatch = {}, easing = 'Ease out', duration = 800): Preset =>
  ({ name, category, layout, motion, easing, duration, visible: patch.visible ?? 1, gap: patch.gap ?? 20, note, tone, patch: { layout, motion, easing, duration, ...patch } });

/** Curated presets that use the new engine: reveals, 3D formations, focus layouts, physics. */
const curated: Preset[] = [
 p('Orbit Gallery', 'Spatial 3D', 'spatial', 'slide', 'A curved gallery wall that turns toward the active card.', '#35506a', { spatial: { formation: 'ring', spacing: 34, radius: 52, cardW: 28, pitch: -4 } }, 'Expo out', 900),
 p('Helix Tower', 'Spatial 3D', 'spatial', 'slide', 'Cards climb a spiral staircase as you rotate.', '#4a4a66', { spatial: { formation: 'helix', spacing: 42, rise: 16, pitch: -10, cardW: 24 } }, 'Expo out', 950),
 p('Glass Cylinder', 'Spatial 3D', 'spatial', 'slide', 'Edge-to-edge panels wrapped around a cylinder (best with 6+ slides).', '#3d5a52', { spatial: { formation: 'cylinder', cardW: 24, depthFade: 40, lighting: 30, pitch: -6 } }, 'Ease in out', 900),
 p('Deep Tunnel', 'Spatial 3D', 'spatial', 'slide', 'Slides recede into depth with a gentle twist.', '#2f4153', { spatial: { formation: 'tunnel', twist: 14, depthFade: 65, cardW: 34, cardH: 70 } }, 'Expo out', 950),
 p('Wave Runner', 'Spatial 3D', 'spatial', 'slide', 'A rolling sine wave of cards.', '#5a4555', { spatial: { formation: 'wave', amplitude: 16, cardW: 26, depthFade: 35 } }, 'Ease out', 850),
 p('Halo Orbit', 'Spatial 3D', 'spatial', 'slide', 'Cards orbit an invisible axis and always face you.', '#41506a', { spatial: { formation: 'orbit', facing: 'front', pitch: -12, vRadius: 20, radius: 44, cardW: 26 } }, 'Ease out', 900),
 p('Planet', 'Spatial 3D', 'spatial', 'slide', 'Slides distributed over a sphere (best with 8+ slides).', '#33465a', { spatial: { formation: 'sphere', radius: 32, cardW: 22, cardH: 46, depthFade: 30 } }, 'Expo out', 1000),
 p('Double Ring', 'Spatial 3D', 'spatial', 'slide', 'Two staggered rings for dense collections.', '#4f4a3a', { spatial: { formation: 'multi', cardW: 22, cardH: 44, radius: 46 } }, 'Ease out', 900),
 p('Floating Gallery', 'Spatial 3D', 'spatial', 'slide', 'Slow auto-rotation with mouse parallax.', '#3b4d6b', { spatial: { formation: 'ring', spacing: 34, radius: 52, autoRotate: true, speed: 9, mouseTilt: 10 } }, 'Linear', 900),
 p('Spotlight Focus', 'Focus', 'spotlight', 'slide', 'The active card is lit; neighbours fall back, dim and soften.', '#2f4547', { fx: { blur: 14 } }, 'Expo out', 800),
 p('Accordion Reveal', 'Focus', 'accordion', 'slide', 'Panels expand horizontally to reveal the selection.', '#4a3f3a', { gap: 8, look: { cardW: 70 } }, 'Quart in out', 750),
 p('Fan Out', 'Focus', 'fan', 'slide', 'Cards fan out from a bottom pivot like a hand of cards.', '#55404a', { fx: { intensity: 100 } }, 'Spring', 800),
 p('Arc Wheel', 'Focus', 'wheel', 'slide', 'A circular gallery that rolls under the viewer.', '#364a5c', {}, 'Ease out', 800),
 p('Infinite Deck', 'Focus', 'deck', 'slide', 'Swipe the top card away; it returns to the bottom of the deck.', '#3f4b43', {}, 'Expo out', 700),
 p('Wipe Reveal', 'Reveal', 'standard', 'wipe', 'A clean directional wipe across the frame.', '#3b4a5e', {}, 'Quart in out', 900),
 p('Diagonal Slice', 'Reveal', 'standard', 'diagonal', 'A diagonal reveal that follows your finger.', '#5a4650', {}, 'Quart in out', 950),
 p('Iris Open', 'Reveal', 'hero', 'circle', 'A circular iris opens onto the next slide.', '#32495a', {}, 'Expo out', 1000),
 p('Venetian Blinds', 'Reveal', 'standard', 'blinds', 'Eight slats open in sequence.', '#4c4a38', {}, 'Ease in out', 900),
 p('Liquid Edge', 'Reveal', 'hero', 'wave', 'The reveal edge ripples like water.', '#2f4b52', {}, 'Ease in out', 1100),
 p('Card Flip', 'Reveal', 'standard', 'flip', 'A single-sided 3D flip.', '#4a3d58', { visible: 1 }, 'Ease in out', 900),
 p('Dolly Zoom', 'Reveal', 'hero', 'zoomthrough', 'Fly through the old slide into the new one.', '#2e4756', {}, 'Expo out', 1000),
 p('Depth Push', 'Reveal', 'hero', 'depthpush', 'The old slide pushes toward you; the new one rises from depth.', '#3a4a60', {}, 'Expo out', 1000),
 p('Parallax Panorama', 'Reveal', 'hero', 'parallax', 'Background, copy and card move at different speeds.', '#364b45', { fx: { intensity: 110 } }, 'Expo out', 1000),
 p('Focus Pull', 'Reveal', 'hero', 'blur', 'Out-of-focus cross-dissolve, like a rack focus.', '#443e58', { fx: { blur: 18 } }, 'Ease in out', 900),
 p('Spring Slide', 'Kinetic', 'standard', 'elastic', 'Real spring physics with a natural settle.', '#40495a', { fx: { spring: true, stiffness: 190, damping: 17 } }, 'Spring', 800),
 p('Heavy Glide', 'Kinetic', 'coverflow', 'slide', 'Weighty, momentum-driven coverflow with staggered cards.', '#3a4552', { fx: { spring: true, stiffness: 120, damping: 20, stagger: 60, inertia: 80 } }, 'Spring', 800),
 p('Domino Stagger', 'Kinetic', 'centered', 'slide', 'Each card follows the last a beat later.', '#4a4538', { fx: { stagger: 90 } }, 'Expo out', 900),
 p('Mobile Snap', 'Kinetic', 'centered', 'slide', 'Tuned for touch: short travel, strong snap.', '#35504a', { visible: 1, look: { cardW: 82 }, fx: { inertia: 70 } }, 'Expo out', 520),
];

export const presets: Preset[] = [...curated, ...generated];

/** Apply a preset on top of a project. Old presets (no patch) only change the original six fields. */
export function applyPresetTo(project: Project, preset: Preset): Project {
  const patch = preset.patch ?? {};
  const layout = patch.layout ?? preset.layout;
  const next: Project = {
    ...project, layout, motion: patch.motion ?? preset.motion, motionOut: patch.motionOut ?? '', easing: patch.easing ?? preset.easing,
    duration: patch.duration ?? preset.duration, visible: patch.visible ?? preset.visible, gap: patch.gap ?? preset.gap,
    loop: patch.loop ?? project.loop, seamlessLoop: patch.seamlessLoop ?? project.seamlessLoop,
    angle: patch.angle ?? (layout === 'vertical' ? 90 : 0),
    fx: { ...defaultFx(), ...patch.fx }, spatial: { ...defaultSpatial(), ...patch.spatial }, nav: { ...project.nav, ...patch.nav }, look: { ...project.look, ...patch.look },
  };
  return normalizeProject(next);
}
export const presetFromProject = (project: Project): NonNullable<Preset['patch']> => ({
  layout: project.layout, motion: project.motion, motionOut: project.motionOut, easing: project.easing, duration: project.duration, gap: project.gap, visible: project.visible,
  angle: project.angle, loop: project.loop, seamlessLoop: project.seamlessLoop, fx: project.fx, spatial: project.spatial, nav: { ...defaultNav(), ...project.nav }, look: project.look,
});
