import type { Project } from '@/lib/model';
import type { Preset } from '@/lib/presets';
import type { SlideApi } from './SlideEditor';

/** Everything an editing surface (desktop inspector or mobile sheet) needs, in one object. */
export type EditorApi = {
  project: Project;
  /** Set a value by dotted path. `coalesce` merges rapid edits (slider drags) into one undo step. */
  set: (path: string, value: unknown, coalesce?: boolean) => void;
  apply: (fn: (p: Project) => Project) => void;
  slides: SlideApi;
  applyPreset: (preset: Preset) => void;
  notify: (text: string) => void;
};
