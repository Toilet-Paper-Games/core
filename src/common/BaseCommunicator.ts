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
  protected appMessageListeners: {
    listener: (message: CommunicationDataTransfer<TGameData>) => void;
    type: CommunicationDataType | null;
  }[] = [];
  protected gameMessageListeners: {
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

  protected messageHandler(
    message: unknown,
  ): asserts message is CommunicationDataTransfer<TGameData> {
    if (!isCommunicationDataTransfer<TGameData>(message))
      throw new Error('Invalid data transfer');

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
    const newListener = { listener, type };
    this.appMessageListeners.push(newListener);

    return {
      destroy: () => {
        const index = this.appMessageListeners.indexOf(newListener);
        if (index === -1) return;

        this.appMessageListeners.splice(index, 1);
      },
    };
  }

  protected addBaseGameMessageListener(listener: (message: GameDataTransfer<TGameData>) => void) {
    const newListener = { listener };
    this.gameMessageListeners.push(newListener);

    return {
      destroy: () => {
        const index = this.gameMessageListeners.indexOf(newListener);
        if (index === -1) return;

        this.gameMessageListeners.splice(index, 1);
      },
    };
  }
}
