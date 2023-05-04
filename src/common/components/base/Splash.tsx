import { absolute, flexCenter, fullSize, gradients } from '@/common/styles';

export interface SplashProps {
  children?: React.ReactNode;
}

export function Splash(
  props: SplashProps &
    React.ClassAttributes<HTMLDivElement> &
    React.HTMLAttributes<HTMLDivElement>,
) {
  const { children, ...rest } = props;

  return (
    <div
      css={[{ background: gradients.default }, absolute(), fullSize, flexCenter]}
      {...rest}
    >
      {children}
    </div>
  );
}
