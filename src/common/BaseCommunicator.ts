import {
  CommunicationDataTransfer,
  CommunicationDataType,
  GameDataTransfer,
  isCommunicationDataTransfer,
} from './CommunicationDataTransfers';
import { messageParent } from './utils/iFrameMessenger';

export abstract class BaseCommunicator<
  TGameData extends { ControllerToHoster: unknown; HosterToController: unknown } = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> {
  appMessageListeners: {
    listener: (message: CommunicationDataTransfer<TGameData>) => void;
    type: CommunicationDataType | null;
  }[] = [];
  gameMessageListeners: {
    listener: (message: GameDataTransfer<TGameData>) => void;
  }[] = [];

  protected sendMessage(
    message: TGameData['HosterToController'] | TGameData['ControllerToHoster'],
  ) {
    messageParent(message);
  }

  // TODO: fix this should not be accessible to the App but only the frame, but is it.
  // TODO: base classes for the App Communication handlers should not extend from this
  sendAppMessage(message: CommunicationDataTransfer<TGameData>) {
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

  addAppMessageListener(
    listener: (message: CommunicationDataTransfer<TGameData>) => void,
  ): void;
  addAppMessageListener<T extends CommunicationDataType>(
    listener: (message: CommunicationDataTransfer<TGameData> & { type: T }) => void,
    type: T,
  ): void;
  addAppMessageListener(
    listener: (message: CommunicationDataTransfer<TGameData>) => void,
    type: CommunicationDataType | null = null,
  ) {
    this.appMessageListeners.push({ listener, type });
  }

  addBaseGameMessageListener(listener: (message: GameDataTransfer<TGameData>) => void) {
    this.gameMessageListeners.push({ listener });
  }
}
