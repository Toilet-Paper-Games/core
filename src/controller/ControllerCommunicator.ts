import { PlayerDto } from '@/common/models/PlayerModel';
import {
  MOBX_makeSimpleAutoObservable,
  smartUpdate,
} from '@/common/utils/mobx/index.skip-barrel';

import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_CONTROLLER,
  GameActionTransfer_CONTROLLER,
  GameDataDefinition,
  GameDataTransfer,
  GameMessageDeliveryOptions,
  GameMessageDeliveryReceipt,
  isCommunicationDataTransfer,
} from '../common/CommunicationDataTransfers';
import { ControllerDataPersistence } from './ControllerDataPersistence';

export interface PingData {
  ping: number;
  lastPoll: number;
  timeSinceStart: number;
  timeSinceStartPingAdjusted: number;
  /** Hoster clock timestamp when the latest pong was sent. */
  hosterTime: number;
  /** Estimated hoster timestamp when the latest pong reached this controller. */
  hosterTimePingAdjusted: number;
}

export class ControllerCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<TGameData> {
  player: PlayerDto | null = null;
  dataPersistence = new ControllerDataPersistence(this);

  /** This should not be used unless you know what you are doing */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageListener: (this: Window, ev: MessageEvent<any>) => any;
  /** Do not change this value directly, use ready and unready functions */
  isReady = false;
  lobbyGame?: boolean;
  devMode?: boolean;
  hosterReady = false;
  joinCode?: string;
  joinUrl?: string;

  /** Current ping (time from hoster to controller and controller to hoster combined) */
  pingData: PingData | null = null;
  pingListeners: { listener: (pingData: PingData) => void }[] = [];

  /**
   * Estimated current hoster timestamp in milliseconds.
   *
   * The latest host timestamp is adjusted by half the measured round-trip time
   * and advanced using elapsed controller time between ping samples. Call this
   * method on demand; it does not schedule timer updates.
   *
   * @returns The estimated hoster clock, or `null` before the first completed
   * ping exchange.
   */
  getHosterTime(): number | null {
    if (!this.pingData) {
      return null;
    }

    return this.pingData.hosterTimePingAdjusted + (Date.now() - this.pingData.lastPoll);
  }

  addHosterReadyListener(listener: (ready: boolean) => void) {
    return this.addAppMessageListener(({ data }) => {
      listener(data.hosterReady);
    }, CommunicationDataType.AppData_CONTROLLER);
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
      this.hasLoaded = true;

      this.hosterReady = data.hosterReady;

      this.lobbyGame = data.lobbyGame;
      this.devMode = data.devMode;
      this.joinCode = data.joinCode;
      this.joinUrl = data.joinUrl;

      this.connectionId = data.connectionId;

      if (!this.dataPersistence.globalSettings || !data.globalSettings) {
        this.dataPersistence.globalSettings = data.globalSettings;
      } else {
        smartUpdate(this.dataPersistence.globalSettings, data.globalSettings);
      }

      if (!this.dataPersistence.gameStorage || !data.gameStorage) {
        this.dataPersistence.gameStorage = data.gameStorage;
      } else {
        smartUpdate(this.dataPersistence.gameStorage, data.gameStorage);
      }

      if (!this.player || !data.player) {
        this.player = data.player;
      } else {
        smartUpdate(this.player, data.player);
      }
    }, CommunicationDataType.AppData_CONTROLLER);

    this.sendAppMessage({
      type: CommunicationDataType.INIT_GAME_CONTROLLER,
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
   * Removes the event listener for incoming messages.
   * Use this when you are done with the controller.
   */
  destructor() {
    window.removeEventListener('message', this.messageListener);
    this.rejectPendingGameMessageDeliveries();
  }

  private setupPingPong() {
    this.addAppMessageListener(({ data }) => {
      this.sendAppMessage({
        type: CommunicationDataType.PONG_CONTROLLER,
        data: {
          id: data.id,
          controllerTime: Date.now(),
          playerId: data.playerId,
        },
      });
    }, CommunicationDataType.PING_HOSTER);

    this.addAppMessageListener(({ data }) => {
      const lastPoll = Date.now();
      const oneWayDelay = data.pingMs / 2;
      const pingData = {
        ping: data.pingMs,
        lastPoll,
        timeSinceStart: data.timeSinceStart,
        timeSinceStartPingAdjusted: data.timeSinceStart + oneWayDelay,
        hosterTime: data.hosterTime,
        hosterTimePingAdjusted: data.hosterTime + oneWayDelay,
      };

      this.pingData = pingData;

      this.pingListeners.forEach((listenerObj) => listenerObj.listener(pingData));
    }, CommunicationDataType.PONG_HOSTER);
  }

  /**
   * Sets the ready status of the controller.
   */
  ready() {
    this.isReady = true;
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_CONTROLLER,
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
      type: CommunicationDataType.READY_STATUS_CONTROLLER,
      data: {
        ready: false,
      },
    });
  }

  /**
   * Sends a game message to the hoster.
   * @param data The game data to be sent.
   */
  sendGameMessage(data: TGameData['ControllerToHoster']): void;
  sendGameMessage(
    data: TGameData['ControllerToHoster'],
    options: GameMessageDeliveryOptions,
  ): Promise<GameMessageDeliveryReceipt>;
  sendGameMessage(
    data: TGameData['ControllerToHoster'],
    options?: GameMessageDeliveryOptions,
  ): void | Promise<GameMessageDeliveryReceipt> {
    if (options) {
      const { envelope, delivery } = this.createConfirmedGameMessage(
        data,
        'hoster',
        options,
      );
      this.sendMessage({
        type: CommunicationDataType.GAME_ACTION_CONTROLLER,
        data: {
          payload: envelope,
        },
      });
      return delivery;
    }

    this.sendMessage({
      type: CommunicationDataType.GAME_ACTION_CONTROLLER,
      data: {
        payload: data,
      },
    } satisfies GameActionTransfer_CONTROLLER<TGameData>);
  }

  /**
   * Adds a game message listener to the controller communicator.
   * The listener will be called whenever a game action response is received.
   * @param listener - The callback function to be called when a game action response is received.
   * @returns An object with a `destroy` method that can be used to remove the listener.
   */
  addGameMessageListener(
    listener: (message: GameActionResponseTransfer_CONTROLLER<TGameData>['data']) => void,
  ) {
    const newListener = {
      listener: (message: GameDataTransfer<TGameData>) => {
        if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER) {
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

  addPingListener(listener: (pingData: PingData) => void) {
    this.pingListeners.push({ listener });

    return {
      destroy: () => {
        const index = this.pingListeners.findIndex(
          (listenerObj) => listenerObj.listener === listener,
        );
        if (index === -1) return;

        this.pingListeners.splice(index, 1);
      },
    };
  }

  endGame() {
    this.sendAppMessage({ type: CommunicationDataType.END_GAME_CONTROLLER, data: {} });
  }

  reloadGame() {
    this.sendAppMessage({ type: CommunicationDataType.RELOAD_GAME_CONTROLLER, data: {} });
  }

  /** This should not be used unless you know what you are doing */
  messageHandler(message: unknown) {
    if (!isCommunicationDataTransfer<TGameData>(message)) {
      throw new Error('Invalid data transfer');
    }

    if (
      message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER &&
      this.handleGameMessageAcknowledgement(message.data.payload)
    ) {
      return;
    }

    let normalizedMessage = message;
    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER) {
      const incoming = this.unwrapConfirmedGameMessage(message.data.payload);
      if (incoming.confirmed) {
        this.sendMessage({
          type: CommunicationDataType.GAME_ACTION_CONTROLLER,
          data: {
            payload: this.createGameMessageAcknowledgement(incoming.messageId),
          },
        });
        normalizedMessage = {
          ...message,
          data: {
            ...message.data,
            payload: incoming.payload,
          },
        };
      }
    }

    super.messageHandler(normalizedMessage);

    if (
      normalizedMessage.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER
    ) {
      this.gameMessageListeners.forEach((callbackfn) =>
        callbackfn.listener(normalizedMessage),
      );
      return;
    }
  }
}
