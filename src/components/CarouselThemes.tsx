import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import type { Project } from '@/lib/model';
import { applyCarouselTheme, CAROUSEL_THEMES } from '@/lib/themes';
import './carousel-themes.css';

export function CarouselThemes({ project, onApply }: { project: Project; onApply: (project: Project) => void }) {
  return <div className="carousel-theme-picker">
    <p>Apply a visual style to the carousel. Slide content and motion stay unchanged.</p>
    <div className="carousel-theme-grid">
      {CAROUSEL_THEMES.map((theme) => <button
        type="button"
        key={theme.id}
        className={`carousel-theme ${project.look.theme === theme.id ? 'selected' : ''}`}
        aria-pressed={project.look.theme === theme.id}
        aria-label={`Apply ${theme.name} theme`}
        onClick={() => onApply(applyCarouselTheme(project, theme))}
      >
        <span className="carousel-theme-swatch" style={{ background: theme.look.cardBackground, color: theme.look.text, fontFamily: theme.look.font === 'serif' ? 'Georgia, serif' : theme.look.font === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif' } as CSSProperties}>
          <b>Aa</b><i style={{ backgroundColor: theme.accent }} />
        </span>
        <span className="carousel-theme-copy"><strong>{theme.name}</strong><small>{theme.description}</small></span>
        {project.look.theme === theme.id && <Check className="carousel-theme-check" size={13} aria-hidden="true" />}
      </button>)}
    </div>
  </div>;
}
