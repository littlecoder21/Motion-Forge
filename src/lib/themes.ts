import type { Look, Project, ThemeId } from './model';

type CarouselTheme = {
  id: Exclude<ThemeId, 'custom'>;
  name: string;
  description: string;
  accent: string;
  palette: readonly string[];
  look: Pick<Look, 'stage' | 'cardBackground' | 'text' | 'overlayTint' | 'font' | 'radius' | 'shadow' | 'overlay' | 'brightness' | 'titleScale' | 'align' | 'valign' | 'cardStyle' | 'frame' | 'glow' | 'vignette' | 'sheen' | 'border'> & Partial<Pick<Look, 'grain'>>;
};

export const CAROUSEL_THEMES: readonly CarouselTheme[] = [
  {
    id: 'midnight-prism', name: 'Midnight Prism', description: 'Deep navy · iridescent glow', accent: '#a9a0ff',
    palette: ['#0b1020', '#10172b', '#15182d'],
    look: { stage: 'radial-gradient(ellipse at 82% 18%, #7878bf 0%, transparent 36%), radial-gradient(ellipse at 12% 84%, #c1d3db 0%, transparent 40%), #05060f', cardBackground: 'radial-gradient(ellipse at 80% 12%, #7878bf 0%, transparent 55%), linear-gradient(145deg, #0b1020, #182338)', text: '#f4f3ff', overlayTint: '#17152d', font: 'sans', radius: 20, shadow: 55, overlay: 78, brightness: 100, titleScale: 108, align: 'start', valign: 'end', cardStyle: 'glass', frame: 3, glow: 55, vignette: 24, sheen: true, border: false },
  },
  {
    id: 'neon-aurora', name: 'Neon Aurora', description: 'Cyan and fuchsia · glass cards', accent: '#7aebff',
    palette: ['#101222', '#15182d', '#21152a'],
    look: { stage: 'radial-gradient(ellipse at 88% 18%, #7aebff 0%, transparent 34%), radial-gradient(ellipse at 12% 82%, #e15bbb 0%, transparent 42%), #090b18', cardBackground: 'radial-gradient(ellipse at 85% 12%, #e15bbb 0%, transparent 48%), linear-gradient(135deg, #111528, #092c3c)', text: '#f8f4ff', overlayTint: '#21142d', font: 'sans', radius: 26, shadow: 48, overlay: 82, brightness: 100, titleScale: 106, align: 'start', valign: 'end', cardStyle: 'glass', frame: 3, glow: 68, vignette: 18, sheen: true, border: true },
  },
  {
    id: 'violet-nebula', name: 'Violet Nebula', description: 'Velvet purple · editorial serif', accent: '#c08ff1',
    palette: ['#1a102a', '#241235', '#301a42'],
    look: { stage: 'radial-gradient(ellipse at 75% 16%, #954edb 0%, transparent 38%), radial-gradient(ellipse at 18% 82%, #6a2fa4 0%, transparent 44%), #100b1b', cardBackground: 'radial-gradient(ellipse at 75% 16%, #6a2fa4 0%, transparent 52%), linear-gradient(145deg, #1a102a, #311744)', text: '#f7efff', overlayTint: '#21172e', font: 'serif', radius: 18, shadow: 62, overlay: 80, brightness: 100, titleScale: 112, align: 'start', valign: 'end', cardStyle: 'glow', frame: 3, glow: 64, vignette: 35, sheen: false, border: false },
  },
  {
    id: 'mountain-dawn', name: 'Mountain Dawn', description: 'Blue ridge · peach sunrise', accent: '#b66b4b',
    palette: ['#38536c', '#786b68', '#a97d66'],
    look: { stage: 'linear-gradient(in oklab 180deg, #274060 0%, #7a8fb0 45%, #f0c8a0 85%, #fff0d8 100%)', cardBackground: 'linear-gradient(in oklab 180deg, #274060 0%, #7a8fb0 45%, #f0c8a0 85%, #fff0d8 100%)', text: '#243247', overlayTint: '#fff9ed', grain: 35, font: 'serif', radius: 12, shadow: 32, overlay: 52, brightness: 100, titleScale: 108, align: 'start', valign: 'end', cardStyle: 'classic', frame: 3, glow: 55, vignette: 0, sheen: false, border: false },
  },
  {
    id: 'mountain-dawn-mesh', name: 'Mountain Dawn Mesh', description: 'Five-color mesh · tactile grain', accent: '#c2e1ee',
    palette: ['#0b1020', '#24122c', '#301a39'],
    look: { stage: 'radial-gradient(ellipse at 93% 17%, #b2213e 0%, transparent 38%), radial-gradient(ellipse at 84% 100%, #b22525 0%, transparent 42%), radial-gradient(ellipse at 2% 91%, #3a02df 0%, transparent 38%), radial-gradient(ellipse at 13% 92%, #c2e1ee 0%, transparent 45%), radial-gradient(ellipse at 87% 7%, #ed58dc 0%, transparent 40%), #0b1020', cardBackground: 'radial-gradient(ellipse at 93% 17%, #b2213e 0%, transparent 38%), radial-gradient(ellipse at 84% 100%, #b22525 0%, transparent 42%), radial-gradient(ellipse at 2% 91%, #3a02df 0%, transparent 38%), radial-gradient(ellipse at 13% 92%, #c2e1ee 0%, transparent 45%), radial-gradient(ellipse at 87% 7%, #ed58dc 0%, transparent 40%), #0b1020', text: '#f5f0ff', overlayTint: '#171022', grain: 35, font: 'serif', radius: 16, shadow: 55, overlay: 76, brightness: 100, titleScale: 110, align: 'start', valign: 'end', cardStyle: 'glass', frame: 3, glow: 52, vignette: 16, sheen: true, border: false },
  },
  {
    id: 'ocean-glass', name: 'Ocean Glass', description: 'Tidal teal · cool translucent edges', accent: '#72e0ce',
    palette: ['#103b48', '#14525b', '#1d6870'],
    look: { stage: 'linear-gradient(135deg, #0b2833 0%, #176b78 52%, #75bda9 100%)', cardBackground: 'linear-gradient(145deg, #102d38, #176b78 60%, #278276)', text: '#effffb', overlayTint: '#103d45', font: 'sans', radius: 24, shadow: 42, overlay: 78, brightness: 100, titleScale: 104, align: 'start', valign: 'end', cardStyle: 'glass', frame: 3, glow: 50, vignette: 14, sheen: true, border: false },
  },
  {
    id: 'paper-ink', name: 'Paper & Ink', description: 'Warm paper · high-contrast type', accent: '#a54e35',
    palette: ['#f2eadc', '#e7dece', '#d9cfbd'],
    look: { stage: 'linear-gradient(135deg, #f8f4eb, #e8dfd1)', cardBackground: 'linear-gradient(145deg, #fffdf7, #efe5d5)', text: '#252820', overlayTint: '#fffdf8', font: 'serif', radius: 4, shadow: 18, overlay: 32, brightness: 100, titleScale: 116, align: 'start', valign: 'end', cardStyle: 'polaroid', frame: 4, glow: 30, vignette: 0, sheen: false, border: true },
  },
  {
    id: 'sage-atelier', name: 'Sage Atelier', description: 'Soft stone · botanical green', accent: '#52745e',
    palette: ['#e1e6d9', '#d1dccd', '#c2d0c0'],
    look: { stage: 'linear-gradient(135deg, #f0eee3, #dce5d8 55%, #b8cdbb)', cardBackground: 'linear-gradient(145deg, #e7eadf, #cad5c4 58%, #94a88c)', text: '#25372e', overlayTint: '#f3f5e9', font: 'sans', radius: 14, shadow: 24, overlay: 38, brightness: 100, titleScale: 100, align: 'start', valign: 'end', cardStyle: 'frame', frame: 3, glow: 32, vignette: 0, sheen: false, border: false },
  },
  {
    id: 'citrus-pop', name: 'Citrus Pop', description: 'Lemon cream · juicy coral accents', accent: '#d94f38',
    palette: ['#fff0b5', '#f9d98b', '#f1b18a'],
    look: { stage: 'linear-gradient(135deg, #fff1ad, #f4a261 62%, #e76f51)', cardBackground: 'linear-gradient(145deg, #fff4bf, #f3bb76 58%, #e98566)', text: '#292624', overlayTint: '#fff3d4', font: 'sans', radius: 24, shadow: 26, overlay: 36, brightness: 100, titleScale: 108, align: 'center', valign: 'center', cardStyle: 'classic', frame: 3, glow: 35, vignette: 0, sheen: false, border: true },
  },
  {
    id: 'electric-lime', name: 'Electric Lime', description: 'Charcoal · acid green signal', accent: '#c6ff4b',
    palette: ['#182018', '#20291c', '#2a301d'],
    look: { stage: 'radial-gradient(ellipse at 85% 15%, #596c20 0%, transparent 38%), #101510', cardBackground: 'radial-gradient(ellipse at 84% 14%, #596c20 0%, transparent 54%), linear-gradient(145deg, #141b16, #27311c)', text: '#f3f8e9', overlayTint: '#1b2515', font: 'mono', radius: 5, shadow: 34, overlay: 84, brightness: 100, titleScale: 92, align: 'start', valign: 'end', cardStyle: 'glow', frame: 3, glow: 78, vignette: 22, sheen: false, border: true },
  },
];

export function applyCarouselTheme(project: Project, theme: CarouselTheme): Project {
  return {
    ...project,
    look: { ...project.look, ...theme.look, grain: theme.look.grain ?? 0, theme: theme.id },
    slides: project.slides.map((slide, index) => ({
      ...slide,
      color: theme.palette[index % theme.palette.length],
      accent: theme.accent,
    })),
  };
}
