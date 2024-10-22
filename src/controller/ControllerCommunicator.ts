import { MOBX_makeSimpleAutoObservable } from '@/common/utils/mobx';

import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_CONTROLLER,
  GameActionTransfer_CONTROLLER,
  GameDataDefinition,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';

export interface PingData {
  ping: number;
  lastPoll: number;
  timeSinceStart: number;
  timeSinceStartPingAdjusted: number;
}

export class ControllerCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<TGameData> {
  /** This should not be used unless you know what you are doing */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageListener: (this: Window, ev: MessageEvent<any>) => any;
  /** Do not change this value directly, use ready and unready functions */
  isReady = false;
  devMode?: boolean;
  hosterReady = false;
  joinCode?: string;

  /** Current ping (time from hoster to controller and controller to hoster combined) */
  pingData: PingData | null = null;
  pingListeners: { listener: (pingData: PingData) => void }[] = [];

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

      this.devMode = data.devMode;
      this.joinCode = data.joinCode;

      this.connectionId = data.connectionId;
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
      const pingData = {
        ping: data.pingMs,
        lastPoll: Date.now(),
        timeSinceStart: data.timeSinceStart,
        timeSinceStartPingAdjusted: data.timeSinceStart + data.pingMs / 2,
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
  sendGameMessage(data: TGameData['ControllerToHoster']) {
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
    super.messageHandler(message);

    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER) {
      this.gameMessageListeners.forEach((callbackfn) => callbackfn.listener(message));
      return;
    }
  }
}
