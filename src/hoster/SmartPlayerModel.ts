import { makeAutoObservable, reaction } from 'mobx';

import {
  GameDataDefinition,
  GameMessageDeliveryOptions,
  GameMessageDeliveryReceipt,
} from '@/common/CommunicationDataTransfers';

import { PlayerModel } from '../common/models/PlayerModel';
import { HosterCommunicator } from './HosterCommunicator';

/**
 * Host-side, observable view of one connected player.
 *
 * Instances are managed by the hoster's player store and exposed through
 * {@link HosterCommunicator.players}. Player state is projected from the
 * platform-owned {@link PlayerModel}; use the listener methods to observe later
 * changes and {@link sendMessage} to target this player.
 *
 * @typeParam TGameData The game's controller-to-hoster and
 * hoster-to-controller message contract.
 */
export class SmartPlayerModel<TGameData extends GameDataDefinition> {
  /**
   * Creates a host-side player view.
   *
   * Most game code receives managed instances from
   * {@link HosterCommunicator.players} instead of constructing them directly.
   *
   * @param hosterCommunicator Communicator used for targeted game messages.
   * @param playerModel Platform-owned observable player state.
   */
  constructor(
    private hosterCommunicator: HosterCommunicator<TGameData>,
    private playerModel: PlayerModel,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /** Current player-chosen display name, or `null` before one is set. */
  get screenName() {
    return this.playerModel.screenName;
  }

  /** Stable transport connection identifier used to target this player. */
  get connectionId() {
    return this.playerModel.connectionId;
  }

  /** Current player image data or URL, or `null` when no image is set. */
  get image() {
    return this.playerModel.image;
  }

  /** Whether the player's controller surface has reported ready. */
  get ready() {
    return this.playerModel.ready;
  }

  /** Whether the player is currently participating in the game. */
  get active() {
    return this.playerModel.active;
  }

  /** Whether the platform currently has a live connection to the player. */
  get hasConnection() {
    return this.playerModel.hasConnection;
  }

  /** Whether this player currently owns the host role. */
  get isHost() {
    return this.playerModel.isHost;
  }

  /** Current subscription entitlement reported by the platform. */
  get subscription() {
    return this.playerModel.subscription;
  }

  /** Fresh serializable snapshot of the player's current platform state. */
  get dto() {
    return this.playerModel.dto;
  }

  /**
   * Sends a typed game payload only to this player.
   *
   * @param data Payload from the game's `HosterToController` contract.
   * @param options Optional delivery-confirmation settings.
   */
  sendMessage(data: TGameData['HosterToController']): void;
  sendMessage(
    data: TGameData['HosterToController'],
    options: GameMessageDeliveryOptions,
  ): Promise<GameMessageDeliveryReceipt>;
  sendMessage(
    data: TGameData['HosterToController'],
    options?: GameMessageDeliveryOptions,
  ): void | Promise<GameMessageDeliveryReceipt> {
    if (options) {
      return this.hosterCommunicator.sendGameMessage(data, this.connectionId, options);
    }

    this.hosterCommunicator.sendGameMessage(data, this.connectionId);
  }

  /**
   * Waits until the player's controller reports ready.
   *
   * @param abortSignal Optional signal that rejects the wait if aborted first.
   * @returns A promise that resolves once {@link ready} becomes `true`.
   */
  async waitForReady(abortSignal?: AbortSignal): Promise<void> {
    return this.playerModel.waitForReady(abortSignal);
  }

  /**
   * Active MobX reaction disposers registered by this instance.
   *
   * Prefer {@link destroy} for cleanup instead of invoking this collection
   * directly.
   */
  destructors: (() => void)[] = [];

  private addListenerHelper<T>(selector: () => T, listener: (value: T) => void) {
    const destructor = reaction(selector, callIfDifferent(listener));

    this.destructors.push(destructor);

    return destructor;
  }

  /**
   * Stops every reactive listener registered through this player view.
   *
   * Call this when retaining a player outside the hoster's player store;
   * store-level aggregate listeners manage their own per-player cleanup.
   */
  destroy() {
    this.destructors.forEach((destructor) => destructor());
  }

  /**
   * Observes later changes to {@link ready}.
   *
   * The current value is not emitted when subscribing.
   *
   * @param listener Called when the ready value changes.
   * @returns A disposer that stops this listener.
   */
  addReadyListener(listener: (ready: boolean) => void) {
    return this.addListenerHelper(() => this.ready, listener);
  }

  /**
   * Observes later changes to {@link active}.
   *
   * The current value is not emitted when subscribing.
   *
   * @param listener Called when the active value changes.
   * @returns A disposer that stops this listener.
   */
  addActiveListener(listener: (active: boolean) => void) {
    return this.addListenerHelper(() => this.active, listener);
  }

  /**
   * Observes later changes to {@link hasConnection}.
   *
   * The current value is not emitted when subscribing.
   *
   * @param listener Called when connection availability changes.
   * @returns A disposer that stops this listener.
   */
  addConnectionListener(listener: (hasConnection: boolean) => void) {
    return this.addListenerHelper(() => this.hasConnection, listener);
  }

  /**
   * Observes later changes to {@link isHost}.
   *
   * The current value is not emitted when subscribing.
   *
   * @param listener Called when host ownership changes.
   * @returns A disposer that stops this listener.
   */
  addHostListener(listener: (isHost: boolean) => void) {
    return this.addListenerHelper(() => this.isHost, listener);
  }

  /**
   * Observes later changes to {@link screenName}.
   *
   * The current value is not emitted when subscribing.
   *
   * @param listener Called when the player's display name changes.
   * @returns A disposer that stops this listener.
   */
  addScreenNameListener(listener: (screenName: string | null) => void) {
    return this.addListenerHelper(() => this.screenName, listener);
  }

  /**
   * Observes later changes to {@link image}.
   *
   * The current value is not emitted when subscribing.
   *
   * @param listener Called when the player's image changes.
   * @returns A disposer that stops this listener.
   */
  addImageListener(listener: (image: string | null) => void) {
    return this.addListenerHelper(() => this.image, listener);
  }
}

function callIfDifferent<T>(callback: (value: T) => void) {
  return (value: T, prevValue: T) => {
    if (value !== prevValue) {
      callback(value);
    }
  };
}
