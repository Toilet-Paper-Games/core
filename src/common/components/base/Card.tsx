import { Interpolation, Theme } from '@emotion/react';

import { colors } from '@/common/styles/theme';
import { borderRadius, dropShadow, padding } from '@/common/styles/utils';

export interface CardProps {
  children: React.ReactNode;
  css?: Interpolation<Theme>;
}

export function Card(
  props: CardProps &
    React.ClassAttributes<HTMLDivElement> &
    React.HTMLAttributes<HTMLDivElement>,
) {
  const { children, css, ...rest } = props;

  return (
    <div
      css={[
        {
          backgroundColor: colors.transparent,
          color: colors.text,
          backdropFilter: 'blur(5px)',
        },
        borderRadius('md'),
        padding('lg'),
        dropShadow(2),
        css,
      ]}
      {...rest}
    >
      {children}
    </div>
  );
}
