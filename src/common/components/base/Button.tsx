import { Interpolation, Theme } from '@emotion/react';

import { colors } from '@/common/styles/theme';
import {
  borderRadius,
  dropShadow,
  flexCenter,
  paddingHorizontal,
  paddingVertical,
} from '@/common/styles/utils';

export interface ButtonProps {
  children: React.ReactNode;
  secondary?: boolean;
  css?: Interpolation<Theme>;
}

export function Button(
  props: ButtonProps &
    React.DetailedHTMLProps<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
) {
  const { children, secondary, css, ...rest } = props;

  return (
    <button
      css={[
        {
          background: secondary ? colors.secondary : colors.primary, //colors.primary,
          color: colors.textSecondary,
          fontFamily: 'LuloClean',
          border: 'none',
          cursor: 'pointer',
          '&:enabled:active': {
            filter: 'brightness(110%)',
          },
          '&:disabled': {
            opacity: 0.5,
            cursor: 'default',
          },
        },
        borderRadius('xl'),
        paddingHorizontal('md'),
        paddingVertical('sm'),
        dropShadow(2),
        flexCenter,
        css,
      ]}
      {...rest}
    >
      <div>{children}</div>
    </button>
  );
}
