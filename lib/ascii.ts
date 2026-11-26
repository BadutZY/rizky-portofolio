/** Small helpers shared by the two ASCII canvases (footer name + hero background). */

/** Fast deterministic hash -> 0..1. Gives every cell a stable "random" value without storing anything. */
export function hash(n: number): number {
  n = (n ^ 61) ^ (n >>> 16);
  n = (n + (n << 3)) | 0;
  n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967296;
}

/** Symbols a cell flickers through while the pointer is on it. Code-flavoured, but still tidy. */
export const SCRAMBLE = "01<>/\\{}[]()#$%&*+=~^?!;:";

export const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace';

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

export type Ripple = { x: number; y: number; t0: number };
