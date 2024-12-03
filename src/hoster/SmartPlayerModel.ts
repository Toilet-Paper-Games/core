import { GameDataDefinition } from '@/common/CommunicationDataTransfers';

import { PlayerModel } from '../common/models/PlayerModel';
import { HosterCommunicator } from './HosterCommunicator';

export class SmartPlayerModel<TGameData extends GameDataDefinition> {
  constructor(
    private hosterCommunicator: HosterCommunicator<TGameData>,
    private playerModel: PlayerModel,
  ) {}

  private get playerStore() {
    return this.hosterCommunicator.playerStore;
  }

  get screenName() {
    return this.playerModel.screenName;
  }

  get connectionId() {
    return this.playerModel.connectionId;
  }

  get image() {
    return this.playerModel.image;
  }

  get ready() {
    return this.playerModel.ready;
  }

  get active() {
    return this.playerModel.active;
  }

  get isHost() {
    return this.playerModel.isHost;
  }

  get subscription() {
    return this.playerModel.subscription;
  }

  get dto() {
    return this.playerModel.dto;
  }

  sendMessage(data: TGameData['HosterToController']) {
    return this.hosterCommunicator.sendGameMessage(data, this.connectionId);
  }

  async waitForReady(abortSignal?: AbortSignal): Promise<void> {
    return this.playerModel.waitForReady(abortSignal);
  }

  // Listener registration methods
  /** Add listener for when a player joins
   * Ex. For when you want to display joined players in a list
   */
  addPlayerJoinListener(callback: () => void) {
    return this.playerStore.addPlayerJoinListener((player) => {
      if (player.connectionId === this.connectionId) {
        callback();
      }
    });
  }

  /** Add listener for when a player is ready to receive messages
   * Ex. For when you want to start the game when all players are ready
   * Ex. For when you want to send an initial message to a player
   */
  addPlayerReadyListener(callback: () => void) {
    return this.playerStore.addPlayerReadyListener((player) => {
      if (player.connectionId === this.connectionId) {
        callback();
      }
    });
  }

  /** Add listener for when a player is unready
   * Ex. For when you want to stop the game when a player is unready
   */
  addPlayerUnreadyListener(callback: () => void) {
    return this.playerStore.addPlayerUnreadyListener((player) => {
      if (player.connectionId === this.connectionId) {
        callback();
      }
    });
  }

  /** Add listener for when a player is kicked
   * Ex. For when you want to delete player data when a player is kicked
   */
  addPlayerKickedListener(callback: () => void) {
    return this.playerStore.addPlayerKickedListener((player) => {
      if (player.connectionId === this.connectionId) {
        callback();
      }
    });
  }

  /** Add listener for when a player is active
   * Ex. For when you want to display if a player is actively connected
   */
  addPlayerActiveListener(callback: () => void) {
    return this.playerStore.addPlayerActiveListener((player) => {
      if (player.connectionId === this.connectionId) {
        callback();
      }
    });
  }

  /** Add listener for when a player is inactive
   * Ex. For when you want to display if a player is actively connected
   */
  addPlayerInactiveListener(callback: () => void) {
    return this.playerStore.addPlayerInactiveListener((player) => {
      if (player.connectionId === this.connectionId) {
        callback();
      }
    });
  }
}
