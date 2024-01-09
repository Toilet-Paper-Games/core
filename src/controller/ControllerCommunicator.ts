import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_CONTROLLER,
  GameActionTransfer_CONTROLLER,
  GameDataDefinition,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';
 
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

  /**
   * @param {boolean} autoReady - Indicates whether the controller should automatically become ready. (Wait 1 second before becoming ready)
   */
  constructor(autoReady = false) {
    super();

    this.messageListener = (event) => this.messageHandler(event.data);
    window.addEventListener('message', this.messageListener);

    if (autoReady) {
      setTimeout(() => {
        this.ready();
      }, 1_000)
    }
  }

  /**
   * Removes the event listener for incoming messages.
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
      type: CommunicationDataType.READY_STATUS_CONTROLLER,
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

  /** This should not be used unless you know what you are doing */
  messageHandler(message: unknown) {
    super.messageHandler(message);

    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER) {
      this.gameMessageListeners.forEach((callbackfn) => callbackfn.listener(message));
      return;
    }
  }
}
