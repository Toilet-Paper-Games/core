import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_HOSTER,
  GameDataDefinition,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';
import { PlayerModel } from '../common/models/PlayerModel';

export class HosterCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<GameDataDefinition> {
  connectionPlayerMap: Map<string, { uuid: string; player: PlayerModel }> = new Map();

  connectionListeners: ((player: { uuid: string; name: string }) => void)[] = [];
  disconnectionListeners: ((player: { uuid: string }) => void)[] = [];
  nameUpdateListeners: ((player: { uuid: string; name: string }) => void)[] = [];
  isReady = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageListener: (this: Window, ev: MessageEvent<any>) => any;

  /**
   * @param {boolean} autoReady - Indicates whether the controller should automatically become ready. (Wait 1 second before becoming ready)
   */
  constructor(autoReady = false) {
    super();
    this.messageListener = (event) => this.messageHandler(event.data);
    window.addEventListener('message', this.messageListener);

    this.addAppMessageListener(({ data }) => {
      data.players.forEach((player) => {
        this.connectionPlayerMap.set(player.uuid, {
          uuid: player.uuid,
          player: new PlayerModel(player.name, player.uuid),
        });
      });

      this.connectionId = data.connectionId;
    }, CommunicationDataType.STARTUP_HOSTER);

    this.addAppMessageListener(({ data }) => {
      this.connectionListeners.forEach((callbackfn) => callbackfn(data));

      this.connectionPlayerMap.set(data.uuid, {
        uuid: data.uuid,
        player: new PlayerModel(data.name, data.uuid),
      });
    }, CommunicationDataType.CONNECTION_HOSTER);

    this.addAppMessageListener(({ data }) => {
      this.disconnectionListeners.forEach((callbackfn) => callbackfn(data));

      const player = this.connectionPlayerMap.get(data.uuid);
      if (player) player.player.active = false;
    }, CommunicationDataType.DISCONNECTION_HOSTER);

    this.addAppMessageListener(({ data }) => {
      this.nameUpdateListeners.forEach((callbackfn) => callbackfn(data));

      const player = this.connectionPlayerMap.get(data.uuid);
      if (player) player.player.screenName = data.name;
    }, CommunicationDataType.UPDATE_NAME_HOSTER);

    if (autoReady) {
      setTimeout(() => {
        this.ready();
      }, 1_000);
    }
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
   * Sets the controller to an unready state.
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

  /**
   * Adds a connection listener to the HosterCommunicator.
   *
   * @param listener - The listener function to be added.
   * @returns An object with a `destroy` method that can be used to remove the listener.
   */
  addConnectionListener(listener: (player: { uuid: string; name: string }) => void) {
    this.connectionListeners.push(listener);

    return {
      destroy: () => {
        const index = this.connectionListeners.indexOf(listener);
        if (index === -1) return;

        this.connectionListeners.splice(index, 1);
      },
    };
  }

  /**
   * Adds a disconnection listener to the HosterCommunicator.
   *
   * @param listener - The listener function to be added.
   * @returns An object with a `destroy` method that can be used to remove the listener.
   */
  addDisconnectionListener(listener: (player: { uuid: string }) => void) {
    this.disconnectionListeners.push(listener);

    return {
      destroy: () => {
        const index = this.disconnectionListeners.indexOf(listener);
        if (index === -1) return;

        this.disconnectionListeners.splice(index, 1);
      },
    };
  }

  /**
   * Adds a listener for name updates.
   *
   * @param listener - The listener function to be called when a name update occurs.
   *                   It receives an object with the player's UUID and name.
   * @returns An object with a `destroy` method that can be called to remove the listener.
   */
  addNameUpdateListener(listener: (player: { uuid: string; name: string }) => void) {
    this.nameUpdateListeners.push(listener);

    return {
      destroy: () => {
        const index = this.nameUpdateListeners.indexOf(listener);
        if (index === -1) return;

        this.nameUpdateListeners.splice(index, 1);
      },
    };
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
    for (const userId of this.connectionPlayerMap.keys()) {
      this.sendGameMessage(data, userId);
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
