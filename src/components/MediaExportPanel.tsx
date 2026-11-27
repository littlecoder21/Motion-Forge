import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Film, Image as ImageIcon, LoaderCircle, X } from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { applyPalette, GIFEncoder, quantize, type Palette } from 'gifenc';
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, WebMOutputFormat, getFirstEncodableVideoCodec } from 'mediabunny';
import { createCarousel } from '@/lib/runtime';
import { RUNTIME_CSS } from '@/lib/runtime-css';
import type { Project } from '@/lib/model';

type Props = { kind: 'image' | 'video'; project: Project; ratio: string; notify: (message: string) => void };
type ImageFormat = 'png' | 'jpeg' | 'webp';
type VideoFormat = 'mp4' | 'webm' | 'gif';
type ExportedFile = { name: string; url: string; size: number };

const RESOLUTIONS = [
  { value: 720, label: 'HD · 720p' },
  { value: 1080, label: 'Full HD · 1080p' },
  { value: 2160, label: 'Ultra HD · 4K' },
];

function dimensions(longEdge: number, aspect: number) {
  return aspect >= 1
    ? { width: longEdge, height: Math.max(1, Math.round(longEdge / aspect)) }
    : { width: Math.max(1, Math.round(longEdge * aspect)), height: longEdge };
}

function visibleCarouselRoot(): HTMLElement {
  const root = [...document.querySelectorAll<HTMLElement>('.mf-root')]
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    })
    .sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
  if (!root) throw new Error('The live carousel preview is not visible. Close the export panel and try again.');
  return root;
}

function safeFileName(name: string) {
  return name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, '-').slice(0, 80) || 'carousel';
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('The browser could not encode this image format.'));
      else if (blob.type !== type) reject(new Error(`This browser did not produce the requested ${type} image.`));
      else resolve(blob);
    }, type, quality);
  });
}

function imageCanvas(root: HTMLElement, width: number, height: number) {
  return toCanvas(root, {
    width, height, canvasWidth: width, canvasHeight: height, pixelRatio: 1,
    backgroundColor: '#101317', skipFonts: true,
    style: { width: `${width}px`, height: `${height}px`, minHeight: '0', maxWidth: 'none', maxHeight: 'none' },
  });
}

function MediaPreview({ project, ratio, secondsPerSlide, onReady }: { project: Project; ratio: string; secondsPerSlide: number; onReady: (api: ReturnType<typeof createCarousel> | null, root: HTMLDivElement | null) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const slideDuration = secondsPerSlide * 1000;
  const transitionDuration = Math.min(project.duration, Math.max(60, Math.round(slideDuration * 0.8)));
  const videoProject = useMemo<Project>(() => ({
    ...project,
    active: 0,
    autoplay: true,
    duration: transitionDuration,
    interval: slideDuration - transitionDuration,
    loop: false,
    seamlessLoop: false,
    responsive: { ...project.responsive, on: false },
    nav: { ...project.nav, pauseOnHover: false },
    spatial: { ...project.spatial, autoRotate: false, pauseHover: false, mouseTilt: 0, mouseDepth: 0 },
  }), [project, slideDuration, transitionDuration]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let style = document.getElementById('mf-runtime-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'mf-runtime-css';
      style.textContent = RUNTIME_CSS;
      document.head.appendChild(style);
    }
    const api = createCarousel(root, videoProject, { forceMotion: true });
    api.setPlaying(false);
    onReady(api, root);
    return () => {
      api.destroy();
      onReady(null, null);
    };
  }, [onReady, videoProject]);

  const ratioParts = ratio.split('/').map((part) => Number(part.trim()));
  const aspectRatio = ratioParts.length === 2 && ratioParts.every((part) => Number.isFinite(part) && part > 0)
    ? `${ratioParts[0]} / ${ratioParts[1]}`
    : '16 / 9';
  const aspect = ratioParts.length === 2 && ratioParts[1] > 0 ? ratioParts[0] / ratioParts[1] : 16 / 9;
  return <div className="media-preview-shell" style={{ aspectRatio, width: `min(560px, ${300 * aspect}px)` }}>
    <div ref={rootRef} className="media-preview-stage" />
  </div>;
}

export function MediaExportPanel({ kind, project, ratio, notify }: Props) {
  const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('webm');
  const [resolution, setResolution] = useState(720);
  const [fps, setFps] = useState(12);
  const [secondsPerSlide, setSecondsPerSlide] = useState(2);
  const [quality, setQuality] = useState(92);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExportedFile | null>(null);
  const [videoApi, setVideoApi] = useState<ReturnType<typeof createCarousel> | null>(null);
  const [videoRoot, setVideoRoot] = useState<HTMLDivElement | null>(null);
  const cancelRef = useRef(false);
  const resultUrlRef = useRef<string | null>(null);
  const fileBase = safeFileName(project.name);
  const setVideoPreview = useCallback((api: ReturnType<typeof createCarousel> | null, root: HTMLDivElement | null) => {
    setVideoApi(api);
    setVideoRoot(root);
  }, []);

  useEffect(() => () => {
    cancelRef.current = true;
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  function prepareDownload(name: string, blob: Blob) {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    const url = URL.createObjectURL(blob);
    resultUrlRef.current = url;
    setResult({ name, url, size: blob.size });
  }

  async function exportImage() {
    setBusy(true);
    setError('');
    setProgress('Rendering current preview…');
    try {
      const root = visibleCarouselRoot();
      const rect = root.getBoundingClientRect();
      const size = dimensions(resolution, rect.width / rect.height);
      const canvas = await imageCanvas(root, size.width, size.height);
      const mime = imageFormat === 'jpeg' ? 'image/jpeg' : `image/${imageFormat}`;
      const blob = await canvasBlob(canvas, mime, imageFormat === 'png' ? undefined : quality / 100);
      const extension = imageFormat === 'jpeg' ? 'jpg' : imageFormat;
      prepareDownload(`${fileBase}-preview.${extension}`, blob);
      notify(`${imageFormat.toUpperCase()} image exported`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      notify(`Image export failed: ${message}`);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  async function exportVideo() {
    setBusy(true);
    setError('');
    cancelRef.current = false;
    setProgress('Preparing full-pass capture…');
    let mediaOutput: Output | null = null;
    let videoSource: CanvasSource | null = null;
    const previousPointerEvents = videoRoot?.style.pointerEvents ?? '';
    try {
      if (!videoApi || !videoRoot) throw new Error('The video preview is still loading.');
      const rect = videoRoot.getBoundingClientRect();
      const aspect = rect.width / rect.height;
      const size = dimensions(resolution, aspect);
      const durationMs = project.slides.length * secondsPerSlide * 1000;
      const frameDelay = 1000 / fps;
      const frameCount = Math.ceil(durationMs / frameDelay);
      const output = document.createElement('canvas');
      output.width = size.width;
      output.height = size.height;
      const context = output.getContext('2d', { alpha: false, willReadFrequently: videoFormat === 'gif' });
      if (!context) throw new Error('Canvas capture is unavailable in this browser.');

      videoApi.setPlaying(false);
      videoApi.goTo(0, true);
      await new Promise((resolve) => window.setTimeout(resolve, project.duration + 100));
      videoRoot.style.pointerEvents = 'none';

      if (videoFormat !== 'gif') {
        const format = videoFormat === 'mp4'
          ? new Mp4OutputFormat({ fastStart: 'in-memory' })
          : new WebMOutputFormat();
        const bitrate = resolution >= 2160 ? 16000000 : resolution >= 1080 ? 8000000 : 4000000;
        const encodingQuality = new Quality({ bitrate });
        const supportedCodecs = format.getSupportedVideoCodecs();
        const candidateCodecs = videoFormat === 'webm'
          ? supportedCodecs.filter((candidate) => candidate === 'vp8' || candidate === 'vp9').reverse()
          : supportedCodecs.filter((candidate) => candidate === 'avc');
        const codec = await getFirstEncodableVideoCodec(candidateCodecs, {
          width: size.width,
          height: size.height,
          frameRate: fps,
          quality: encodingQuality,
        });
        if (!codec) throw new Error(`${videoFormat.toUpperCase()} video encoding is not supported by this browser.`);
        const target = new BufferTarget();
        mediaOutput = new Output({ format, target });
        videoSource = new CanvasSource(output, { codec, quality: encodingQuality });
        mediaOutput.addVideoTrack(videoSource, { frameRate: fps });
        await mediaOutput.start();
      }

      const gif = videoFormat === 'gif' ? GIFEncoder() : null;
      let palette: Palette | undefined;
      const captureStart = performance.now();
      let activeSlide = videoApi.getIndex();
      for (let frame = 0; frame < frameCount; frame++) {
        if (cancelRef.current) throw new Error('Video export cancelled.');
        const slideAtFrame = Math.min(project.slides.length - 1, Math.floor((frame * frameDelay) / (secondsPerSlide * 1000)));
        if (slideAtFrame !== activeSlide) {
          videoApi.goTo(slideAtFrame, true);
          activeSlide = slideAtFrame;
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }
        const snapshot = await imageCanvas(videoRoot, size.width, size.height);
        context.drawImage(snapshot, 0, 0, size.width, size.height);
        if (videoSource) await videoSource.add(frame / fps, 1 / fps);
        if (gif) {
          const pixels = context.getImageData(0, 0, size.width, size.height).data;
          palette ??= quantize(pixels, 256);
          const indexed = applyPalette(pixels, palette);
          gif.writeFrame(indexed, size.width, size.height, {
            palette,
            delay: Math.round(frameDelay),
            ...(frame === 0 ? { repeat: 0 } : {}),
          });
        }
        if (frame % Math.max(1, Math.floor(fps / 2)) === 0 || frame === frameCount - 1) {
          setProgress(`Capturing full pass… ${Math.round(((frame + 1) / frameCount) * 100)}%`);
        }
        const nextFrameAt = captureStart + (frame + 1) * frameDelay;
        const wait = nextFrameAt - performance.now();
        if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
      }

      let blob: Blob;
      if (gif) {
        gif.finish();
        const gifBytes = gif.bytes();
        const gifBuffer = new ArrayBuffer(gifBytes.byteLength);
        new Uint8Array(gifBuffer).set(gifBytes);
        blob = new Blob([gifBuffer], { type: 'image/gif' });
      } else {
        setProgress('Finalizing video…');
        videoSource!.close();
        await mediaOutput!.finalize();
        const target = mediaOutput!.target as BufferTarget;
        const videoBuffer = target.buffer;
        if (!videoBuffer?.byteLength) throw new Error('The video encoder returned an empty file.');
        blob = new Blob([videoBuffer], { type: videoFormat === 'mp4' ? 'video/mp4' : 'video/webm' });
      }
      const extension = videoFormat === 'mp4' ? 'mp4' : videoFormat;
      prepareDownload(`${fileBase}-full-pass.${extension}`, blob);
      notify(`${videoFormat.toUpperCase()} video exported`);
    } catch (reason) {
      if (mediaOutput && (mediaOutput.state === 'pending' || mediaOutput.state === 'started')) {
        videoSource?.close();
        await mediaOutput.cancel();
      }
      const message = reason instanceof Error ? reason.message : String(reason);
      setError(message);
      if (message !== 'Video export cancelled.') notify(`Video export failed: ${message}`);
    } finally {
      videoApi?.setPlaying(false);
      if (videoRoot) videoRoot.style.pointerEvents = previousPointerEvents;
      setBusy(false);
      setProgress('');
    }
  }

  return <div className="media-export-content">
    {kind === 'image' ? <>
      <div className="media-panel-heading"><ImageIcon size={16} /><div><strong>Current preview image</strong><small>Capture the visible carousel frame with its current styling and effects.</small></div></div>
      <div className="media-settings-grid">
        <label className="media-field"><span>Image format</span><select value={imageFormat} onChange={(event) => setImageFormat(event.target.value as ImageFormat)}><option value="png">PNG · lossless</option><option value="jpeg">JPEG · smaller file</option><option value="webp">WebP · modern</option></select></label>
        <label className="media-field"><span>Resolution</span><select value={resolution} onChange={(event) => setResolution(Number(event.target.value))}>{RESOLUTIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        {imageFormat !== 'png' && <label className="media-field media-field-range"><span>Quality <b>{quality}%</b></span><input aria-label="Image quality" type="range" min="60" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label>}
      </div>
      <button type="button" className="media-export-button" disabled={busy} onClick={() => void exportImage()}><Download size={15} /> Render current frame</button>
    </> : <>
      <div className="media-panel-heading"><Film size={16} /><div><strong>Full-pass video</strong><small>Starts at slide 1, plays through each slide once, and records the configured carousel motion.</small></div></div>
      <MediaPreview project={project} ratio={ratio} secondsPerSlide={secondsPerSlide} onReady={setVideoPreview} />
      <div className="media-settings-grid">
        <label className="media-field"><span>Video format</span><select value={videoFormat} onChange={(event) => setVideoFormat(event.target.value as VideoFormat)}><option value="mp4">MP4 · H.264</option><option value="webm">WebM · VP8 / VP9</option><option value="gif">GIF · looping</option></select></label>
        <label className="media-field"><span>Resolution</span><select value={resolution} onChange={(event) => setResolution(Number(event.target.value))}>{RESOLUTIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label className="media-field"><span>Frame rate</span><select value={fps} onChange={(event) => setFps(Number(event.target.value))}><option value="6">6 fps · compact</option><option value="12">12 fps · smaller</option><option value="24">24 fps · smooth</option><option value="30">30 fps · high motion</option></select></label>
        <label className="media-field"><span>Seconds per slide</span><select value={secondsPerSlide} onChange={(event) => setSecondsPerSlide(Number(event.target.value))}><option value="1">1 second</option><option value="1.5">1.5 seconds</option><option value="2">2 seconds</option><option value="3">3 seconds</option><option value="4">4 seconds</option></select></label>
      </div>
      <p className="media-export-note">Estimated duration: {(project.slides.length * secondsPerSlide).toFixed(1)} seconds · GIF loops when played. Export runs locally in this browser.</p>
      <button type="button" className="media-export-button" disabled={busy || !videoApi} onClick={() => void exportVideo()}>
        {busy ? <LoaderCircle size={15} className="media-spinner" /> : <Download size={15} />}
        {busy ? 'Rendering video…' : `Export ${videoFormat.toUpperCase()}`}
      </button>
      {busy && <button type="button" className="media-cancel-button" onClick={() => { cancelRef.current = true; setProgress('Cancelling…'); }}><X size={13} /> Cancel export</button>}
    </>}
    {result && <p className="media-ready" role="status"><a href={result.url} download={result.name}><Download size={14} /> Download {result.name}</a><span>{(result.size / 1024 / 1024).toFixed(2)} MB</span></p>}
    {progress && <p className="media-progress" role="status">{progress}</p>}
    {error && <p className="media-error" role="alert">{error}</p>}
  </div>;
}
