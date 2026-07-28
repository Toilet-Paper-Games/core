import {
  CommunicationDataTransfer,
  CommunicationDataType,
  ConfirmedGameMessageEnvelope,
  DEFAULT_GAME_MESSAGE_DELIVERY_TIMEOUT_MS,
  GameDataTransfer,
  GameMessageAcknowledgementEnvelope,
  GameMessageDeliveryError,
  GameMessageDeliveryOptions,
  GameMessageDeliveryReceipt,
  isCommunicationDataTransfer,
  isGameMessageDeliveryEnvelope,
} from './CommunicationDataTransfers';
import { messageParent } from './utils/iFrameMessenger';

interface PendingGameMessageDelivery {
  recipientId: string;
  timeoutMs: number;
  timeout: ReturnType<typeof setTimeout>;
  cleanups: Set<() => void>;
  resolve: (receipt: GameMessageDeliveryReceipt) => void;
  reject: (error: GameMessageDeliveryError) => void;
}

/**
 * Base class for communicators in the game core.
 * @template TGameData - The game data type that defines the communication structure between the host and the controller.
 */
export abstract class BaseCommunicator<
  TGameData extends { ControllerToHoster: unknown; HosterToController: unknown },
> {
  connectionId: string | null = null;

  #deliverySequence = 0;
  #pendingGameMessageDeliveries = new Map<string, PendingGameMessageDelivery>();

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
  protected messageHandler(
    message: unknown,
  ): asserts message is CommunicationDataTransfer<TGameData> {
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
  addAppMessageListener(
    listener: (message: CommunicationDataTransfer<TGameData>) => void,
  ): {
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
  protected addBaseGameMessageListener(
    listener: (message: GameDataTransfer<TGameData>) => void,
  ) {
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

  protected createConfirmedGameMessage<TPayload>(
    payload: TPayload,
    recipientId: string,
    options: GameMessageDeliveryOptions,
  ): {
    envelope: ConfirmedGameMessageEnvelope<TPayload>;
    delivery: Promise<GameMessageDeliveryReceipt>;
  } {
    const timeoutMs = options.timeoutMs ?? DEFAULT_GAME_MESSAGE_DELIVERY_TIMEOUT_MS;
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new RangeError('Game message delivery timeout must be greater than 0.');
    }

    const messageId = this.createGameMessageDeliveryId();
    const { promise, resolve, reject } =
      Promise.withResolvers<GameMessageDeliveryReceipt>();
    const timeout = setTimeout(() => {
      const pending = this.#pendingGameMessageDeliveries.get(messageId);
      if (!pending) return;

      this.#pendingGameMessageDeliveries.delete(messageId);
      this.runGameMessageDeliveryCleanups(pending);
      pending.reject(
        new GameMessageDeliveryError(
          'timeout',
          messageId,
          pending.recipientId,
          pending.timeoutMs,
        ),
      );
    }, timeoutMs);

    this.#pendingGameMessageDeliveries.set(messageId, {
      recipientId,
      timeoutMs,
      timeout,
      cleanups: new Set(),
      resolve,
      reject,
    });

    return {
      envelope: {
        __tpgCoreDelivery: {
          version: 1,
          kind: 'message',
          messageId,
        },
        payload,
      },
      delivery: promise,
    };
  }

  protected createUnavailableGameMessageDelivery(
    recipientId: string,
  ): Promise<GameMessageDeliveryReceipt> {
    const messageId = this.createGameMessageDeliveryId();
    return Promise.reject(
      new GameMessageDeliveryError('recipient-unavailable', messageId, recipientId),
    );
  }

  protected handleGameMessageAcknowledgement(
    payload: unknown,
    senderId?: string,
  ): boolean {
    if (
      !isGameMessageDeliveryEnvelope(payload) ||
      payload.__tpgCoreDelivery.kind !== 'acknowledgement'
    ) {
      return false;
    }

    const { messageId } = payload.__tpgCoreDelivery;
    const pending = this.#pendingGameMessageDeliveries.get(messageId);
    if (!pending || (senderId && pending.recipientId !== senderId)) {
      return true;
    }

    clearTimeout(pending.timeout);
    this.#pendingGameMessageDeliveries.delete(messageId);
    this.runGameMessageDeliveryCleanups(pending);
    pending.resolve({
      messageId,
      recipientId: pending.recipientId,
      confirmedAt: Date.now(),
    });
    return true;
  }

  protected unwrapConfirmedGameMessage<TPayload>(
    payload: TPayload | ConfirmedGameMessageEnvelope<TPayload>,
  ):
    | { confirmed: false; payload: TPayload }
    | { confirmed: true; messageId: string; payload: TPayload } {
    if (
      !isGameMessageDeliveryEnvelope(payload) ||
      payload.__tpgCoreDelivery.kind !== 'message'
    ) {
      return { confirmed: false, payload: payload as TPayload };
    }

    const envelope = payload as ConfirmedGameMessageEnvelope<TPayload>;
    return {
      confirmed: true,
      messageId: envelope.__tpgCoreDelivery.messageId,
      payload: envelope.payload,
    };
  }

  protected createGameMessageAcknowledgement(
    messageId: string,
  ): GameMessageAcknowledgementEnvelope {
    return {
      __tpgCoreDelivery: {
        version: 1,
        kind: 'acknowledgement',
        messageId,
      },
    };
  }

  protected addGameMessageDeliveryCleanup(messageId: string, cleanup: () => void) {
    const pending = this.#pendingGameMessageDeliveries.get(messageId);
    if (!pending) {
      cleanup();
      return;
    }

    pending.cleanups.add(cleanup);
  }

  protected rejectGameMessageDelivery(
    messageId: string,
    code: Exclude<GameMessageDeliveryError['code'], 'timeout'>,
  ) {
    const pending = this.#pendingGameMessageDeliveries.get(messageId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.#pendingGameMessageDeliveries.delete(messageId);
    this.runGameMessageDeliveryCleanups(pending);
    pending.reject(new GameMessageDeliveryError(code, messageId, pending.recipientId));
  }

  protected rejectPendingGameMessageDeliveries() {
    for (const [messageId, pending] of this.#pendingGameMessageDeliveries) {
      clearTimeout(pending.timeout);
      this.runGameMessageDeliveryCleanups(pending);
      pending.reject(
        new GameMessageDeliveryError(
          'communicator-destroyed',
          messageId,
          pending.recipientId,
        ),
      );
    }
    this.#pendingGameMessageDeliveries.clear();
  }

  private createGameMessageDeliveryId() {
    this.#deliverySequence += 1;
    return `${Date.now().toString(36)}-${this.#deliverySequence.toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  private runGameMessageDeliveryCleanups(pending: PendingGameMessageDelivery) {
    for (const cleanup of pending.cleanups) {
      cleanup();
    }
    pending.cleanups.clear();
  }
}
