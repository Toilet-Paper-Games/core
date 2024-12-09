import { runInAction } from 'mobx';

import { PlayerModel } from '@/common/models/PlayerModel';
import { MOBX_makeSimpleAutoObservable } from '@/common/utils/mobx/index.skip-barrel';

import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_HOSTER,
  GameDataDefinition,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';
import { PlayerStore } from './PlayerStore';

export interface PlayerPingData {
  player: PlayerModel;
  ping: number;
  lastPoll: number;
}

export class HosterCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<GameDataDefinition> {
  playerStore = new PlayerStore(this);

  playerPingMap: Map<string, PlayerPingData> = new Map();
  playerPingListeners: { listener: (playerPingData: PlayerPingData) => void }[] = [];

  readonly startTime = Date.now();

  /** Don't write to this */
  isReady = false;

  /** Don't write to this */
  devMode?: boolean;
  /** Don't write to this */
  joinCode?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageListener: (this: Window, ev: MessageEvent<any>) => any;

  /** Alias to playerStore.players */
  get players() {
    return this.playerStore.players;
  }

  /** Alias to playerStore.playerMap */
  get playerMap() {
    return this.playerStore.playerMap;
  }

  /** Promise indicating when communication between tp.games and the game have had first communication */
  waitForLoad: Promise<void>;

  /** If this value is true, tp.games and the game have communicated */
  hasLoaded = false;

  /**
   * @param {boolean} autoReady - Indicates whether the controller should automatically become ready. (Wait 1 second before becoming ready)
   */
  constructor(autoReady = false) {
    super();

    const { promise, resolve } = Promise.withResolvers<void>();

    this.waitForLoad = promise;

    this.messageListener = (event) => this.messageHandler(event.data);
    window.addEventListener('message', this.messageListener);

    this.addAppMessageListener(({ data }) => {
      resolve();
      runInAction(() => {
        this.hasLoaded = true;

        this.playerStore.smartUpdatePlayers(data.players);

        this.devMode = data.devMode;
        this.joinCode = data.joinCode;

        this.connectionId = data.connectionId;
      });
    }, CommunicationDataType.AppData_HOSTER);

    this.sendAppMessage({
      type: CommunicationDataType.INIT_GAME_HOSTER,
      data: {
        coreVersion: import.meta.env.PACKAGE_VERSION,
      },
    });

    this.setupPingPong();

    // TODO: This should eventually be removed as it was added for backwards compatibility
    // with the old system.
    if (autoReady) {
      setTimeout(() => {
        this.ready();
      }, 1_000);
    }

    MOBX_makeSimpleAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * Removes the event listener for message events.
   * Use this when you are done with the controller.
   */
  destructor() {
    window.removeEventListener('message', this.messageListener);
  }

  /**
   * Sets the ready status of the controller.
   */
  ready() {
    this.isReady = true;
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_HOSTER,
      data: {
        ready: true,
      },
    });
  }

  /**
   * Sets the controller to an unready state. Note: this should never have to happen
   */
  unready() {
    this.isReady = false;
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_HOSTER,
      data: {
        ready: false,
      },
    });
  }

  private setupPingPong() {
    const requestPings = () => {
      const activePlayers = this.players.filter((player) => player.active);

      for (const player of activePlayers) {
        this.fetchPing(player.connectionId);
      }
    };

    setInterval(requestPings, 2_500);
  }

  async fetchPing(playerId: string) {
    const id = Math.random().toString(36).slice(2);

    const currentTimePing = Date.now();

    this.sendAppMessage({
      type: CommunicationDataType.PING_HOSTER,
      data: {
        id,
        playerId,
        timeSinceStart: currentTimePing - this.startTime,
        hosterTime: currentTimePing,
      },
    });

    const { promise: controllerPongPromise, resolve } = Promise.withResolvers<void>();

    const pongControllerListener = this.addAppMessageListener((message) => {
      if (message.data.playerId === playerId && message.data.id === id) {
        resolve();
      }
    }, CommunicationDataType.PONG_CONTROLLER);

    await controllerPongPromise;

    pongControllerListener.destroy();

    const pingMs = Date.now() - currentTimePing;
    const currentTimePong = Date.now();
    this.sendAppMessage({
      type: CommunicationDataType.PONG_HOSTER,
      data: {
        id,
        playerId,
        pingMs,
        timeSinceStart: currentTimePong - this.startTime,
        hosterTime: currentTimePong,
      },
    });

    const player = this.playerMap.get(playerId);

    if (player) {
      runInAction(() => {
        this.playerPingMap.set(playerId, {
          player: player,
          ping: pingMs,
          lastPoll: currentTimePong,
        });
      });

      this.playerPingListeners.forEach(({ listener }) => {
        listener({
          player: player,
          ping: pingMs,
          lastPoll: currentTimePong,
        });
      });
    }

    return pingMs;
  }

  /**
   * Sends a game message to a specific user.
   * @param data The game data to send.
   * @param userId The ID of the user to send the message to.
   */
  sendGameMessage(data: TGameData['HosterToController'], userId: string) {
    this.sendMessage({
      type: CommunicationDataType.GAME_ACTION_HOSTER,
      data: {
        to: userId,
        payload: data,
      },
    } satisfies GameDataTransfer<TGameData>);
  }

  /**
   * Broadcasts a game message to all connected players.
   *
   * @param data The game message data to be sent.
   */
  broadcastGameMessage(data: TGameData['HosterToController']) {
    // TODO: create a dedicated method for broadcasting messages
    // such that less messages are sent across the iframe
    for (const player of this.players) {
      this.sendGameMessage(data, player.connectionId);
    }
  }

  /**
   * Adds a game message listener.
   *
   * @param listener - The callback function to be called when a game message is received.
   * @returns An object with a `destroy` method that can be used to remove the listener.
   */
  addGameMessageListener(
    listener: (message: GameActionResponseTransfer_HOSTER<TGameData>['data']) => void,
  ) {
    const newListener = {
      listener: (message: GameDataTransfer<TGameData>) => {
        if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER) {
          listener(message.data);
        }
      },
    };
    this.gameMessageListeners.push(newListener);

    return {
      destroy: () => {
        const index = this.gameMessageListeners.indexOf(newListener);
        if (index === -1) return;

        this.gameMessageListeners.splice(index, 1);
      },
    };
  }

  addPlayerPingListener(listener: (playerPingData: PlayerPingData) => void) {
    this.playerPingListeners.push({ listener });

    return {
      destroy: () => {
        const index = this.playerPingListeners.findIndex(
          (listenerObj) => listenerObj.listener === listener,
        );
        if (index === -1) return;

        this.playerPingListeners.splice(index, 1);
      },
    };
  }

  endGame() {
    this.sendAppMessage({ type: CommunicationDataType.END_GAME_HOSTER, data: {} });
  }

  reloadGame() {
    this.sendAppMessage({ type: CommunicationDataType.RELOAD_GAME_HOSTER, data: {} });
  }

  /** This should not be used unless you know what you are doing */
  messageHandler(message: unknown) {
    super.messageHandler(message);

    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER) {
      this.gameMessageListeners.forEach((callbackfn) => callbackfn.listener(message));
      return;
    }
  }
}
