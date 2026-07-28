import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CommunicationDataType,
  ControllerCommunicator,
  type PingData,
} from '@/index';

describe('ControllerCommunicator hoster time', () => {
  let installedPromiseWithResolvers = false;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(10_000);
    if (!Promise.withResolvers) {
      Object.defineProperty(Promise, 'withResolvers', {
        configurable: true,
        value: <T>() => {
          let resolve!: (value: T | PromiseLike<T>) => void;
          let reject!: (reason?: unknown) => void;
          const promise = new Promise<T>((promiseResolve, promiseReject) => {
            resolve = promiseResolve;
            reject = promiseReject;
          });

          return { promise, resolve, reject };
        },
      });
      installedPromiseWithResolvers = true;
    }
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      parent: {
        postMessage: vi.fn(),
      },
    });
  });

  afterEach(() => {
    if (installedPromiseWithResolvers) {
      Reflect.deleteProperty(Promise, 'withResolvers');
      installedPromiseWithResolvers = false;
    }
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns no hoster time before the first ping sample', () => {
    const communicator = new ControllerCommunicator();

    expect(communicator.getHosterTime()).toBeNull();

    communicator.destructor();
  });

  it('retains and advances the half-round-trip-adjusted hoster time', () => {
    const communicator = new ControllerCommunicator();
    const onPing = vi.fn<(pingData: PingData) => void>();
    communicator.addPingListener(onPing);

    communicator.messageHandler({
      type: CommunicationDataType.PONG_HOSTER,
      data: {
        id: 'ping-1',
        playerId: 'player-1',
        pingMs: 40,
        timeSinceStart: 5_000,
        hosterTime: 1_000_000,
      },
    });

    expect(communicator.pingData).toEqual({
      ping: 40,
      lastPoll: 10_000,
      timeSinceStart: 5_000,
      timeSinceStartPingAdjusted: 5_020,
      hosterTime: 1_000_000,
      hosterTimePingAdjusted: 1_000_020,
    });
    expect(onPing).toHaveBeenCalledWith(communicator.pingData);
    expect(communicator.getHosterTime()).toBe(1_000_020);

    vi.advanceTimersByTime(250);

    expect(communicator.getHosterTime()).toBe(1_000_270);

    communicator.destructor();
  });
});
