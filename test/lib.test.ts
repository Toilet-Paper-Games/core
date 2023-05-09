import * as A from '@justinfernald/tp-games-lib'; // This is the package itself
import { assert, expect, test } from 'vitest';

import { DAY_AS_MS } from '../src/index';

// Edit an assertion and save to see HMR in action
test('dist', () => {
  expect(DAY_AS_MS).toBe(86400000);
  console.log(A);
  expect(A.DEG_TO_RAD).toBe(0.017453292519943295);
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
