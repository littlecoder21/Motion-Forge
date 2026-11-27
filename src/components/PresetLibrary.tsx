import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Plus, Search, Star, Trash2 } from 'lucide-react';
import type { Project } from '@/lib/model';
import { PRESET_CATEGORIES, presetFromProject, presetGlyph, presets, type Preset } from '@/lib/presets';
import { Glyph } from './glyphs';

const PRESET_KEY = 'carousel-motion-studio-presets', FAV_KEY = 'carousel-motion-studio-favorites';
const keyOf = (p: Preset) => `${p.category}::${p.name}`;
function readFavorites(): string[] {
  try { const v: unknown = JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]'); return Array.isArray(v) && v.every((i) => typeof i === 'string') ? v : []; } catch { return []; }
}
function readCustom(): Preset[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(PRESET_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((i): i is Preset => !!i && typeof i === 'object' && typeof i.name === 'string' && typeof i.category === 'string' && typeof i.layout === 'string' && typeof i.motion === 'string' && typeof i.easing === 'string' && typeof i.duration === 'number' && typeof i.visible === 'number' && typeof i.gap === 'number' && typeof i.note === 'string' && typeof i.tone === 'string') : [];
  } catch { return []; }
}
/** Dark ink on light thumbnails, light ink on dark ones. */
const inkFor = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 'rgba(255,255,255,.92)';
  const n = parseInt(m[1], 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? 'rgba(20,24,28,.82)' : 'rgba(255,255,255,.92)';
};
const categoryRank = (c: string) => { const i = (PRESET_CATEGORIES as readonly string[]).indexOf(c); return i < 0 ? 99 : i; };

export function PresetLibrary({ project, onApply, notify, touch = false }: { project: Project; onApply: (p: Preset) => void; notify: (t: string) => void; touch?: boolean }) {
  const [custom, setCustom] = useState<Preset[]>(readCustom);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  useEffect(() => { try { localStorage.setItem(PRESET_KEY, JSON.stringify(custom)); } catch { notify('Custom presets could not be saved in browser storage.'); } }, [custom, notify]);
  useEffect(() => { try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch { notify('Favorite settings could not be saved in browser storage.'); } }, [favorites, notify]);
  const all = useMemo(() => [...presets, ...custom], [custom]);
  const categories = useMemo(() => ['All', 'Favorites', ...Array.from(new Set(all.map((p) => p.category))).sort((a, b) => categoryRank(a) - categoryRank(b))], [all]);
  const counts = useMemo(() => { const m: Record<string, number> = { All: all.length, Favorites: all.filter((p) => favorites.includes(keyOf(p))).length }; for (const p of all) m[p.category] = (m[p.category] ?? 0) + 1; return m; }, [all, favorites]);
  const shown = useMemo(() => all.filter((p) => (category === 'All' || (category === 'Favorites' ? favorites.includes(keyOf(p)) : p.category === category)) && `${p.name} ${p.category} ${p.note} ${p.layout} ${p.patch?.spatial?.formation ?? ''}`.toLowerCase().includes(search.toLowerCase())), [all, category, favorites, search]);
  const saveCurrent = () => {
    const name = window.prompt('Name this motion preset', `${project.name} motion`);
    if (!name?.trim()) return;
    const preset: Preset = { name: name.trim(), category: 'My presets', layout: project.layout, motion: project.motion, easing: project.easing, duration: project.duration, visible: project.visible, gap: project.gap, note: 'Saved from the current carousel configuration.', tone: project.slides[project.active]?.color ?? '#34455a', patch: presetFromProject(project) };
    setCustom((items) => [preset, ...items.filter((i) => i.name.toLowerCase() !== preset.name.toLowerCase())]); setCategory('My presets'); notify('Custom preset saved');
  };
  return <section className={`preset-library ${touch ? 'touch' : ''}`}>
    <div className="section-row"><span>PRESET LIBRARY <b>{all.length}</b></span><button type="button" className="text-action" onClick={saveCurrent}><Plus size={13} /> Save current</button></div>
    <div className="search-box"><Search size={14} /><input placeholder="Find a motion…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search presets" /></div>
    <div className="category-list">{categories.map((c) => <button type="button" key={c} onClick={() => setCategory(c)} className={category === c ? 'picked' : ''}>{c}<em className="cat-count">{counts[c] ?? 0}</em></button>)}</div>
    <div className="preset-list">{shown.map((p, i) => {
      const g = presetGlyph(p);
      return <div key={`${p.category}-${p.name}-${i}`} className="preset-card-shell">
        <button type="button" className="preset-card" onClick={() => onApply(p)}>
          <span className="preset-preview has-glyph" style={{ backgroundColor: p.tone, color: inkFor(p.tone) }}><Glyph family={g.family} id={g.id} /></span>
          <span className="preset-details"><strong>{p.name}</strong><small>{p.category} · {g.id} · {p.duration}ms{p.minSlides ? ` · ${p.minSlides}+ slides` : ''}</small></span><ChevronRight size={14} />
        </button>
        <button type="button" className={`preset-star ${favorites.includes(keyOf(p)) ? 'saved' : ''}`} aria-label={`${favorites.includes(keyOf(p)) ? 'Remove' : 'Add'} ${p.name} ${favorites.includes(keyOf(p)) ? 'from' : 'to'} favorites`} onClick={() => setFavorites((f) => (f.includes(keyOf(p)) ? f.filter((i) => i !== keyOf(p)) : [...f, keyOf(p)]))}><Star size={13} fill={favorites.includes(keyOf(p)) ? 'currentColor' : 'none'} /></button>
        {p.category === 'My presets' && <button type="button" className="preset-remove" aria-label={`Delete ${p.name}`} onClick={() => { if (!window.confirm(`Delete the saved preset “${p.name}”?`)) return; setCustom((items) => items.filter((i) => i.name !== p.name)); setFavorites((f) => f.filter((i) => i !== keyOf(p))); notify('Custom preset deleted'); }}><Trash2 size={13} /></button>}
      </div>;
    })}</div>
    {!shown.length && <div className="empty-state">No presets match that search.</div>}
  </section>;
}
