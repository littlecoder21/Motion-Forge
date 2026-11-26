import { useCallback, useEffect, useRef, useState } from 'react';
import { initialProject, normalizeProject, type Project } from '@/lib/model';

const STORAGE_KEY = 'carousel-motion-studio-project';
const load = (): Project => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeProject(JSON.parse(stored)) : initialProject();
  } catch { return initialProject(); }
};
type State = { project: Project; history: Project[]; future: Project[]; saving: boolean };

/**
 * Project state with undo/redo in ONE state object (no nested setState, safe under StrictMode).
 * `update(fn, key)` coalesces rapid edits that share a key (e.g. dragging one slider) into a single undo step.
 */
export function useProject(onStorageError: () => void) {
  const [state, setState] = useState<State>(() => ({ project: load(), history: [], future: [], saving: false }));
  const last = useRef<{ key: string; t: number }>({ key: '', t: 0 });

  const update = useCallback((fn: (p: Project) => Project, key?: string) => {
    const now = Date.now();
    setState((s) => {
      const next = fn(s.project);
      if (next === s.project) return s;
      const merge = !!key && last.current.key === key && now - last.current.t < 700;
      last.current = { key: key ?? '', t: now };
      return { project: next, history: merge ? s.history : [...s.history.slice(-39), s.project], future: [], saving: true };
    });
  }, []);
  /** Changes that should not create undo steps (autoplay advancing, preview-driven selection). */
  const patchQuiet = useCallback((fn: (p: Project) => Project) => setState((s) => { const next = fn(s.project); return next === s.project ? s : { ...s, project: next, saving: true }; }), []);
  const undo = useCallback(() => setState((s) => {
    if (!s.history.length) return s;
    last.current = { key: '', t: 0 };
    return { project: s.history[s.history.length - 1], history: s.history.slice(0, -1), future: [s.project, ...s.future], saving: true };
  }), []);
  const redo = useCallback(() => setState((s) => {
    if (!s.future.length) return s;
    last.current = { key: '', t: 0 };
    return { project: s.future[0], history: [...s.history, s.project], future: s.future.slice(1), saving: true };
  }), []);
  const replace = useCallback((next: Project) => setState({ project: next, history: [], future: [], saving: true }), []);

  const { project } = state;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); setState((s) => (s.saving ? { ...s, saving: false } : s)); }
      catch { setState((s) => (s.saving ? { ...s, saving: false } : s)); onStorageError(); }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [project, onStorageError]);

  return { project, update, patchQuiet, undo, redo, replace, canUndo: state.history.length > 0, canRedo: state.future.length > 0, saveState: (state.saving ? 'saving' : 'saved') as 'saved' | 'saving' };
}
