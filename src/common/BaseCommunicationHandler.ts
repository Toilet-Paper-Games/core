import {
  CommunicationDataTransfer,
  CommunicationDataType,
  GameDataTransfer,
  isCommunicationDataTransfer,
} from './CommunicationDataTransfers';
import { messageParent } from './utils/iFrameMessenger';

export abstract class BaseCommunicationHandler<TGameData = unknown> {
  appMessageListeners: {
    listener: (message: CommunicationDataTransfer) => void;
    type: CommunicationDataType | null;
  }[] = [];
  gameMessageListeners: {
    listener: (message: GameDataTransfer<TGameData>) => void;
  }[] = [];

  protected sendMessage(message: unknown) {
    messageParent(message);
  }

  // TODO: fix this should not be accessible to the App but only the frame, but is it.
  // TODO: base classes for the App Communication handlers should not extend from this
  sendAppMessage(message: CommunicationDataTransfer) {
    this.sendMessage(message);
  }

  protected messageHandler(message: unknown) {
    if (!isCommunicationDataTransfer<TGameData>(message))
      throw new Error('Invalid data transfer');

    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER) {
      this.gameMessageListeners.forEach((callbackfn) => callbackfn.listener(message));
      return;
    }

    this.appMessageListeners
      .filter(({ type }) => type === null || type === message.type)
      .forEach((callbackfn) => callbackfn.listener(message));
  }

  addAppMessageListener(listener: (message: CommunicationDataTransfer) => void): void;
  addAppMessageListener<T extends CommunicationDataType>(
    listener: (message: CommunicationDataTransfer & { type: T }) => void,
    type: T,
  ): void;
  addAppMessageListener(
    listener: (message: CommunicationDataTransfer) => void,
    type: CommunicationDataType | null = null,
  ) {
    this.appMessageListeners.push({ listener, type });
  }

  addGameMessageListener(listener: (message: GameDataTransfer<TGameData>) => void) {
    this.gameMessageListeners.push({ listener });
  }
}
