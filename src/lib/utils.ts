import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Immutable dotted-path helpers: the schema binds every control to a path like "fx.intensity". */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const o = (obj ?? {}) as Record<string, unknown>;
  if (!rest.length) return { ...o, [head]: value } as T;
  return { ...o, [head]: setPath(o[head] ?? {}, rest.join('.'), value) } as T;
}
export const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
