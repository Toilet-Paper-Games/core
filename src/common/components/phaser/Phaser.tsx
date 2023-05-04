import { observer } from 'mobx-react-lite';
import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

export interface PhaserGameProps {
  config: Phaser.Types.Core.GameConfig;
}

export const PhaserGame = observer((props: PhaserGameProps) => {
  const { config } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const effectRanRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (effectRanRef.current) return;
    effectRanRef.current = true;

    config.parent = containerRef.current;
    // ! FIX THIS
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    config.scale!.parent = containerRef.current;
    new Phaser.Game(config);
  }, []);

  return <div ref={containerRef}></div>;
});
