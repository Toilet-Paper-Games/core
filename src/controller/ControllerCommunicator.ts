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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageListener: (this: Window, ev: MessageEvent<any>) => any;

  constructor(autoReady = false) {
    super();

    this.messageListener = (event) => this.messageHandler(event.data);
    window.addEventListener('message', this.messageListener);

    if (autoReady) {
      this.ready();
    }
  }

  destructor() {
    window.removeEventListener('message', this.messageListener);
  }

  ready() {
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_CONTROLLER,
      data: {
        ready: true,
      },
    });
  }

  unready() {
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_CONTROLLER,
      data: {
        ready: false,
      },
    });
  }

  sendGameMessage(data: TGameData['ControllerToHoster']) {
    this.sendMessage({
      type: CommunicationDataType.GAME_ACTION_CONTROLLER,
      data: {
        payload: data,
      },
    } satisfies GameActionTransfer_CONTROLLER<TGameData>);
  }

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

  messageHandler(message: unknown) {
    super.messageHandler(message);

    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER) {
      this.gameMessageListeners.forEach((callbackfn) => callbackfn.listener(message));
      return;
    }
  }
}
