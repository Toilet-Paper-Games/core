import { css, Interpolation, Theme } from '@emotion/react';
import { CSSInterpolation } from '@emotion/serialize/types';

export interface CubeProps {
  size: number;
  matrix?: number[] | null;
  cssProp?: Interpolation<Theme>;
  faceCss?: CSSInterpolation;
}

export const Cube = (props: CubeProps) => {
  const { size, matrix, cssProp, faceCss } = props;

  const faceStyling = css([
    {
      width: size,
      height: size,
      background: 'skyblue',
      border: '2px solid black',
      opacity: 0.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '2rem',
      position: 'absolute',
    },
    faceCss,
  ]);

  return (
    <div
      css={[
        {
          width: size,
          height: size,
          perspective: 500,
        },
        cssProp,
      ]}
    >
      <div
        css={[
          {
            position: 'relative',
            width: size,
            height: size,
            transformStyle: 'preserve-3d',
          },
          matrix && {
            transform: `matrix3d(${matrix})`,
          },
        ]}
      >
        <div
          css={[
            faceStyling,
            {
              transform: `translateY(-${size / 2}px) rotateX(90deg)`,
            },
          ]}
        >
          Top
        </div>
        <div
          css={[faceStyling, { transform: `translateY(${size / 2}px) rotateX(-90deg)` }]}
        >
          Bottom
        </div>
        <div
          css={[faceStyling, { transform: `translateX(-${size / 2}px) rotateY(-90deg)` }]}
        >
          Left
        </div>
        <div
          css={[
            faceStyling,
            {
              transform: `translateX(${size / 2}px) rotateY(90deg)`,
            },
          ]}
        >
          Right
        </div>
        <div
          css={[
            faceStyling,
            {
              transform: `translateZ(${size / 2}px)`,
            },
          ]}
        >
          Front
        </div>
        <div
          css={[faceStyling, { transform: `translateZ(-${size / 2}px) rotateY(180deg)` }]}
        >
          Back
        </div>
      </div>
    </div>
  );
};
