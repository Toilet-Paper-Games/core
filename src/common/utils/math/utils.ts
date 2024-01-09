export const RAD_TO_DEG = 180 / Math.PI;
export const DEG_TO_RAD = Math.PI / 180;

const p = shuffle(Array.from({ length: 256 }, (_, i) => i));

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * Generates perlin noise at a given point ranging from -1 to 1.
 * @param x
 * @param y
 * @returns
 */
export function perlinNoise(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);

  const u = fade(x);
  const v = fade(y);

  const A = p[X] + Y;
  const B = p[X + 1] + Y;

  return lerp(
    lerp(grad(p[A], x, y), grad(p[B], x - 1, y), u),
    lerp(grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1), u),
    v,
  );
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('perlinNoise', () => {
    expect(perlinNoise(0, 0)).toBeGreaterThanOrEqual(-1);
    expect(perlinNoise(0, 0)).toBeLessThanOrEqual(1);
  });
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param value
 * @param min minimum value
 * @param max maximum value
 * @returns
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('clamp', () => {
    expect(clamp(0, 0, 0)).toBe(0);
    expect(clamp(1, 0, 0)).toBe(0);
    expect(clamp(0, 1, 1)).toBe(1);
    expect(clamp(1, 1, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
}

/**
 * Linearly interpolates between two numbers.
 * @param a
 * @param b
 * @param t value between 0 and 1
 * @returns
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('lerp', () => {
    expect(lerp(0, 0, 0)).toBe(0);
    expect(lerp(0, 0, 1)).toBe(0);
    expect(lerp(0, 1, 0)).toBe(0);
    expect(lerp(0, 1, 1)).toBe(1);
    expect(lerp(0, 1, 0.5)).toBe(0.5);
    expect(lerp(1, 2, 0.5)).toBe(1.5);
  });
}

/**
 * Linearly interpolates between two angles in degrees.
 * @param a degrees
 * @param b degrees
 * @param t value between 0 and 1
 * @returns degrees
 */
export function lerpAngle(a: number, b: number, t: number): number {
  return a + angleDifference(b, a) * t;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('lerpAngle', () => {
    expect(lerpAngle(0, 0, 0)).toBe(0);
    expect(lerpAngle(0, 0, 1)).toBe(0);
    expect(lerpAngle(0, 90, 0)).toBe(0);
    expect(lerpAngle(0, 90, 1)).toBe(-90);
    expect(lerpAngle(0, 90, 0.5)).toBe(-45);
    expect(lerpAngle(0, 270, 0.5)).toBe(-135);
  });
}

/**
 * Returns the difference between two angles in degrees.
 * @param a degrees
 * @param b degrees
 * @returns degrees
 */
export function angleDifference(a: number, b: number): number {
  const diff = b - a;
  return ((diff + 180) % 360) - 180;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('angleDifference', () => {
    expect(angleDifference(0, 0)).toBe(0);
    expect(angleDifference(0, 90)).toBe(90);
    expect(angleDifference(0, 180)).toBe(-180);
    expect(angleDifference(0, 270)).toBe(-90);
    expect(angleDifference(0, 360)).toBe(0);
    expect(angleDifference(0, 450)).toBe(90);
    expect(angleDifference(0, 540)).toBe(-180);
  });
}

/**
 * Generates a random number between the specified minimum and maximum values.
 * @param min The minimum value of the range.
 * @param max The maximum value of the range.
 * @returns A random number between the minimum and maximum values.
 */
export function random(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('random', () => {
    expect(random(0, 0)).toBe(0);
    expect(random(0, 1)).toBeGreaterThanOrEqual(0);
    expect(random(0, 1)).toBeLessThanOrEqual(1);
  });
}

/**
 * Generates a random integer between the specified minimum and maximum values.
 * @param min The minimum value of the range (inclusive).
 * @param max The maximum value of the range (inclusive).
 * @returns A random integer between the minimum and maximum values.
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max));
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('randomInt', () => {
    expect(randomInt(0, 0)).toBe(0);
    expect(randomInt(0, 1)).toBeGreaterThanOrEqual(0);
    expect(randomInt(0, 1)).toBeLessThanOrEqual(1);
    expect(randomInt(0, 1)).toBe(Math.floor(random(0, 1)));
  });
}

/**
 * Returns a random element from the given array.
 * @param array - The array to choose from.
 * @returns The randomly chosen element.
 * @template T - The type of elements in the array.
 */
export function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length)];
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('randomChoice', () => {
    expect(randomChoice([0])).toBe(0);
    expect(randomChoice([0, 1])).toBeGreaterThanOrEqual(0);
    expect(randomChoice([0, 1])).toBeLessThanOrEqual(1);
  });
}

/**
 * Generates a random boolean value.
 * @returns {boolean} The randomly generated boolean value.
 */
export function randomBool(): boolean {
  return Math.random() < 0.5;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('randomBool', () => {
    expect(randomBool()).is.a('boolean');
  });
}

/**
 * Generates a random sign, either 1 or -1.
 * 
 * @returns The randomly generated sign.
 */
export function randomSign(): number {
  return randomBool() ? 1 : -1;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('randomSign', () => {
    expect(randomSign()).toBeGreaterThanOrEqual(-1);
    expect(randomSign()).toBeLessThanOrEqual(1);
  });
}

/**
 * Shuffles the elements of an array in place.
 * @param array - The array to shuffle.
 * @returns The shuffled array.
 */
export function shuffle<T>(array: T[]): T[] {
  const result = array.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('shuffle', () => {
    expect(shuffle([0])).toEqual([0]);
    expect(shuffle([0, 1])).toContain(0);
    expect(shuffle([0, 1])).toContain(1);
  });
}

/**
 * Shuffles an array in place.
 * 
 * @template T The type of elements in the array.
 * @param {T[]} array The array to be shuffled.
 * @returns {T[]} The shuffled array.
 */
export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('shuffleInPlace', () => {
    expect(shuffleInPlace([0])).toEqual([0]);
    expect(shuffleInPlace([0, 1])).toContain(0);
    expect(shuffleInPlace([0, 1])).toContain(1);
  });
}
