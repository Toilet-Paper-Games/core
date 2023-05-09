import * as PKG from '@justinfernald/tp-games-lib'; // This is the package itself
import { assert, expect, test } from 'vitest';

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

test('Math.sqrt()', () => {
  expect(Math.sqrt(4)).toBe(2);
  expect(Math.sqrt(144)).toBe(12);
  expect(Math.sqrt(2)).toBe(Math.SQRT2);
});

test('JSON', () => {
  const input = {
    foo: 'hello',
    bar: 'world',
  };

  const output = JSON.stringify(input);

  expect(output).eq('{"foo":"hello","bar":"world"}');
  assert.deepEqual(JSON.parse(output), input, 'matches original');
});
