import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowUp, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Download, Eye, Film, FolderOpen, Grid2X2, Image as ImageIcon, Layers, LayoutGrid, Maximize2, MoreHorizontal, Pause, Play, Plus, RotateCcw, Settings2, Sparkles, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { Preview } from './components/Preview';
import { Inspector } from './components/Inspector';
import { ExportModal } from './components/ExportModal';
import { PresetLibrary } from './components/PresetLibrary';
import { ControlList } from './components/controls';
import { Glyph } from './components/glyphs';
import { SlideList, type SlideApi } from './components/SlideEditor';
import { MobileEditor, type Shell } from './components/mobile/MobileEditor';
import type { EditorApi } from './components/editor-types';
import { useProject } from './hooks/use-project';
import { useViewport } from './hooks/use-viewport';
import { freshSlide, parseProject, type Project, type Slide } from './lib/model';
import { applyPresetTo, type Preset } from './lib/presets';
import { CATEGORIES, LAYOUT_META, setLayoutValue } from './lib/schema';
import { setPath } from './lib/utils';
import './export-controls.css';
import './studio-v2.css';

type Tab = 'Slides' | 'Layouts' | 'Presets' | 'Layers' | 'Assets';
const deviceSizes: Record<string, string> = { Desktop: '100%', Laptop: '86%', Tablet: '68%', Mobile: '40%', 'Large desktop': '100%', 'Ultra-wide': '100%', Custom: '100%' };
const deviceDimensions: Record<string, string> = { Desktop: '1440 × 900', Laptop: '1440 × 900', Tablet: '768 × 1024', Mobile: '390 × 844', 'Large desktop': '1920 × 1080', 'Ultra-wide': '2560 × 1080' };
const layersControls = CATEGORIES.find((c) => c.id === 'style')?.subs.find((s) => s.id === 'layers')?.controls ?? [];

function App() {
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);
  const notify = useCallback((text: string) => { setToast(text); window.clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(''), 2300); }, []);
  const onStorageError = useCallback(() => notify('Project is too large for browser storage. Export JSON to keep a copy.'), [notify]);
  const { project, update, patchQuiet, undo, redo, replace, canUndo, canRedo, saveState } = useProject(onStorageError);
  const vp = useViewport();

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
  const [exportOpen, setExportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const activeSlide: Slide = project.slides[project.active] ?? project.slides[0];

  const aspectRatio = ratio === 'auto'
    ? device === 'Mobile' ? '390 / 844' : device === 'Tablet' ? '768 / 1024' : device === 'Laptop' ? '16 / 10' : device === 'Ultra-wide' ? '21 / 9' : device === 'Custom' ? `${customViewportWidth} / ${customViewportHeight}` : '16 / 9'
    : ratio === 'custom' ? `${customRatioWidth} / ${customRatioHeight}` : ratio;
  const viewportDimensions = device === 'Custom' ? `${customViewportWidth} × ${customViewportHeight}` : deviceDimensions[device];
  const [ratioWidth, ratioHeight] = aspectRatio.split('/').map(Number);
  const ratioValue = ratioWidth / ratioHeight;
  const requestedWidth = device === 'Custom' ? customViewportWidth : stageSize.width * (parseFloat(deviceSizes[device]) / 100);
  const previewWidth = stageSize.width > 0 && stageSize.height > 0
    ? Math.min(requestedWidth, stageSize.width, stageSize.height * ratioValue)
    : undefined;
  const fallbackWidth = device === 'Custom' ? `min(${customViewportWidth}px, 100%)` : deviceSizes[device];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // Keep the preview's play state in step with the Autoplay setting.
  useEffect(() => { setPlaying(project.autoplay); }, [project.autoplay]);

  // ---- editing operations (shared by desktop + mobile through one API) ----
  const set = useCallback((path: string, value: unknown, coalesce?: boolean) => update((p) => setPath(p, path, value), coalesce ? path : undefined), [update]);
  const apply = useCallback((fn: (p: Project) => Project) => update(fn), [update]);
  const select = useCallback((index: number) => update((p) => (p.active === index ? p : { ...p, active: index })), [update]);
  const selectQuiet = useCallback((index: number) => patchQuiet((p) => (p.active === index ? p : { ...p, active: index })), [patchQuiet]);
  const patchSlide = useCallback((key: keyof Slide, value: string) => update((p) => ({ ...p, slides: p.slides.map((s, i) => (i === p.active ? { ...s, [key]: value } : s)) }), `slide.${key}`), [update]);

  const slides: SlideApi = useMemo(() => ({
    project, activeSlide, patchSlide, select,
    add: () => { update((p) => ({ ...p, slides: [...p.slides, freshSlide(p.slides.length)], active: p.slides.length })); setActiveTab('Slides'); },
    duplicate: () => update((p) => { const cur = p.slides[p.active]; if (!cur) return p; const copy = { ...cur, id: `slide-${Date.now()}`, name: `${cur.name} copy` }; const list = [...p.slides]; list.splice(p.active + 1, 0, copy); return { ...p, slides: list, active: p.active + 1 }; }),
    remove: () => { if (project.slides.length <= 1) { notify('A carousel needs at least one slide.'); return; } update((p) => ({ ...p, slides: p.slides.filter((_, i) => i !== p.active), active: Math.max(0, Math.min(p.active, p.slides.length - 2)) })); },
    move: (from: number, to: number) => update((p) => { if (to < 0 || to >= p.slides.length || from === to) return p; const list = [...p.slides]; const [item] = list.splice(from, 1); list.splice(to, 0, item); return { ...p, slides: list, active: to }; }),
    reset: () => update((p) => ({ ...p, slides: p.slides.map((s, i) => (i === p.active ? { ...freshSlide(i), id: s.id } : s)) })),
    upload: (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => patchSlide('image', String(reader.result)); reader.readAsDataURL(file); },
  }), [project, activeSlide, patchSlide, select, update, notify]);

  const applyPreset = useCallback((preset: Preset) => { update((p) => applyPresetTo(p, preset)); notify(`${preset.name} applied`); }, [update, notify]);
  const api: EditorApi = useMemo(() => ({ project, set, apply, slides, applyPreset, notify }), [project, set, apply, slides, applyPreset, notify]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      const target = e.target instanceof Element ? e.target : null;
      if (e.code === 'Space' && !(target && target.closest('input,textarea,select,button,[role="slider"],[role="separator"],[role="switch"]'))) { e.preventDefault(); setPlaying((v) => !v); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [undo, redo]);

  function importProject(file?: File) {
    if (!file) return; const reader = new FileReader();
    reader.onload = () => { try { const parsed = parseProject(JSON.parse(String(reader.result))); if (!parsed) throw new Error('Invalid project schema'); replace(parsed); setPlaying(parsed.autoplay); notify('Project imported'); } catch { notify('That file is not a valid MotionForge project.'); } };
    reader.readAsText(file);
  }
  const setName = useCallback((name: string) => update((p) => ({ ...p, name }), 'name'), [update]);

  const toastEl = toast ? <div className="toast-message" role="status"><Check size={14} />{toast}</div> : null;
  const exportEl = exportOpen ? <ExportModal project={project} ratio={aspectRatio} onClose={() => setExportOpen(false)} notify={notify} /> : null;

  if (vp.mode !== 'desktop') {
    const shell: Shell = { undo, redo, canUndo, canRedo, playing, setPlaying, openExport: () => setExportOpen(true), onSelect: select, onAuto: selectQuiet, ratio, setRatio, saveState, setName, viewportH: vp.h, mode: vp.mode };
    return <>
      <MobileEditor api={api} shell={shell} />
      {exportEl}{toastEl}
    </>;
  }

  return <main className={`app ${previewMode ? 'preview-only' : ''}`}>
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><span /><span /><span /></div><div><strong>MotionForge</strong><small>SLIDER STUDIO</small></div></div>
      <div className="project-title"><input aria-label="Project name" value={project.name} onChange={(e) => setName(e.target.value)} /><div className="save-indicator"><i className={saveState} />{saveState === 'saving' ? 'Saving…' : 'Saved locally'}</div></div>
      <div className="top-actions">
        <button type="button" className="icon-button" title="Undo (Ctrl+Z)" aria-label="Undo" onClick={undo} disabled={!canUndo}><ArrowLeft size={15} /><span>Undo</span></button>
        <button type="button" className="icon-button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" onClick={redo} disabled={!canRedo}><ArrowRight size={15} /><span>Redo</span></button>
        <span className="top-divider" />
        <button type="button" className={`icon-button ${previewMode ? 'on' : ''}`} onClick={() => setPreviewMode((v) => !v)} title={previewMode ? 'Return to edit mode' : 'Open preview mode'}>{previewMode ? <Settings2 size={15} /> : <Eye size={15} />}<span>{previewMode ? 'Edit' : 'Preview mode'}</span></button>
        <button type="button" className={`icon-button preview-mode ${playing ? 'on' : ''}`} onClick={() => setPlaying(!playing)} title={playing ? 'Pause preview (Space)' : 'Play preview (Space)'}>{playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}<span>{playing ? 'Pause' : 'Play'}</span></button>
        <button type="button" className="export-button" onClick={() => setExportOpen(true)}><Download size={15} /> Export</button>
      </div>
    </header>
    <div className="workspace">
      <aside className="left-panel">
        <div className="panel-heading"><span>PROJECT</span><button type="button" title="Import project JSON" aria-label="Import project JSON" className="quiet-icon" onClick={() => fileRef.current?.click()}><FolderOpen size={15} /></button><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { importProject(e.target.files?.[0]); e.target.value = ''; }} /></div>
        <div className="tab-list" role="tablist">{(['Slides', 'Layouts', 'Presets', 'Layers', 'Assets'] as Tab[]).map((tab, i) => { const Icon = [Film, LayoutGrid, Sparkles, Layers, ImageIcon][i]; return <button type="button" role="tab" aria-selected={activeTab === tab} key={tab} className={`side-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}><Icon size={15} /><span>{tab}</span>{tab === 'Slides' && <em>{String(project.slides.length).padStart(2, '0')}</em>}</button>; })}</div>
        <div className="sidebar-content">
          {activeTab === 'Slides' && <section><div className="section-row"><span>SLIDE SEQUENCE</span><button type="button" className="text-action" onClick={slides.add}><Plus size={13} /> Add</button></div><SlideList api={slides} /></section>}
          {activeTab === 'Layouts' && <section><div className="section-row"><span>LAYOUT SYSTEMS</span></div><div className="layout-list">{LAYOUT_META.map((item) => <button type="button" key={item.id} className={`layout-option ${project.layout === item.id ? 'chosen' : ''}`} onClick={() => apply((p) => setLayoutValue(p, item.id))}><span className="layout-glyph-v2"><Glyph family="layout" id={item.id} /></span><span><strong>{item.label}</strong><small>{item.descriptor}</small></span>{project.layout === item.id && <Check size={14} />}</button>)}</div></section>}
          {activeTab === 'Presets' && <PresetLibrary project={project} onApply={applyPreset} notify={notify} />}
          {activeTab === 'Layers' && <section><div className="section-row"><span>SLIDE LAYERS</span></div><ControlList controls={layersControls} project={project} onChange={set} onApply={apply} /><div className="info-note">Turn layers off to preview — or export — a leaner slide. Copy and images are edited in the inspector.</div></section>}
          {activeTab === 'Assets' && <section><div className="section-row"><span>PROJECT ASSETS</span><button type="button" className="text-action" onClick={() => uploadRef.current?.click()}><Plus size={13} /> Add</button></div><input ref={uploadRef} type="file" accept="image/*" hidden onChange={(e) => { slides.upload(e.target.files?.[0]); e.target.value = ''; }} /><button type="button" className="upload-box" onClick={() => uploadRef.current?.click()}><Upload size={18} /><strong>Upload an image</strong><span>Choose a file from your device</span></button>{project.slides.filter((s) => s.image).map((s) => <button type="button" key={s.id} className="asset-row" onClick={() => { select(project.slides.indexOf(s)); setActiveTab('Slides'); }}><img src={s.image} alt="" /><span>{s.name}</span><ChevronRight size={13} /></button>)}<div className="info-note">Uploaded image data is stored with this project in your browser. For large files, use an image URL to keep project JSON lightweight.</div></section>}
        </div>
        <div className="sidebar-bottom"><span className="status-dot" /> LOCAL PROJECT <span className="mono">v2.0</span></div>
      </aside>
      <section className="center-panel">
        <div className="canvas-toolbar">
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><b>{activeSlide?.name ?? 'Canvas'}</b><span className="canvas-tag">CANVAS</span></div>
          <div className="canvas-tools">
            <label className="device-select"><span>Viewport</span><select value={device} onChange={(e) => setDevice(e.target.value)} aria-label="Preview viewport">{Object.keys(deviceSizes).map((d) => <option key={d}>{d}</option>)}</select><ChevronDown size={12} /></label>
            <label className="device-select ratio-select"><span>Ratio</span><select value={ratio} onChange={(e) => setRatio(e.target.value)} aria-label="Preview aspect ratio"><option value="auto">Auto</option><option value="21 / 9">21:9</option><option value="16 / 9">16:9</option><option value="16 / 10">16:10</option><option value="4 / 3">4:3</option><option value="1 / 1">1:1</option><option value="custom">Custom</option></select><ChevronDown size={12} /></label>
            {device === 'Custom' && <div className="custom-viewport"><input type="number" min="320" max="3000" value={customViewportWidth} aria-label="Custom viewport width" onChange={(e) => setCustomViewportWidth(Math.max(320, Number(e.target.value) || 320))} /><span>×</span><input type="number" min="320" max="3000" value={customViewportHeight} aria-label="Custom viewport height" onChange={(e) => setCustomViewportHeight(Math.max(320, Number(e.target.value) || 320))} /></div>}
            {ratio === 'custom' && <div className="custom-viewport ratio-values"><input type="number" min="1" max="64" value={customRatioWidth} aria-label="Custom aspect ratio width" onChange={(e) => setCustomRatioWidth(Math.max(1, Number(e.target.value) || 1))} /><span>:</span><input type="number" min="1" max="64" value={customRatioHeight} aria-label="Custom aspect ratio height" onChange={(e) => setCustomRatioHeight(Math.max(1, Number(e.target.value) || 1))} /></div>}
            <span className="tool-separator" />
            <button type="button" className="tool-button" title="Fullscreen preview" aria-label="Fullscreen preview" onClick={() => { const el = document.querySelector('.canvas-frame .mf-wrap'); if (el instanceof HTMLElement && el.requestFullscreen) void el.requestFullscreen(); }}><Maximize2 size={15} /></button>
            <button type="button" className={`tool-button ${grid ? 'selected' : ''}`} title="Toggle grid" aria-label="Toggle grid" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid2X2 size={15} /></button>
            <button type="button" className={`tool-button ${safe ? 'selected' : ''}`} title="Toggle safe area" aria-label="Toggle safe area" aria-pressed={safe} onClick={() => setSafe(!safe)}><span className="safe-icon" /></button>
            <span className="tool-separator" />
            <button type="button" className="tool-button" title="Zoom out" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(1)))}><ZoomOut size={15} /></button><span className="zoom-label mono">{Math.round(zoom * 100)}%</span><button type="button" className="tool-button" title="Zoom in" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.2, +(z + 0.1).toFixed(1)))}><ZoomIn size={15} /></button>
          </div>
        </div>
        <div className="canvas-stage" ref={stageRef}>
          <div className="stage-ruler"><span>PREVIEW STAGE</span><span className="mono">{viewportDimensions} · {aspectRatio.replace(' / ', ':')}</span></div>
          <div className={`canvas-frame ${device.toLowerCase().replace(' ', '-')}`} style={{ width: previewWidth === undefined ? fallbackWidth : `${previewWidth}px`, '--zoom': zoom } as CSSProperties}>
            <Preview project={project} playing={playing} onSelect={select} onAuto={selectQuiet} onPlayState={setPlaying} device={device} zoom={zoom} grid={grid} safe={safe} ratio={aspectRatio} />
          </div>
          <div className="stage-foot"><span><b className="live-dot" /> Changes update in real time</span><span>DRAG, SWIPE OR USE ← → TO NAVIGATE</span></div>
        </div>
        <div className={`timeline ${timelineOpen ? '' : 'collapsed'}`}>
          <div className="timeline-head"><div className="timeline-title"><button type="button" aria-label={timelineOpen ? 'Collapse timeline' : 'Expand timeline'} onClick={() => setTimelineOpen(!timelineOpen)}>{timelineOpen ? <ChevronDown size={15} /> : <ArrowUp size={14} />}</button><span>TIMELINE</span><small>{project.fx.spring || project.motion === 'elastic' ? 'spring physics' : `${(project.duration / 1000).toFixed(2)}s transition`}</small></div><div className="timeline-actions"><button type="button" className="tool-button" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>{playing ? <Pause size={14} /> : <Play size={14} />}</button><button type="button" className="tool-button" onClick={() => select(0)} aria-label="Reset playhead"><RotateCcw size={14} /></button><button type="button" className="tool-button" aria-label="Timeline settings" onClick={() => notify('Timing, easing and physics live in the Motion tab of the inspector.')}><MoreHorizontal size={16} /></button></div></div>
          {timelineOpen && <div className="timeline-body"><div className="timeline-ruler"><span>00:00</span><span>00:01</span><span>00:02</span><span>00:03</span><span>00:04</span><span>00:05</span></div><div className="track-row"><div className="track-label"><Layers size={13} /><span>Slides</span></div><div className="track-content"><div className="playhead" style={{ left: `${(project.active / Math.max(1, project.slides.length - 1)) * 100}%` }} /><div className="track-blocks">{project.slides.map((s, i) => <button type="button" key={s.id} onClick={() => select(i)} className={`track-block ${i === project.active ? 'on' : ''}`}><i style={{ backgroundColor: s.accent }} />{s.name}<span>{(project.duration / 1000).toFixed(1)}s</span></button>)}</div><input type="range" min="0" max={Math.max(0, project.slides.length - 1)} value={project.active} aria-label="Timeline playhead" onChange={(e) => select(Number(e.target.value))} /></div></div><div className="timeline-foot"><span><i /> Slide transition <b>{project.layout === 'spatial' ? project.spatial.formation : project.motion}</b></span><span className="mono">{String(project.active + 1).padStart(2, '0')} / {String(project.slides.length).padStart(2, '0')}</span></div></div>}
        </div>
      </section>
      <aside className="right-panel"><Inspector api={api} /></aside>
    </div>
    {exportEl}{toastEl}
  </main>;
}
export default App;
