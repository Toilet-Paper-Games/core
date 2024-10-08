import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_HOSTER,
  GameDataDefinition,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';
import { PlayerStore } from './PlayerStore';

export class HosterCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<GameDataDefinition> {
  playerStore = new PlayerStore();

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

  /**
   * @param {boolean} autoReady - Indicates whether the controller should automatically become ready. (Wait 1 second before becoming ready)
   */
  constructor(autoReady = false) {
    super();
    this.messageListener = (event) => this.messageHandler(event.data);
    window.addEventListener('message', this.messageListener);

    this.addAppMessageListener(({ data }) => {
      this.playerStore.smartUpdatePlayers(data.players);

      this.devMode = data.devMode;
      this.joinCode = data.joinCode;

      this.connectionId = data.connectionId;
    }, CommunicationDataType.AppData_HOSTER);

    this.sendAppMessage({
      type: CommunicationDataType.INIT_GAME_HOSTER,
      data: {},
    });

    // TODO: This should eventually be removed as it was added for backwards compatibility
    // with the old system.
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
