import { makeAutoObservable, reaction } from 'mobx';

import { PlayerDto, PlayerModel } from '@/common/models/PlayerModel';

import { SmartPlayerModel } from './SmartPlayerModel';

export class PlayerStore {
  playerMap: Map<string, SmartPlayerModel> = new Map();

  get players() {
    return Array.from(this.playerMap.values());
  }

  // Arrays to store event listeners
  private joinListeners: ((player: SmartPlayerModel) => void)[] = [];
  private readyListeners: ((player: SmartPlayerModel) => void)[] = [];
  private unreadyListeners: ((player: SmartPlayerModel) => void)[] = [];
  private kickedListeners: ((player: SmartPlayerModel) => void)[] = [];
  private activeListeners: ((player: SmartPlayerModel) => void)[] = [];
  private inactiveListeners: ((player: SmartPlayerModel) => void)[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    // Reaction: Detect when a player is added (join) or removed (kick)
    reaction(
      () => Array.from(this.playerMap.keys()), // Track connectionIds in the players map
      (connectionIds, prevConnectionIds) => {
        const addedPlayers = connectionIds.filter(
          (id) => !prevConnectionIds.includes(id),
        );
        const removedPlayers = prevConnectionIds.filter(
          (id) => !connectionIds.includes(id),
        );

        // Trigger join listeners
        addedPlayers.forEach((id) => {
          const player = this.playerMap.get(id);
          if (player) this.triggerJoin(player);
        });

        // Trigger kick listeners
        removedPlayers.forEach((id) => {
          const player = this.playerMap.get(id);
          if (player) this.triggerKick(player);
        });
      },
    );

    // Reaction: Detect when a player becomes "ready"
    reaction(
      () => Array.from(this.playerMap.values()).map((player) => player.ready), // Track "ready" state of all players
      (readyStates, prevReadyStates) => {
        readyStates.forEach((isReady, index) => {
          if (isReady && !prevReadyStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerReady(player); // Trigger ready listener when a player becomes ready
          }
        });
      },
    );

    // Reaction: Detect when a player becomes "unready"
    reaction(
      () => Array.from(this.playerMap.values()).map((player) => !player.ready), // Track "ready" state of all players
      (unreadyStates, prevUnreadyStates) => {
        unreadyStates.forEach((isUnready, index) => {
          if (isUnready && !prevUnreadyStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerUnready(player); // Trigger kick listener when a player becomes unready
          }
        });
      },
    );

    // Reaction: Detect when a player becomes "active"
    reaction(
      () => Array.from(this.playerMap.values()).map((player) => player.active), // Track "active" state of all players
      (activeStates, prevActiveStates) => {
        activeStates.forEach((isActive, index) => {
          if (isActive && !prevActiveStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerActive(player); // Trigger active listener when a player becomes active
          }
        });
      },
    );

    // Reaction: Detect when a player becomes "inactive"
    reaction(
      () => Array.from(this.playerMap.values()).map((player) => !player.active), // Track "active" state of all players
      (inactiveStates, prevInactiveStates) => {
        inactiveStates.forEach((isInactive, index) => {
          if (isInactive && !prevInactiveStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerInactive(player); // Trigger inactive listener when a player becomes inactive
          }
        });
      },
    );
  }

  /** For internal usage only */
  smartUpdatePlayers(dtos: PlayerDto[]) {
    const newConnectionIds = new Set(dtos.map((dto) => dto.connectionId));

    dtos.forEach((dto) => {
      const existingPlayer = this.playerMap.get(dto.connectionId);
      if (existingPlayer) {
        // NOTE: this is does not handle deep merging
        Object.assign(existingPlayer, dto);
      } else {
        this.playerMap.set(
          dto.connectionId,
          new SmartPlayerModel(this, PlayerModel.fromDto(dto)),
        );
      }
    });

    // Remove missing players
    this.playerMap.forEach((_, connectionId) => {
      if (!newConnectionIds.has(connectionId)) {
        this.playerMap.delete(connectionId);
      }
    });
  }

  // Listener registration methods
  /** Add listener for when a player joins
   * Ex. For when you want to display joined players in a list
   */
  addPlayerJoinListener(callback: (player: SmartPlayerModel) => void) {
    this.joinListeners.push(callback);
    return {
      destroy: () => {
        this.joinListeners = this.joinListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player is ready to receive messages
   * Ex. For when you want to start the game when all players are ready
   * Ex. For when you want to send an initial message to a player
   */
  addPlayerReadyListener(callback: (player: SmartPlayerModel) => void) {
    this.readyListeners.push(callback);
    return {
      destroy: () => {
        this.readyListeners = this.readyListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player is unready
   * Ex. For when you want to stop the game when a player is unready
   */
  addPlayerUnreadyListener(callback: (player: SmartPlayerModel) => void) {
    this.unreadyListeners.push(callback);
    return {
      destroy: () => {
        this.unreadyListeners = this.unreadyListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player is kicked
   * Ex. For when you want to delete player data when a player is kicked
   */
  addPlayerKickedListener(callback: (player: SmartPlayerModel) => void) {
    this.kickedListeners.push(callback);
    return {
      destroy: () => {
        this.kickedListeners = this.kickedListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player is active
   * Ex. For when you want to display if a player is actively connected
   */
  addPlayerActiveListener(callback: (player: SmartPlayerModel) => void) {
    this.activeListeners.push(callback);
    return {
      destroy: () => {
        this.activeListeners = this.activeListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player is inactive
   * Ex. For when you want to display if a player is actively connected
   */
  addPlayerInactiveListener(callback: (player: SmartPlayerModel) => void) {
    this.inactiveListeners.push(callback);
    return {
      destroy: () => {
        this.inactiveListeners = this.inactiveListeners.filter((cb) => cb !== callback);
      },
    };
  }

  // Trigger methods for each event type
  private triggerJoin(player: SmartPlayerModel) {
    this.joinListeners.forEach((callback) => callback(player));
  }

  private triggerKick(player: SmartPlayerModel) {
    this.kickedListeners.forEach((callback) => callback(player));
  }

  private triggerReady(player: SmartPlayerModel) {
    this.readyListeners.forEach((callback) => callback(player));
  }

  private triggerUnready(player: SmartPlayerModel) {
    this.unreadyListeners.forEach((callback) => callback(player));
  }

  private triggerActive(player: SmartPlayerModel) {
    this.activeListeners.forEach((callback) => callback(player));
  }

  private triggerInactive(player: SmartPlayerModel) {
    this.inactiveListeners.forEach((callback) => callback(player));
  }
}
