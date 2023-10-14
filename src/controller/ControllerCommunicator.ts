import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_CONTROLLER,
  GameActionTransfer_CONTROLLER,
  GameDataDefinition,
} from '../common/CommunicationDataTransfers';

export class ControllerCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<TGameData> {
  constructor() {
    super();
    window.addEventListener('message', (event) => this.messageHandler(event.data));
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
    this.gameMessageListeners.push({
      listener: (message) => {
        if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER) {
          listener(message.data);
        }
      },
    });
  }
}
