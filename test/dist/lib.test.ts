import * as PKG from '@justinfernald/tp-games-lib'; // This is the package itself
import { expect, test } from 'vitest';

import * as SRC from '@/index'; // This is the package itself

// Test that the outputs from the package is the same as the source
test('PACKAGE', () => {
  test('clamp()', () => {
    expect(PKG.clamp(0, 0, 0)).toBe(SRC.clamp(0, 0, 0));
  });

  test('deg_to_rad', () => {
    expect(PKG.DEG_TO_RAD).toBe(SRC.DEG_TO_RAD);
  });
});
