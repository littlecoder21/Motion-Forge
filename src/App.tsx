import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Copy, Download, Eye, FileJson, Film, FolderOpen, Grid2X2, Image as ImageIcon, Layers, LayoutGrid, Maximize2, MoreHorizontal, Pause, Play, Plus, RotateCcw, Search, Settings2, SlidersHorizontal, Sparkles, Star, Trash2, Upload, WandSparkles, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Preview } from './components/Preview';
import { freshSlide, initialProject, parseProject, type Layout, type Project, type Slide } from './lib/model';
import { presets, type Preset } from './lib/presets';
import { cssExport, htmlExport, projectJson, reactExport } from './lib/exporters';
import JSZip from 'jszip';
import './export-controls.css';

type Tab = 'Slides' | 'Layouts' | 'Presets' | 'Layers' | 'Assets';
const layoutOptions: { id: Layout; label: string; descriptor: string }[] = [
 { id: 'standard', label: 'Standard', descriptor: 'One slide at a time' }, { id: 'hero', label: 'Hero', descriptor: 'Immersive full bleed' },
 { id: 'centered', label: 'Centered', descriptor: 'Focused side-peek' }, { id: 'multi', label: 'Multi-card', descriptor: 'Browse a collection' },
 { id: 'coverflow', label: 'Coverflow', descriptor: 'Perspective depth' }, { id: 'stack', label: 'Stack', descriptor: 'Layered cards' },
 { id: 'vertical', label: 'Vertical', descriptor: 'Up and down motion' }, { id: 'marquee', label: 'Marquee', descriptor: 'Continuous loop' },
];
const deviceSizes: Record<string, string> = { Desktop: '100%', Laptop: '86%', Tablet: '68%', Mobile: '40%', 'Large desktop': '100%', 'Ultra-wide': '100%', Custom: '100%' };
const deviceDimensions: Record<string, string> = { Desktop: '1440 × 900', Laptop: '1440 × 900', Tablet: '768 × 1024', Mobile: '390 × 844', 'Large desktop': '1920 × 1080', 'Ultra-wide': '2560 × 1080' };
const themes = ['#34455a','#4d4738','#354d49','#4c3947','#393e55','#3e4b4d','#58433d','#384451','#4b3f53','#3e4c3f'];
const presetKey = (preset: Preset) => `${preset.category}::${preset.name}`;
function readPresetList(key: string): string[] {
 try {
  const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : [];
 } catch { return []; }
}
function readCustomPresets(): Preset[] {
 try {
  const value: unknown = JSON.parse(localStorage.getItem('carousel-motion-studio-presets') ?? '[]');
  return Array.isArray(value) ? value.filter((item): item is Preset => item && typeof item === 'object' && typeof item.name === 'string' && typeof item.category === 'string' && typeof item.layout === 'string' && typeof item.motion === 'string' && typeof item.easing === 'string' && typeof item.duration === 'number' && typeof item.visible === 'number' && typeof item.gap === 'number' && typeof item.note === 'string' && typeof item.tone === 'string') : [];
 } catch { return []; }
}

function App() {
 const [project, setProject] = useState<Project>(() => {
  try { const stored = localStorage.getItem('carousel-motion-studio-project'); return stored ? { ...initialProject(), ...JSON.parse(stored) } : initialProject(); }
  catch { return initialProject(); }
 });
 const [activeTab, setActiveTab] = useState<Tab>('Slides');
 const [device, setDevice] = useState('Desktop');
  const [previewMode, setPreviewMode] = useState(false);
  const [ratio, setRatio] = useState('auto');
  const [customRatioWidth, setCustomRatioWidth] = useState(16);
  const [customRatioHeight, setCustomRatioHeight] = useState(9);
  const [customViewportWidth, setCustomViewportWidth] = useState(1280);
  const [customViewportHeight, setCustomViewportHeight] = useState(800);
 const [zoom, setZoom] = useState(1);
 const [grid, setGrid] = useState(false);
 const [safe, setSafe] = useState(false);
 const [playing, setPlaying] = useState(() => project.autoplay);
 const [timelineOpen, setTimelineOpen] = useState(true);
 const [search, setSearch] = useState('');
 const [category, setCategory] = useState('All');
  const [customPresets, setCustomPresets] = useState<Preset[]>(readCustomPresets);
  const [favorites, setFavorites] = useState<string[]>(() => readPresetList('carousel-motion-studio-favorites'));
 const [exportOpen, setExportOpen] = useState(false);
  const [exportType, setExportType] = useState<'React'|'CSS'|'HTML'|'JSON'>('React');
 const [saveState, setSaveState] = useState<'saved'|'saving'>('saved');
 const [dragIndex, setDragIndex] = useState<number | null>(null);
 const [toast, setToast] = useState('');
 const [history, setHistory] = useState<Project[]>([]);
 const [future, setFuture] = useState<Project[]>([]);
 const fileRef = useRef<HTMLInputElement>(null);
 const uploadRef = useRef<HTMLInputElement>(null);
 const activeSlide = project.slides[project.active] ?? project.slides[0];
  const aspectRatio = ratio === 'auto'
   ? device === 'Mobile' ? '390 / 844' : device === 'Tablet' ? '768 / 1024' : device === 'Laptop' ? '16 / 10' : device === 'Ultra-wide' ? '21 / 9' : device === 'Custom' ? `${customViewportWidth} / ${customViewportHeight}` : '16 / 9'
   : ratio === 'custom' ? `${customRatioWidth} / ${customRatioHeight}` : ratio;
  const viewportDimensions = device === 'Custom' ? `${customViewportWidth} × ${customViewportHeight}` : deviceDimensions[device];
  const currentCode = exportType === 'React' ? reactExport(project) : exportType === 'CSS' ? cssExport(project) : exportType === 'HTML' ? htmlExport(project) : projectJson(project);
  const allPresets = useMemo(() => [...presets, ...customPresets], [customPresets]);
  const filteredPresets = useMemo(() => allPresets.filter(p => (category === 'All' || (category === 'Favorites' ? favorites.includes(presetKey(p)) : p.category === category)) && `${p.name} ${p.category} ${p.note} ${p.layout}`.toLowerCase().includes(search.toLowerCase())), [allPresets, category, favorites, search]);
  const categories = useMemo(() => ['All', 'Favorites', ...Array.from(new Set(allPresets.map(p => p.category)))], [allPresets]);
 const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(''), 2300); };
 const update = (fn: (current: Project) => Project) => {
  setProject(current => { const next = fn(current); setHistory(items => [...items.slice(-29), current]); setFuture([]); setSaveState('saving'); return next; });
 };
 useEffect(() => {
  const timer = window.setTimeout(() => {
   try { localStorage.setItem('carousel-motion-studio-project', JSON.stringify(project)); setSaveState('saved'); } catch { setSaveState('saved'); notify('Project is too large for browser storage. Export JSON to keep a copy.'); }
  }, 450);
  return () => window.clearTimeout(timer);
 }, [project]);
  useEffect(() => { try { localStorage.setItem('carousel-motion-studio-presets', JSON.stringify(customPresets)); } catch { notify('Custom presets could not be saved in browser storage.'); } }, [customPresets]);
  useEffect(() => { try { localStorage.setItem('carousel-motion-studio-favorites', JSON.stringify(favorites)); } catch { notify('Favorite settings could not be saved in browser storage.'); } }, [favorites]);
 useEffect(() => {
   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { if (playing) setPlaying(false); return; }
   if (!playing || !project.slides.length || project.layout === 'marquee') return;
   const timer = window.setInterval(() => setProject(p => {
    if (!p.loop && p.active >= p.slides.length - 1) {
     window.setTimeout(() => setPlaying(false), 0);
     return p;
    }
    return { ...p, active: (p.active + 1) % p.slides.length };
   }), project.interval);
  return () => window.clearInterval(timer);
 }, [playing, project.interval, project.slides.length, project.layout]);
 useEffect(() => {
  const key = (e: KeyboardEvent) => {
   if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
   if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setPlaying(v => !v); }
  };
  window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
 });
 function setField<K extends keyof Project>(key: K, value: Project[K]) { update(p => ({ ...p, [key]: value })); }
 function patchSlide(key: keyof Slide, value: string) { update(p => ({ ...p, slides: p.slides.map((s, i) => i === p.active ? { ...s, [key]: value } : s) })); }
 function undo() { if (!history.length) return; const previous = history[history.length - 1]; setFuture(f => [project, ...f]); setHistory(history.slice(0, -1)); setProject(previous); }
 function redo() { if (!future.length) return; setHistory(h => [...h, project]); setProject(future[0]); setFuture(future.slice(1)); }
 function addSlide() { const slide = freshSlide(project.slides.length); update(p => ({ ...p, slides: [...p.slides, slide], active: p.slides.length })); setActiveTab('Slides'); }
 function duplicateSlide() { if (!activeSlide) return; const copy = { ...activeSlide, id: `slide-${Date.now()}`, name: `${activeSlide.name} copy` }; update(p => { const slides = [...p.slides]; slides.splice(p.active + 1, 0, copy); return { ...p, slides, active: p.active + 1 }; }); }
 function deleteSlide() { if (project.slides.length <= 1) { notify('A carousel needs at least one slide.'); return; } update(p => ({ ...p, slides: p.slides.filter((_, i) => i !== p.active), active: Math.max(0, Math.min(p.active, p.slides.length - 2)) })); }
 function moveSlide(index: number, dest: number) { if (dest < 0 || dest >= project.slides.length) return; update(p => { const slides = [...p.slides]; const [item] = slides.splice(index, 1); slides.splice(dest, 0, item); return { ...p, slides, active: dest }; }); }
 function applyPreset(preset: typeof presets[number]) { update(p => ({ ...p, layout: preset.layout, motion: preset.motion, easing: preset.easing, duration: preset.duration, visible: preset.visible, gap: preset.gap })); notify(`${preset.name} applied`); }
  function saveCurrentPreset() {
   const name = window.prompt('Name this motion preset', `${project.name} motion`);
   if (!name?.trim()) return;
   const preset: Preset = { name: name.trim(), category: 'My presets', layout: project.layout, motion: project.motion, easing: project.easing, duration: project.duration, visible: project.visible, gap: project.gap, note: 'Saved from the current carousel configuration.', tone: activeSlide?.color ?? '#34455a' };
   setCustomPresets(items => [preset, ...items.filter(item => item.name.toLowerCase() !== preset.name.toLowerCase())]);
   setCategory('My presets');
   notify('Custom preset saved');
  }
  function toggleFavorite(preset: Preset) {
   const key = presetKey(preset);
   setFavorites(items => items.includes(key) ? items.filter(item => item !== key) : [...items, key]);
  }
  function downloadBlob(name: string, blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function download(name: string, text: string, type: string) { downloadBlob(name, new Blob([text], { type })); }
  async function downloadBundle() {
   const zip = new JSZip();
   const bundledProject = JSON.parse(JSON.stringify(project)) as Project;
   const assets = zip.folder('assets');
   bundledProject.slides = bundledProject.slides.map((slide, index) => {
    const match = slide.image.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/);
    if (!match || !assets) return slide;
    const extension = match[1] === 'jpeg' ? 'jpg' : match[1] === 'svg+xml' ? 'svg' : match[1];
    const assetName = `slide-${String(index + 1).padStart(2, '0')}.${extension}`;
    assets.file(assetName, match[2], { base64: true });
    return { ...slide, image: `./assets/${assetName}` };
   });
   zip.file('Carousel.tsx', reactExport(bundledProject));
   zip.file('carousel.css', cssExport(bundledProject));
   zip.file('carousel.html', htmlExport(bundledProject));
   zip.file('carousel-project.json', projectJson(bundledProject));
   zip.file('README.md', `# ${project.name}\n\nThis bundle contains a reusable React carousel, its stylesheet, a standalone HTML build, the editable project configuration, and any uploaded image assets.\n\nFor React, place Carousel.tsx and carousel.css in the same source folder, then import and render <Carousel />. No carousel library is required.\n`);
   downloadBlob('carousel-motion-studio.zip', await zip.generateAsync({ type: 'blob' }));
   notify('Project bundle downloaded');
  }
 function importProject(file?: File) {
  if (!file) return; const reader = new FileReader();
   reader.onload = () => { try { const parsed = parseProject(JSON.parse(String(reader.result))); if (!parsed) throw new Error('Invalid project schema'); setProject(parsed); setHistory([]); setFuture([]); setPlaying(parsed.autoplay); notify('Project imported'); } catch { notify('That file is not a valid MotionForge project.'); } };
  reader.readAsText(file);
 }
 async function copyCode() { try { await navigator.clipboard.writeText(currentCode); notify('Code copied to clipboard'); } catch { notify('Clipboard access unavailable. Download the file instead.'); } }
 function uploadImage(file?: File) { if (!file || !activeSlide) return; const reader = new FileReader(); reader.onload = () => patchSlide('image', String(reader.result)); reader.readAsDataURL(file); }
 const visibleSlides = project.slides.length;
  return <main className={`app ${previewMode ? 'preview-only' : ''}`}>
  <header className="topbar">
   <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>MotionForge</strong><small>SLIDER STUDIO</small></div></div>
   <div className="project-title"><input aria-label="Project name" value={project.name} onChange={e => setField('name', e.target.value)} /><div className="save-indicator"><i className={saveState} />{saveState === 'saving' ? 'Saving…' : 'Saved locally'}</div></div>
   <div className="top-actions">
    <button className="icon-button" title="Undo" aria-label="Undo" onClick={undo} disabled={!history.length}><ArrowLeft size={15} /><span>Undo</span></button>
    <button className="icon-button" title="Redo" aria-label="Redo" onClick={redo} disabled={!future.length}><ArrowRight size={15} /><span>Redo</span></button>
    <span className="top-divider" />
     <button className={`icon-button ${previewMode ? 'on' : ''}`} onClick={() => setPreviewMode(value => !value)} title={previewMode ? 'Return to edit mode' : 'Open preview mode'}>{previewMode ? <Settings2 size={15} /> : <Eye size={15} />}<span>{previewMode ? 'Edit' : 'Preview mode'}</span></button>
     <button className={`icon-button preview-mode ${playing ? 'on' : ''}`} onClick={() => setPlaying(!playing)} title={playing ? 'Pause preview' : 'Play preview'}>{playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}<span>{playing ? 'Pause' : 'Play'}</span></button>
    <button className="export-button" onClick={() => setExportOpen(true)}><Download size={15} /> Export</button>
   </div>
  </header>
  <div className="workspace">
   <aside className="left-panel">
    <div className="panel-heading"><span>PROJECT</span><button title="Import project JSON" aria-label="Import project JSON" className="quiet-icon" onClick={() => fileRef.current?.click()}><FolderOpen size={15} /></button><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={e => importProject(e.target.files?.[0])} /></div>
    <div className="tab-list">{(['Slides','Layouts','Presets','Layers','Assets'] as Tab[]).map((tab, i) => {
      const Icon = [Film, LayoutGrid, Sparkles, Layers, ImageIcon][i]; return <button key={tab} className={`side-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}><Icon size={15} /><span>{tab}</span>{tab === 'Slides' && <em>{String(project.slides.length).padStart(2,'0')}</em>}</button>;
     })}</div>
    <div className="sidebar-content">
     {activeTab === 'Slides' && <section>
      <div className="section-row"><span>SLIDE SEQUENCE</span><button className="text-action" onClick={addSlide}><Plus size={13} /> Add</button></div>
      <div className="slide-list">{project.slides.map((s, i) => <div key={s.id} className={`slide-row ${i === project.active ? 'selected' : ''}`} draggable onDragStart={() => setDragIndex(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIndex !== null) moveSlide(dragIndex, i); setDragIndex(null); }} onClick={() => setField('active', i)}>
       <div className="slide-thumb" style={{ backgroundColor:s.color, backgroundImage:s.image ? `url("${s.image}")` : `radial-gradient(ellipse at 80% 20%,${s.accent}70,transparent 60%)` }}><span>{String(i+1).padStart(2,'0')}</span></div>
       <div className="slide-row-info"><strong>{s.name}</strong><small>{s.title.slice(0, 26)}{s.title.length > 26 ? '…' : ''}</small></div>
       {i === project.active && <button className="row-menu" title="Delete slide" aria-label={`Delete ${s.name}`} onClick={e => { e.stopPropagation(); deleteSlide(); }}><Trash2 size={13} /></button>}
      </div>)}</div>
      <div className="slide-actions"><button onClick={duplicateSlide}><Copy size={14} /> Duplicate</button><button onClick={deleteSlide}><Trash2 size={14} /> Delete</button></div>
      <button className="add-slide-wide" onClick={addSlide}><Plus size={15} /> Add slide <span>⌘ + ↵</span></button>
     </section>}
     {activeTab === 'Layouts' && <section><div className="section-row"><span>LAYOUT SYSTEMS</span></div><div className="layout-list">{layoutOptions.map(item => <button key={item.id} className={`layout-option ${project.layout === item.id ? 'chosen' : ''}`} onClick={() => setField('layout', item.id)}><span className={`layout-glyph ${item.id}`}><i /><i /><i /></span><span><strong>{item.label}</strong><small>{item.descriptor}</small></span>{project.layout === item.id && <Check size={14} />}</button>)}</div></section>}
     {activeTab === 'Presets' && <section>
      <div className="section-row"><span>PRESET LIBRARY <b>{allPresets.length}</b></span><button className="text-action" onClick={saveCurrentPreset}><Plus size={13} /> Save current</button></div>
      <div className="search-box"><Search size={14} /><input placeholder="Find a motion…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search presets" /></div>
      <div className="category-list">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={category === c ? 'picked' : ''}>{c}</button>)}</div>
      <div className="preset-list">{filteredPresets.map((p, i) => <div key={`${p.category}-${p.name}-${i}`} className="preset-card-shell">
       <button className="preset-card" onClick={() => applyPreset(p)}><span className={`preset-preview ${p.layout}`} style={{ backgroundColor:p.tone }}><i /><i /><i /></span><span className="preset-details"><strong>{p.name}</strong><small>{p.category} · {p.layout} · {p.duration}ms</small></span><ChevronRight size={14} /></button>
       <button className={`preset-star ${favorites.includes(presetKey(p)) ? 'saved' : ''}`} aria-label={`${favorites.includes(presetKey(p)) ? 'Remove' : 'Add'} ${p.name} ${favorites.includes(presetKey(p)) ? 'from' : 'to'} favorites`} title={favorites.includes(presetKey(p)) ? 'Remove from favorites' : 'Add to favorites'} onClick={() => toggleFavorite(p)}><Star size={13} fill={favorites.includes(presetKey(p)) ? 'currentColor' : 'none'} /></button>
       {p.category === 'My presets' && <button className="preset-remove" aria-label={`Delete ${p.name}`} title="Delete custom preset" onClick={() => { if (!window.confirm(`Delete the saved preset “${p.name}”?`)) return; setCustomPresets(items => items.filter(item => item.name !== p.name)); setFavorites(items => items.filter(item => item !== presetKey(p))); notify('Custom preset deleted'); }}><Trash2 size={13} /></button>}
      </div>)}</div>
      {!filteredPresets.length && <div className="empty-state">No presets match that search.</div>}
     </section>}
     {activeTab === 'Layers' && <section><div className="section-row"><span>SLIDE LAYERS</span><button className="quiet-icon" onClick={() => notify('Slide content layers are edited in the inspector.')} aria-label="Layer information"><CircleHelp size={14} /></button></div><div className="layer-list">{[{label:'Background image',Icon:ImageIcon},{label:'Color overlay',Icon:Grid2X2},{label:'Eyebrow',Icon:SlidersHorizontal},{label:'Heading',Icon:Settings2},{label:'Description',Icon:Settings2},{label:'Call to action',Icon:ArrowUpRight}].map(({label,Icon}) => <div className="layer-row" key={label}><Icon size={14} /><span>{label}</span><span className="layer-eye"><Eye size={13} /></span></div>)}</div><div className="info-note">Layer visibility and content are reflected in the live canvas. Edit copy and image in the inspector.</div></section>}
     {activeTab === 'Assets' && <section><div className="section-row"><span>PROJECT ASSETS</span><button className="text-action" onClick={() => uploadRef.current?.click()}><Plus size={13} /> Add</button></div><input ref={uploadRef} type="file" accept="image/*" hidden onChange={e => uploadImage(e.target.files?.[0])} /><button className="upload-box" onClick={() => uploadRef.current?.click()}><Upload size={18} /><strong>Upload an image</strong><span>Choose a file from your device</span></button>{project.slides.filter(s => s.image).map(s => <button key={s.id} className="asset-row" onClick={() => { setField('active', project.slides.indexOf(s)); setActiveTab('Slides'); }}><img src={s.image} alt="" /><span>{s.name}</span><ChevronRight size={13} /></button>)}<div className="info-note">Uploaded image data is stored with this project in your browser. For large files, use an image URL to keep project JSON lightweight.</div></section>}
    </div>
    <div className="sidebar-bottom"><span className="status-dot" /> LOCAL PROJECT <span className="mono">v1.0</span></div>
   </aside>
   <section className="center-panel">
    <div className="canvas-toolbar">
     <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><b>{activeSlide?.name ?? 'Canvas'}</b><span className="canvas-tag">CANVAS</span></div>
     <div className="canvas-tools">
       <label className="device-select"><span>Viewport</span><select value={device} onChange={e => setDevice(e.target.value)} aria-label="Preview viewport">{Object.keys(deviceSizes).map(d => <option key={d}>{d}</option>)}</select><ChevronDown size={12} /></label>
       <label className="device-select ratio-select"><span>Ratio</span><select value={ratio} onChange={e => setRatio(e.target.value)} aria-label="Preview aspect ratio"><option value="auto">Auto</option><option value="21 / 9">21:9</option><option value="16 / 9">16:9</option><option value="16 / 10">16:10</option><option value="4 / 3">4:3</option><option value="1 / 1">1:1</option><option value="custom">Custom</option></select><ChevronDown size={12} /></label>
       {device === 'Custom' && <div className="custom-viewport"><input type="number" min="320" max="3000" value={customViewportWidth} aria-label="Custom viewport width" onChange={e => setCustomViewportWidth(Math.max(320, Number(e.target.value) || 320))} /><span>×</span><input type="number" min="320" max="3000" value={customViewportHeight} aria-label="Custom viewport height" onChange={e => setCustomViewportHeight(Math.max(320, Number(e.target.value) || 320))} /></div>}
       {ratio === 'custom' && <div className="custom-viewport ratio-values"><input type="number" min="1" max="64" value={customRatioWidth} aria-label="Custom aspect ratio width" onChange={e => setCustomRatioWidth(Math.max(1, Number(e.target.value) || 1))} /><span>:</span><input type="number" min="1" max="64" value={customRatioHeight} aria-label="Custom aspect ratio height" onChange={e => setCustomRatioHeight(Math.max(1, Number(e.target.value) || 1))} /></div>}
      <span className="tool-separator" />
       <button className="tool-button" title="Fullscreen preview" aria-label="Fullscreen preview" onClick={() => { const canvas = document.querySelector('.preview-canvas'); if (canvas instanceof HTMLElement && canvas.requestFullscreen) void canvas.requestFullscreen(); }}><Maximize2 size={15} /></button>
      <button className={`tool-button ${grid ? 'selected' : ''}`} title="Toggle grid" aria-label="Toggle grid" onClick={() => setGrid(!grid)}><Grid2X2 size={15} /></button>
      <button className={`tool-button ${safe ? 'selected' : ''}`} title="Toggle safe area" aria-label="Toggle safe area" onClick={() => setSafe(!safe)}><span className="safe-icon" /></button>
      <span className="tool-separator" />
      <button className="tool-button" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom(z => Math.max(.6, +(z - .1).toFixed(1)))}><ZoomOut size={15} /></button><span className="zoom-label mono">{Math.round(zoom * 100)}%</span><button className="tool-button" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom(z => Math.min(1.2, +(z + .1).toFixed(1)))}><ZoomIn size={15} /></button>
     </div>
    </div>
    <div className="canvas-stage">
      <div className="stage-ruler"><span>PREVIEW STAGE</span><span className="mono">{viewportDimensions} · {aspectRatio.replace(' / ', ':')}</span></div>
      <div className={`canvas-frame ${device.toLowerCase().replace(' ', '-')}`} style={{ width: device === 'Custom' ? `min(${customViewportWidth}px, 100%)` : deviceSizes[device] }}>
       <Preview project={project} onSelect={index => setField('active', index)} device={device} zoom={zoom} grid={grid} safe={safe} ratio={aspectRatio} />
     </div>
     <div className="stage-foot"><span><b className="live-dot" /> Changes update in real time</span><span>DRAG OR USE ← → TO NAVIGATE</span></div>
    </div>
    <div className={`timeline ${timelineOpen ? '' : 'collapsed'}`}>
     <div className="timeline-head"><div className="timeline-title"><button aria-label="Collapse timeline" onClick={() => setTimelineOpen(!timelineOpen)}>{timelineOpen ? <ChevronDown size={15} /> : <ChevronUpIcon />}</button><span>TIMELINE</span><small>{(project.duration / 1000).toFixed(2)}s transition</small></div><div className="timeline-actions"><button className="tool-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>{playing ? <Pause size={14} /> : <Play size={14} />}</button><button className="tool-button" onClick={() => setField('active', 0)} aria-label="Reset playhead"><RotateCcw size={14} /></button><button className="tool-button" aria-label="Timeline settings" onClick={() => notify('Timeline timing is set in Motion controls.')}><MoreHorizontal size={16} /></button></div></div>
     {timelineOpen && <div className="timeline-body"><div className="timeline-ruler"><span>00:00</span><span>00:01</span><span>00:02</span><span>00:03</span><span>00:04</span><span>00:05</span></div><div className="track-row"><div className="track-label"><Layers size={13} /><span>Slides</span></div><div className="track-content"><div className="playhead" style={{ left: `${project.active / Math.max(1, project.slides.length - 1) * 100}%` }} /><div className="track-blocks">{project.slides.map((s, i) => <button key={s.id} onClick={() => setField('active', i)} className={`track-block ${i === project.active ? 'on' : ''}`} style={{ flex: project.layout === 'marquee' ? '0 0 22%' : undefined }}><i style={{ backgroundColor: s.accent }} />{s.name}<span>{(project.duration / 1000).toFixed(1)}s</span></button>)}</div><input type="range" min="0" max={Math.max(0, project.slides.length - 1)} value={project.active} aria-label="Timeline playhead" onChange={e => setField('active', Number(e.target.value))} /></div></div><div className="timeline-foot"><span><i /> Slide transition <b>{project.motion}</b></span><span className="mono">00:0{project.active} / 00:0{project.slides.length}</span></div></div>}
    </div>
   </section>
   <aside className="right-panel">
    <div className="inspector-head"><div><span>INSPECTOR</span><small>{activeSlide?.name ?? 'Carousel'}</small></div><button className="quiet-icon" aria-label="Reset active slide content" title="Reset active slide content" onClick={() => { if (activeSlide) update(p => ({ ...p, slides:p.slides.map((s,i)=>i===p.active?freshSlide(i):s) })); }}><RotateCcw size={14} /></button></div>
    <div className="inspector-tabs"><button className="active">Design</button><button onClick={() => setActiveTab('Layouts')}>Layout</button><button onClick={() => setActiveTab('Presets')}>Motion</button></div>
    <div className="inspector-content">
     <section className="inspector-section"><div className="section-row"><span>SLIDE CONTENT</span><button className="quiet-icon" title="Reset slide" aria-label="Reset slide" onClick={() => update(p => ({ ...p, slides:p.slides.map((s,i)=>i===p.active?freshSlide(i):s) }))}><RotateCcw size={13} /></button></div>
      <label className="field-label">Slide name<input value={activeSlide?.name ?? ''} onChange={e => patchSlide('name', e.target.value)} aria-label="Slide name" /></label>
      <label className="field-label">Eyebrow<input value={activeSlide?.eyebrow ?? ''} onChange={e => patchSlide('eyebrow', e.target.value)} aria-label="Eyebrow text" /></label>
      <label className="field-label">Headline<textarea rows={2} value={activeSlide?.title ?? ''} onChange={e => patchSlide('title', e.target.value)} aria-label="Slide headline" /></label>
      <label className="field-label">Description<textarea rows={3} value={activeSlide?.body ?? ''} onChange={e => patchSlide('body', e.target.value)} aria-label="Slide description" /></label>
      <label className="field-label">Button label<input value={activeSlide?.cta ?? ''} onChange={e => patchSlide('cta', e.target.value)} aria-label="Button label" /></label>
     </section>
     <section className="inspector-section"><div className="section-row"><span>IMAGE & BACKGROUND</span><ImageIcon size={14} /></div>
      <label className="field-label">Image URL<input value={activeSlide?.image?.startsWith('data:') ? '' : activeSlide?.image ?? ''} onChange={e => patchSlide('image', e.target.value)} placeholder="Paste an image URL…" aria-label="Slide image URL" /></label>
      <div className="field-buttons"><button onClick={() => uploadRef.current?.click()}><Upload size={13} /> Upload</button><button onClick={() => patchSlide('image', '')}><X size={13} /> Remove</button></div>
      <label className="field-label color-field">Background color <span className="color-input"><input type="color" value={activeSlide?.color ?? '#34455a'} onChange={e => patchSlide('color', e.target.value)} aria-label="Background color" /><span>{activeSlide?.color}</span></span></label>
      <div className="swatches">{themes.map(color => <button key={color} title={`Set background ${color}`} aria-label={`Set background ${color}`} style={{ background: color }} onClick={() => patchSlide('color', color)} />)}</div>
      <label className="field-label">Image focal point<select value={activeSlide?.focal ?? '50% 50%'} onChange={e => patchSlide('focal', e.target.value)}><option>50% 50%</option><option>50% 30%</option><option>50% 70%</option><option>35% 50%</option><option>65% 50%</option></select></label>
     </section>
     <section className="inspector-section"><div className="section-row"><span>LAYOUT</span><button className="quiet-icon" onClick={() => setActiveTab('Layouts')} aria-label="Browse layouts"><ChevronRight size={14} /></button></div>
      <label className="field-label">Structure<select value={project.layout} onChange={e => setField('layout', e.target.value as Layout)}>{layoutOptions.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}</select></label>
      {(project.layout === 'multi' || project.layout === 'centered') && <Range label="Visible cards" value={project.visible} min={2} max={5} onChange={value => setField('visible', value)} />}
      {project.layout !== 'hero' && <Range label="Card gap" value={project.gap} min={0} max={48} suffix="px" onChange={value => setField('gap', value)} />}
     </section>
     <section className="inspector-section"><div className="section-row"><span>MOTION</span><WandSparkles size={14} /></div>
      <label className="field-label">Transition<select value={project.motion} onChange={e => setField('motion', e.target.value as Project['motion'])}>{['slide','fade','zoom','lift','elastic'].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}</select></label>
      <Range label="Duration" value={project.duration} min={250} max={1800} step={50} suffix="ms" onChange={value => setField('duration', value)} />
      <Range label="Autoplay interval" value={project.interval} min={1200} max={8000} step={200} suffix="ms" onChange={value => setField('interval', value)} />
      <Toggle label="Autoplay" checked={project.autoplay} onChange={v => { setField('autoplay',v); setPlaying(v); }} />
      <Toggle label="Loop slides" checked={project.loop} onChange={v => setField('loop',v)} />
      {project.loop && project.layout !== 'marquee' && <Toggle label="Seamless loop" checked={project.seamlessLoop} onChange={v => setField('seamlessLoop',v)} />}
     </section>
     <section className="inspector-section"><div className="section-row"><span>ANIMATION CURVE</span><Clock3 size={14} /></div><label className="field-label">Easing<select value={project.easing} onChange={e => setField('easing', e.target.value)}><option>Ease out</option><option>Ease in out</option><option>Linear</option><option>Spring</option><option>Back</option></select></label><div className="curve-preview"><svg viewBox="0 0 200 48" role="img" aria-label={`${project.easing} easing curve preview`}><path d={project.easing === 'Linear' ? 'M2 44 L198 5' : project.easing === 'Ease in out' ? 'M2 44 C40 44 40 7 100 24 S160 5 198 5' : project.easing === 'Spring' || project.easing === 'Back' ? 'M2 44 C48 50 47 -4 105 8 S157 17 198 5' : 'M2 44 C32 42 37 7 70 5 S119 6 198 5'} /><path className="curve-dash" d="M2 44 L198 5" /></svg><span>{project.easing} · {project.motion} · {project.duration}ms</span></div></section>
    </div>
    <div className="inspector-footer"><span>Selected slide</span><span className="mono">{String(project.active + 1).padStart(2,'0')} / {String(project.slides.length).padStart(2,'0')}</span></div>
   </aside>
  </div>
  {exportOpen && <div className="modal-scrim" onMouseDown={e => { if (e.target === e.currentTarget) setExportOpen(false); }}><section className="export-modal" role="dialog" aria-modal="true" aria-label="Export project"><div className="modal-heading"><div><span className="modal-kicker">TAKE IT TO THE WEB</span><h2>Export your carousel</h2><p>Production-ready code, built from this exact configuration.</p></div><button className="quiet-icon" onClick={() => setExportOpen(false)} aria-label="Close export"><X size={18} /></button></div>
     <div className="export-tabs">{(['React','CSS','HTML','JSON'] as const).map((t, i) => <button key={t} className={exportType === t ? 'active' : ''} onClick={() => setExportType(t)}>{i === 0 ? <Sparkles size={15} /> : i === 1 ? <SlidersHorizontal size={15} /> : i === 2 ? <LayoutGrid size={15} /> : <FileJson size={15} />}{t}{t === 'React' && <small>TSX</small>}</button>)}</div>
     <div className="code-toolbar"><span><i /> {exportType === 'React' ? 'Carousel.tsx' : exportType === 'CSS' ? 'carousel.css' : exportType === 'HTML' ? 'carousel.html' : 'carousel-project.json'}</span><button onClick={copyCode}><Copy size={14} /> Copy code</button></div><pre className="code-preview"><code>{currentCode}</code></pre>
     <div className="export-bottom"><span><Check size={14} /> Config matches live preview</span><div className="export-actions"><button className="zip-button" onClick={downloadBundle}><FolderOpen size={14} /> Download ZIP</button><button className="export-button" onClick={() => { download(exportType === 'React' ? 'Carousel.tsx' : exportType === 'CSS' ? 'carousel.css' : exportType === 'HTML' ? 'carousel.html' : 'carousel-project.json', currentCode, exportType === 'HTML' ? 'text/html' : exportType === 'CSS' ? 'text/css' : exportType === 'JSON' ? 'application/json' : 'text/plain'); notify('Export downloaded'); }}><Download size={15} /> Download {exportType}</button></div></div>
   </section></div>}
  {toast && <div className="toast-message"><Check size={14} />{toast}</div>}
 </main>;
}
function ChevronUpIcon() { return <ArrowUp size={14} />; }
function Range({ label, value, min, max, step = 1, suffix = '', onChange }: { label:string; value:number; min:number; max:number; step?:number; suffix?:string; onChange:(value:number)=>void }) {
 return <label className="range-field"><span>{label}<b className="mono">{value}{suffix}</b></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} aria-label={label} /></label>;
}
function Toggle({ label, checked, onChange }: { label:string; checked:boolean; onChange:(value:boolean)=>void }) {
 return <label className="toggle-row"><span>{label}</span><button role="switch" aria-checked={checked} className={`switch ${checked ? 'checked' : ''}`} onClick={() => onChange(!checked)}><i /></button></label>;
}
export default App;
