import { Interpolation, Theme } from '@emotion/react';

import { colors } from '@/common/styles/theme';
import {
  border,
  borderRadius,
  dropShadow,
  paddingHorizontal,
  paddingVertical,
} from '@/common/styles/utils';

export interface InputProps {
  css?: Interpolation<Theme>;
  onInput?: (input: string) => void;
}

export function Input(
  props: InputProps &
    Omit<
      React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
      >,
      'onInput'
    >,
) {
  const { css, onInput, onChange, ...rest } = props;

  return (
    <input
      css={[
        {
          background: colors.component,
          color: colors.text,
          fontFamily: 'GT Walsheim Pro',
          '&:focus': {
            outline: 'none',
            borderColor: colors.borderFocused,
            filter: 'brightness(110%)',
          },
        },
        border(colors.border),
        borderRadius('md'),
        paddingHorizontal('md'),
        paddingVertical('sm'),
        dropShadow(2),
        css,
      ]}
      onChange={(e) => {
        onChange?.(e);
        if (onInput) onInput(e.target.value);
      }}
      {...rest}
    />
  );
}
