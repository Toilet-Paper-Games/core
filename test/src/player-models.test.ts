import { runInAction } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import {
  GameDataDefinition,
  HosterCommunicator,
  PlayerDto,
  PlayerModel,
  PlayerStore,
  SmartPlayerModel,
  Subscription,
} from '@/index';

interface TestGameData extends GameDataDefinition {
  ControllerToHoster: { action: string };
  HosterToController: { notice: string };
}

function createPlayerDto(overrides: Partial<PlayerDto> = {}): PlayerDto {
  return {
    screenName: 'Player One',
    connectionId: 'player-1',
    image: null,
    ready: false,
    active: true,
    hasConnection: true,
    isHost: false,
    subscription: Subscription.Free,
    ...overrides,
  };
}

function createCommunicatorMock() {
  const sendGameMessage = vi.fn();
  const communicator = {
    sendGameMessage,
  } as unknown as HosterCommunicator<TestGameData>;

  return { communicator, sendGameMessage };
}

describe('PlayerModel', () => {
  it('round-trips every player DTO field', () => {
    const dto = createPlayerDto({
      screenName: 'Host Player',
      image: 'data:image/png;base64,avatar',
      ready: true,
      active: false,
      hasConnection: false,
      isHost: true,
      subscription: Subscription.Day_Pass,
    });

    expect(PlayerModel.fromDto(dto).dto).toEqual(dto);
  });

  it('resolves readiness waiters after the player becomes ready', async () => {
    const player = new PlayerModel('Waiting Player', 'waiting-player');
    const ready = player.waitForReady();

    runInAction(() => {
      player.ready = true;
    });

    await expect(ready).resolves.toBeUndefined();
  });
});

describe('SmartPlayerModel', () => {
  it('exposes player state and routes typed messages to its connection', () => {
    const { communicator, sendGameMessage } = createCommunicatorMock();
    const player = PlayerModel.fromDto(
      createPlayerDto({
        screenName: 'Smart Player',
        ready: true,
        isHost: true,
      }),
    );
    const smartPlayer = new SmartPlayerModel(communicator, player);

    expect(smartPlayer.screenName).toBe('Smart Player');
    expect(smartPlayer.connectionId).toBe('player-1');
    expect(smartPlayer.ready).toBe(true);
    expect(smartPlayer.isHost).toBe(true);
    expect(smartPlayer.dto).toEqual(player.dto);

    smartPlayer.sendMessage({ notice: 'Next round' });

    expect(sendGameMessage).toHaveBeenCalledWith({ notice: 'Next round' }, 'player-1');

    const options = { timeoutMs: 1_000 };
    smartPlayer.sendMessage({ notice: 'Confirmed round' }, options);

    expect(sendGameMessage).toHaveBeenLastCalledWith(
      { notice: 'Confirmed round' },
      'player-1',
      options,
    );
  });

  it('notifies listeners only for changes and stops after destruction', () => {
    const { communicator } = createCommunicatorMock();
    const player = PlayerModel.fromDto(createPlayerDto());
    const smartPlayer = new SmartPlayerModel(communicator, player);
    const onReady = vi.fn();
    const onScreenName = vi.fn();

    smartPlayer.addReadyListener(onReady);
    smartPlayer.addScreenNameListener(onScreenName);

    runInAction(() => {
      player.ready = true;
      player.screenName = 'Renamed';
    });
    runInAction(() => {
      player.ready = true;
      player.screenName = 'Renamed';
    });

    expect(onReady).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledWith(true);
    expect(onScreenName).toHaveBeenCalledOnce();
    expect(onScreenName).toHaveBeenCalledWith('Renamed');

    smartPlayer.destroy();
    runInAction(() => {
      player.ready = false;
      player.screenName = 'After destroy';
    });

    expect(onReady).toHaveBeenCalledOnce();
    expect(onScreenName).toHaveBeenCalledOnce();
  });
});

describe('PlayerStore', () => {
  it('adds, updates, and removes players while preserving model identity', () => {
    const { communicator } = createCommunicatorMock();
    const store = new PlayerStore(communicator);
    const onJoin = vi.fn();
    const onKick = vi.fn();
    store.addPlayerJoinListener(onJoin);
    store.addPlayerKickedListener(onKick);

    store.smartUpdatePlayers([createPlayerDto()]);

    const player = store.playerMap.get('player-1');
    expect(player).toBeDefined();
    expect(onJoin).toHaveBeenCalledWith(player);

    store.smartUpdatePlayers([
      createPlayerDto({
        screenName: 'Updated Player',
        image: 'avatar.png',
        ready: true,
        active: false,
        hasConnection: false,
        isHost: true,
        subscription: Subscription.Day_Pass,
      }),
    ]);

    expect(store.playerMap.get('player-1')).toBe(player);
    expect(player?.dto).toEqual(
      createPlayerDto({
        screenName: 'Updated Player',
        image: 'avatar.png',
        ready: true,
        active: false,
        hasConnection: false,
        isHost: true,
        subscription: Subscription.Day_Pass,
      }),
    );
    expect(onJoin).toHaveBeenCalledOnce();

    store.smartUpdatePlayers([]);

    expect(store.players).toEqual([]);
    expect(onKick).toHaveBeenCalledWith(player);
    expect(store.playerToKick.size).toBe(0);
  });

  it('attaches aggregate listeners to current and future players and cleans them up', () => {
    const { communicator } = createCommunicatorMock();
    const store = new PlayerStore(communicator);
    store.smartUpdatePlayers([createPlayerDto()]);
    const onScreenName = vi.fn();
    const listener = store.addPlayerScreenNameListener(onScreenName);

    store.smartUpdatePlayers([
      createPlayerDto({ screenName: 'Existing renamed' }),
      createPlayerDto({
        connectionId: 'player-2',
        screenName: 'Player Two',
      }),
    ]);
    store.smartUpdatePlayers([
      createPlayerDto({ screenName: 'Existing renamed' }),
      createPlayerDto({
        connectionId: 'player-2',
        screenName: 'Future renamed',
      }),
    ]);

    expect(onScreenName).toHaveBeenNthCalledWith(
      1,
      store.playerMap.get('player-1'),
      'Existing renamed',
    );
    expect(onScreenName).toHaveBeenNthCalledWith(
      2,
      store.playerMap.get('player-2'),
      'Future renamed',
    );

    listener.destroy();
    store.smartUpdatePlayers([
      createPlayerDto({ screenName: 'After destroy' }),
      createPlayerDto({
        connectionId: 'player-2',
        screenName: 'Also after destroy',
      }),
    ]);

    expect(onScreenName).toHaveBeenCalledTimes(2);
  });
});
