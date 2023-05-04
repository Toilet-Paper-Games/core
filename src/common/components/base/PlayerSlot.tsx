import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import {
  border,
  borderRadius,
  colors,
  dropShadow,
  flex,
  flex1,
  marginHorizontal,
  relative,
} from '@/common/styles';
import { scalePop } from '@/common/styles/animation';
import { PlayerModel } from '@/lib/common/models/PlayerModel';

export interface PlayerSlotProps {
  player?: PlayerModel;
}

export const PlayerSlot = observer((props: PlayerSlotProps) => {
  const { player } = props;

  const hadPlayerSet = useRef(Boolean(player));
  const [runAnimation, setRunAnimation] = useState(false);

  useEffect(() => {
    if (!hadPlayerSet.current && player) setRunAnimation(true);
    if (!player) setRunAnimation(false);

    hadPlayerSet.current = Boolean(player);
  }, [player]);

  return (
    <div
      css={[
        {
          backgroundColor: colors.transparent,
          backdropFilter: 'blur(5px)',
          height: 50,
          width: '100%',
          alignItems: 'center',
        },
        player && {
          borderColor: colors.borderFocused,
          filter: 'brightness(110%)',
        },
        runAnimation && scalePop(),
        borderRadius('xl'),
        flex(),

        relative(),
        border(colors.border),
        dropShadow(2),
      ]}
    >
      <img
        css={[{ height: '100%' }, marginHorizontal('md')]}
        src={player?.image}
        alt=""
      />
      <div css={[flex1]}>{player?.screenName ?? ''}</div>
    </div>
  );
});
