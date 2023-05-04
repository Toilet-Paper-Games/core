import { BaseCommunicationHandler } from '../common/BaseCommunicationHandler';
import {
  CommunicationDataType,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';

export class CommunicationHandlerFrameController<
  TGameData = unknown,
> extends BaseCommunicationHandler<TGameData> {
  constructor() {
    super();
    window.addEventListener('message', (event) => this.messageHandler(event.data));
  }

  sendGameMessage(data: TGameData) {
    this.sendMessage({
      type: CommunicationDataType.GAME_ACTION_HOSTER,
      data: {
        to: 'HOSTER',
        payload: data,
      },
    } satisfies GameDataTransfer<TGameData>);
  }
}
