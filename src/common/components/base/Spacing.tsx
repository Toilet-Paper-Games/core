export interface SpacingProps {
  mainAxis?: number | string;
  crossAxis?: number | string;
  direction?: 'row' | 'column';
}

export function Spacing(props: SpacingProps) {
  const { mainAxis = 15, crossAxis = 0, direction = 'column' } = props;

  return (
    <div
      css={{
        width: direction === 'column' ? crossAxis : mainAxis,
        height: direction === 'column' ? mainAxis : crossAxis,
      }}
    />
  );
}
