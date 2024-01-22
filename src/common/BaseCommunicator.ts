import {
  CommunicationDataTransfer,
  CommunicationDataType,
  GameDataTransfer,
  isCommunicationDataTransfer,
} from './CommunicationDataTransfers';
import { messageParent } from './utils/iFrameMessenger';

/**
 * Base class for communicators in the game core.
 * @template TGameData - The game data type that defines the communication structure between the host and the controller.
 */
export abstract class BaseCommunicator<TGameData extends { ControllerToHoster: unknown; HosterToController: unknown }> {
  /**
   * Array of app message listeners.
   */
  protected appMessageListeners: {
    listener: (message: CommunicationDataTransfer<TGameData>) => void;
    type: CommunicationDataType | null;
  }[] = [];

  /**
   * Array of game message listeners.
   */
  protected gameMessageListeners: {
    listener: (message: GameDataTransfer<TGameData>) => void;
  }[] = [];

  /**
   * Sends a message to the host or the controller.
   * @param message - The message to be sent.
   */
  protected sendMessage(
    message: TGameData['HosterToController'] | TGameData['ControllerToHoster'],
  ) {
    messageParent(message);
  }

  /**
   * Sends an app message to the host or the controller.
   * @param message - The app message to be sent.
   */
  sendAppMessage(message: CommunicationDataTransfer<TGameData>) {
    this.sendMessage(message);
  }

  /**
   * Handles the incoming message and notifies the app message listeners.
   * @param message - The incoming message.
   * @throws Error if the message is not a valid data transfer.
   */
  protected messageHandler(message: unknown): asserts message is CommunicationDataTransfer<TGameData> {
    if (!isCommunicationDataTransfer<TGameData>(message))
      throw new Error('Invalid data transfer');

    this.appMessageListeners
      .filter(({ type }) => type === null || type === message.type)
      .forEach((callbackfn) => callbackfn.listener(message));
  }

  /**
   * Adds an app message listener.
   * @param listener - The listener function to be added.
   * @returns An object with a `destroy` method to remove the listener.
   */
  addAppMessageListener(listener: (message: CommunicationDataTransfer<TGameData>) => void): {
    destroy: () => void;
  };

  /**
   * Adds an app message listener with a specific message type.
   * @param listener - The listener function to be added.
   * @param type - The specific message type to listen for.
   * @returns An object with a `destroy` method to remove the listener.
   */
  addAppMessageListener<T extends CommunicationDataType>(
    listener: (message: CommunicationDataTransfer<TGameData> & { type: T }) => void,
    type: T,
  ): {
    destroy: () => void;
  };

  /**
   * Adds an app message listener.
   * @param listener - The listener function to be added.
   * @param type - The specific message type to listen for. If not provided, listens for all message types.
   * @returns An object with a `destroy` method to remove the listener.
   */
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

  /**
   * Adds a game message listener.
   * @param listener - The listener function to be added.
   * @returns An object with a `destroy` method to remove the listener.
   */
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
