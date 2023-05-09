import { expect, test } from 'vitest';

import { clamp, DEG_TO_RAD } from '@/index'; // This is the package itself

// Edit an assertion and save to see HMR in action
test('clamp()', () => {
  expect(clamp(0, 0, 0)).toBe(0);
});

test('deg_to_rad', () => {
  console.log("HIIII")
  expect(DEG_TO_RAD).toBe(0.017453292519943295);
  // purposefully fail
  expect(DEG_TO_RAD).toBe(0);
});
