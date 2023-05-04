import { CSSObject, keyframes } from '@emotion/react';
import { Property } from 'csstype';

import { dropShadow } from './utils';

const scalePopKeyFrames = keyframes({
  'from, to': [
    {
      transform: 'scale(1)',
    },
    dropShadow(2),
  ],
  '50%': [
    {
      transform: 'scale(1.1)',
    },
    dropShadow(3),
  ],
});

export const scalePop = (
  duration = '0.5s',
  timingFunction = 'cubic-bezier(0.0, 1.01, 0.0, 1.65)',
): CSSObject => ({
  animation: `${scalePopKeyFrames} ${duration} ${timingFunction}`,
});

const fadeInKeyFrames = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

export const fadeIn = (
  duration = '0.6s',
  timingFunction = 'ease',
  delay = '0s',
): CSSObject => ({
  animation: `${fadeInKeyFrames} ${duration} ${timingFunction}`,
  animationDelay: delay,
  opacity: 1,
});

const fadeOutKeyFrames = keyframes({
  from: {
    opacity: 1,
  },
  to: {
    opacity: 0,
  },
});

export const fadeOut = (duration = '0.6s', timingFunction = 'ease'): CSSObject => ({
  animation: `${fadeOutKeyFrames} ${duration} ${timingFunction}`,
  opacity: 0,
});

const scaleTransitionKeyFrames = (initial: number, final: number) =>
  keyframes({
    from: {
      transform: `scale(${initial})`,
      background: 'green',
    },
    to: {
      transform: `scale(${final})`,
      background: 'blue',
    },
  });

export const scaleTransition = (
  duration = '0.5s',
  from = 1,
  to = 0,
  timingFunction = 'ease',
): CSSObject => ({
  animation: `${scaleTransitionKeyFrames(from, to)} ${duration} 1 ${timingFunction}`,
  transform: `scale(${to})`,
});

const waveMovementKeyFrames = (axis: 'x' | 'y' = 'x') =>
  keyframes({
    from: {
      [axis === 'x' ? 'left' : 'bottom']: 0,
    },
    to: {
      [axis === 'x' ? 'left' : 'bottom']: `100vh`,
    },
    // from: {
    //   bottom: 0,
    //   left: '50%',
    // },
    // '50%': {
    //   bottom: '50%',
    //   left: '60%',
    // },
    // to: {
    //   bottom: '100%',
    //   left: '40%',
    // },
  });

export const waveMovement = (
  duration = '2s',
  timingFunction = 'ease-in-out',
): CSSObject => ({
  animation: `${waveMovementKeyFrames()} ${duration} alternate infinite ${timingFunction}, ${waveMovementKeyFrames(
    'y',
  )} ${'3s'} alternate infinite ${timingFunction}`,
  // bottom: '100%',
  // left: '25%',
});

const displayFixerKeyFrames = (
  display: Property.Display | string[] | Property.Display[] | undefined,
) =>
  keyframes({
    from: {
      display,
    },
    to: {
      display,
    },
  });

export const displayFixer = (
  duringDisplay: Property.Display | string[] | Property.Display[] | undefined = 'block',
  afterDisplay: Property.Display | string[] | Property.Display[] | undefined = 'block',
  duration = '0.6s',
): CSSObject => ({
  animation: `${displayFixerKeyFrames(
    duringDisplay,
  )} ${duration} alternate infinite linear`,
  display: afterDisplay,
});

export const fadeInDisplay = (
  duringDisplay: Property.Display | string[] | Property.Display[] | undefined = 'block',
  afterDisplay: Property.Display | string[] | Property.Display[] | undefined = 'block',
  duration = '0.6s',
  timingFunction = 'ease',
): CSSObject[] =>
  combineAnimations(
    displayFixer(duringDisplay, afterDisplay, duration),
    fadeIn(duration, timingFunction),
  );

export const fadeOutDisplay = (
  duringDisplay: Property.Display | string[] | Property.Display[] | undefined = 'block',
  afterDisplay: Property.Display | string[] | Property.Display[] | undefined = 'block',
  duration = '0.6s',
  timingFunction = 'ease',
): CSSObject[] =>
  combineAnimations(
    displayFixer(duringDisplay, afterDisplay, duration),
    fadeOut(duration, timingFunction),
  );
export const combineAnimations = (...animations: CSSObject[]): CSSObject[] => [
  ...animations,
  {
    animation: animations.map((animation) => animation.animation).join(', '),
  },
];
