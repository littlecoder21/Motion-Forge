import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileJson, Film, FolderOpen, Image as ImageIcon, LayoutGrid, Settings2, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import JSZip from 'jszip';
import type { Project } from '@/lib/model';
import { cssExport, exportCode, EXPORT_FILES, htmlExport, jsExport, projectJson, reactExport, readmeExport, runtimeFile, type ExportKind } from '@/lib/exporters';
import { MediaExportPanel } from './MediaExportPanel';

const TABS: { id: ExportKind; icon: typeof Sparkles; tag?: string }[] = [
  { id: 'React', icon: Sparkles, tag: 'TSX' }, { id: 'Runtime', icon: Settings2, tag: 'ENGINE' }, { id: 'JS', icon: LayoutGrid, tag: 'EMBED' },
  { id: 'HTML', icon: LayoutGrid }, { id: 'CSS', icon: SlidersHorizontal }, { id: 'JSON', icon: FileJson },
];
function downloadBlob(name: string, blob: Blob) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }

export function ExportModal({ project, ratio, onClose, notify }: { project: Project; ratio: string; onClose: () => void; notify: (t: string) => void }) {
  const [panel, setPanel] = useState<'code' | 'image' | 'video'>('code');
  const [kind, setKind] = useState<ExportKind>('React');
  const opts = useMemo(() => ({ ratio }), [ratio]);
  const code = useMemo(() => exportCode(kind, project, opts), [kind, project, opts]);
  const meta = EXPORT_FILES[kind];
  const copy = async () => { try { await navigator.clipboard.writeText(code); notify('Code copied to clipboard'); } catch { notify('Clipboard access unavailable. Download the file instead.'); } };

  async function bundle() {
    const zip = new JSZip();
    const bundled = JSON.parse(JSON.stringify(project)) as Project;
    const assets = zip.folder('assets');
    bundled.slides = bundled.slides.map((slide, index) => {
      const m = slide.image.match(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,(.+)$/);
      if (!m || !assets) return slide;
      const ext = m[1] === 'jpeg' ? 'jpg' : m[1] === 'svg+xml' ? 'svg' : m[1];
      const name = `slide-${String(index + 1).padStart(2, '0')}.${ext}`;
      assets.file(name, m[2], { base64: true });
      return { ...slide, image: `./assets/${name}` };
    });
    zip.file('Carousel.tsx', reactExport(bundled, opts));
    zip.file('carousel-runtime.ts', runtimeFile());
    zip.file('carousel.css', cssExport(bundled, opts));
    zip.file('carousel.html', htmlExport(bundled, opts));
    zip.file('carousel.js', jsExport(bundled, opts));
    zip.file('carousel-project.json', projectJson(bundled));
    zip.file('README.md', readmeExport(project));
    downloadBlob('carousel-motion-studio.zip', await zip.generateAsync({ type: 'blob' }));
    notify('Project bundle downloaded');
  }

  return <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="export-modal" role="dialog" aria-modal="true" aria-label="Export project">
      <div className="modal-heading"><div><span className="modal-kicker">TAKE IT TO THE WEB</span><h2>Export your carousel</h2><p>Capture images and video locally, or export the same motion engine as the live preview.</p></div><button type="button" className="quiet-icon" onClick={onClose} aria-label="Close export"><X size={18} /></button></div>
      <div className="export-mode-tabs" role="tablist" aria-label="Export type">
        <button type="button" role="tab" aria-selected={panel === 'code'} className={panel === 'code' ? 'active' : ''} onClick={() => setPanel('code')}><LayoutGrid size={15} /> Code</button>
        <button type="button" role="tab" aria-selected={panel === 'image'} className={panel === 'image' ? 'active' : ''} onClick={() => setPanel('image')}><ImageIcon size={15} /> Image</button>
        <button type="button" role="tab" aria-selected={panel === 'video'} className={panel === 'video' ? 'active' : ''} onClick={() => setPanel('video')}><Film size={15} /> Video</button>
      </div>
      {panel === 'code' ? <>
        <div className="export-tabs" role="tablist" aria-label="Code format">{TABS.map(({ id, icon: Icon, tag }) => <button type="button" role="tab" aria-selected={kind === id} key={id} className={kind === id ? 'active' : ''} onClick={() => setKind(id)}><Icon size={15} />{id}{tag ? <small>{tag}</small> : null}</button>)}</div>
        <div className="code-toolbar"><span><i /> {meta.file} · {meta.label}</span><button type="button" onClick={copy}><Copy size={14} /> Copy code</button></div>
        <pre className="code-preview"><code>{code}</code></pre>
        <div className="export-bottom"><span><Check size={14} /> Preview and export share one engine</span>
          <div className="export-actions"><button type="button" className="zip-button" onClick={bundle}><FolderOpen size={14} /> Download ZIP</button>
            <button type="button" className="export-button" onClick={() => { downloadBlob(meta.file, new Blob([code], { type: meta.mime })); notify('Export downloaded'); }}><Download size={15} /> Download {kind}</button></div></div>
      </> : <MediaExportPanel key={panel} kind={panel} project={project} ratio={ratio} notify={notify} />}
    </section>
  </div>;
}
