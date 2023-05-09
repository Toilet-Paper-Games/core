import {
  combineAnimations,
  scaleTransition,
  waveMovement,
} from '@/common/styles/animation';
import { absolute } from '@/common/styles/utils';

export interface ReactionProps {
  h: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Reaction(props: ReactionProps) {
  return (
    <div
      css={[
        {
          width: 50,
          height: 50,
          background: 'red',
        },
        absolute(),
        combineAnimations(
          //   fadeOut('4s'),
          scaleTransition('1.7s', 1, 0.5, 'ease-out'),
          waveMovement(),
        ),
        // waveMovement(),
      ]}
    />
  );
}
