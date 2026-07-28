import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CommunicationDataType,
  ControllerCommunicator,
  GameMessageDeliveryError,
  HosterCommunicator,
  PlayerDto,
  Subscription,
} from '@/index';

interface TestGameData {
  ControllerToHoster: { action: string };
  HosterToController: { notice: string };
}

function createPlayerDto(
  connectionId: string,
  overrides: Partial<PlayerDto> = {},
): PlayerDto {
  return {
    screenName: connectionId,
    connectionId,
    image: null,
    ready: true,
    active: true,
    hasConnection: true,
    isHost: false,
    subscription: Subscription.Free,
    ...overrides,
  };
}

describe('game message delivery confirmation', () => {
  const postMessage = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      parent: { postMessage },
    });
    postMessage.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps ordinary controller messages fire-and-forget and unwrapped', () => {
    const communicator = new ControllerCommunicator<TestGameData>();
    postMessage.mockClear();

    const result = communicator.sendGameMessage({ action: 'buzz' });

    expect(result).toBeUndefined();
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: CommunicationDataType.GAME_ACTION_CONTROLLER,
        data: { payload: { action: 'buzz' } },
      },
      '*',
    );

    communicator.destructor();
  });

  it('resolves a controller delivery promise when the host acknowledges it', async () => {
    const communicator = new ControllerCommunicator<TestGameData>();
    postMessage.mockClear();

    const delivery = communicator.sendGameMessage(
      { action: 'buzz' },
      { timeoutMs: 1_000 },
    );
    const outbound = postMessage.mock.calls[0]?.[0];
    const messageId = outbound.data.payload.__tpgCoreDelivery.messageId;

    communicator.messageHandler({
      type: CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER,
      data: {
        payload: {
          __tpgCoreDelivery: {
            version: 1,
            kind: 'acknowledgement',
            messageId,
          },
        },
      },
    });

    await expect(delivery).resolves.toEqual({
      messageId,
      recipientId: 'hoster',
      confirmedAt: 10_000,
    });

    communicator.destructor();
  });

  it('unwraps a confirmed host message, acknowledges it, and hides protocol traffic', () => {
    const communicator = new ControllerCommunicator<TestGameData>();
    const onMessage = vi.fn();
    communicator.addGameMessageListener(onMessage);
    postMessage.mockClear();

    communicator.messageHandler({
      type: CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER,
      data: {
        payload: {
          __tpgCoreDelivery: {
            version: 1,
            kind: 'message',
            messageId: 'host-message-1',
          },
          payload: { notice: 'Next round' },
        },
      },
    });

    expect(onMessage).toHaveBeenCalledOnce();
    expect(onMessage).toHaveBeenCalledWith({
      payload: { notice: 'Next round' },
    });
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: CommunicationDataType.GAME_ACTION_CONTROLLER,
        data: {
          payload: {
            __tpgCoreDelivery: {
              version: 1,
              kind: 'acknowledgement',
              messageId: 'host-message-1',
            },
          },
        },
      },
      '*',
    );

    communicator.messageHandler({
      type: CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER,
      data: {
        payload: {
          __tpgCoreDelivery: {
            version: 1,
            kind: 'acknowledgement',
            messageId: 'unknown-message',
          },
        },
      },
    });

    expect(onMessage).toHaveBeenCalledOnce();
    communicator.destructor();
  });

  it('waits for every connected host broadcast recipient', async () => {
    const communicator = new HosterCommunicator<TestGameData>();
    communicator.playerStore.smartUpdatePlayers([
      createPlayerDto('player-1'),
      createPlayerDto('player-2'),
      createPlayerDto('offline-player', { hasConnection: false }),
    ]);
    postMessage.mockClear();

    const delivery = communicator.broadcastGameMessage(
      { notice: 'Vote now' },
      { timeoutMs: 1_000 },
    );
    const outboundMessages = postMessage.mock.calls.map(([message]) => message);

    expect(outboundMessages).toHaveLength(2);
    expect(outboundMessages.map((message) => message.data.to)).toEqual([
      'player-1',
      'player-2',
    ]);

    for (const outbound of outboundMessages.toReversed()) {
      communicator.messageHandler({
        type: CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER,
        data: {
          from: outbound.data.to,
          payload: {
            __tpgCoreDelivery: {
              version: 1,
              kind: 'acknowledgement',
              messageId: outbound.data.payload.__tpgCoreDelivery.messageId,
            },
          },
        },
      });
    }

    await expect(delivery).resolves.toEqual([
      {
        messageId: outboundMessages[0].data.payload.__tpgCoreDelivery.messageId,
        recipientId: 'player-1',
        confirmedAt: 10_000,
      },
      {
        messageId: outboundMessages[1].data.payload.__tpgCoreDelivery.messageId,
        recipientId: 'player-2',
        confirmedAt: 10_000,
      },
    ]);

    communicator.destructor();
  });

  it('accepts a host delivery acknowledgement only from its target player', async () => {
    const communicator = new HosterCommunicator<TestGameData>();
    communicator.playerStore.smartUpdatePlayers([
      createPlayerDto('player-1'),
      createPlayerDto('player-2'),
    ]);
    postMessage.mockClear();

    const delivery = communicator.sendGameMessage(
      { notice: 'Private message' },
      'player-1',
      { timeoutMs: 1_000 },
    );
    const outbound = postMessage.mock.calls[0]?.[0];
    const messageId = outbound.data.payload.__tpgCoreDelivery.messageId;
    const acknowledgement = {
      __tpgCoreDelivery: {
        version: 1,
        kind: 'acknowledgement',
        messageId,
      },
    };

    communicator.messageHandler({
      type: CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER,
      data: {
        from: 'player-2',
        payload: acknowledgement,
      },
    });

    let settled = false;
    void delivery.finally(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    communicator.messageHandler({
      type: CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER,
      data: {
        from: 'player-1',
        payload: acknowledgement,
      },
    });

    await expect(delivery).resolves.toMatchObject({
      messageId,
      recipientId: 'player-1',
    });

    communicator.destructor();
  });

  it('unwraps and acknowledges a confirmed controller message on the host', () => {
    const communicator = new HosterCommunicator<TestGameData>();
    const onMessage = vi.fn();
    communicator.addGameMessageListener(onMessage);
    postMessage.mockClear();

    communicator.messageHandler({
      type: CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER,
      data: {
        from: 'player-1',
        payload: {
          __tpgCoreDelivery: {
            version: 1,
            kind: 'message',
            messageId: 'controller-message-1',
          },
          payload: { action: 'buzz' },
        },
      },
    });

    expect(onMessage).toHaveBeenCalledOnce();
    expect(onMessage).toHaveBeenCalledWith({
      from: 'player-1',
      payload: { action: 'buzz' },
    });
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: CommunicationDataType.GAME_ACTION_HOSTER,
        data: {
          to: 'player-1',
          payload: {
            __tpgCoreDelivery: {
              version: 1,
              kind: 'acknowledgement',
              messageId: 'controller-message-1',
            },
          },
        },
      },
      '*',
    );

    communicator.destructor();
  });

  it('rejects on timeout and when a host recipient is unavailable', async () => {
    const controller = new ControllerCommunicator<TestGameData>();
    postMessage.mockClear();
    const timedOut = controller.sendGameMessage({ action: 'buzz' }, { timeoutMs: 250 });
    const timedOutExpectation = expect(timedOut).rejects.toMatchObject({
      name: 'GameMessageDeliveryError',
      code: 'timeout',
      recipientId: 'hoster',
      timeoutMs: 250,
    } satisfies Partial<GameMessageDeliveryError>);

    await vi.advanceTimersByTimeAsync(250);

    await timedOutExpectation;
    controller.destructor();

    const hoster = new HosterCommunicator<TestGameData>();
    hoster.playerStore.smartUpdatePlayers([
      createPlayerDto('offline-player', { hasConnection: false }),
    ]);
    postMessage.mockClear();

    await expect(
      hoster.sendGameMessage({ notice: 'Next round' }, 'offline-player', {
        timeoutMs: 250,
      }),
    ).rejects.toMatchObject({
      name: 'GameMessageDeliveryError',
      code: 'recipient-unavailable',
      recipientId: 'offline-player',
    } satisfies Partial<GameMessageDeliveryError>);
    expect(postMessage).not.toHaveBeenCalled();

    hoster.playerStore.smartUpdatePlayers([createPlayerDto('connected-player')]);
    postMessage.mockClear();
    const disconnected = hoster.sendGameMessage(
      { notice: 'Next round' },
      'connected-player',
      { timeoutMs: 1_000 },
    );
    const disconnectedExpectation = expect(disconnected).rejects.toMatchObject({
      name: 'GameMessageDeliveryError',
      code: 'recipient-unavailable',
      recipientId: 'connected-player',
    } satisfies Partial<GameMessageDeliveryError>);

    hoster.playerStore.smartUpdatePlayers([
      createPlayerDto('connected-player', { hasConnection: false }),
    ]);

    await disconnectedExpectation;
    hoster.destructor();
  });

  it('rejects and cleans up pending confirmations on destruction', async () => {
    const communicator = new ControllerCommunicator<TestGameData>();
    postMessage.mockClear();
    const delivery = communicator.sendGameMessage(
      { action: 'buzz' },
      { timeoutMs: 10_000 },
    );

    communicator.destructor();

    await expect(delivery).rejects.toMatchObject({
      name: 'GameMessageDeliveryError',
      code: 'communicator-destroyed',
      recipientId: 'hoster',
    } satisfies Partial<GameMessageDeliveryError>);

    await vi.advanceTimersByTimeAsync(10_000);
  });
});
