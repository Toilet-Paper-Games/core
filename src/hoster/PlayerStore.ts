import { makeAutoObservable, reaction } from 'mobx';

import { PlayerDto, PlayerModel } from '@/common/models/PlayerModel';

export class PlayerStore {
  playerMap: Map<string, PlayerModel> = new Map();

  get players() {
    return Array.from(this.playerMap.values());
  }

  // Arrays to store event listeners
  private joinListeners: ((player: PlayerModel) => void)[] = [];
  private readyListeners: ((player: PlayerModel) => void)[] = [];
  private leaveListeners: ((player: PlayerModel) => void)[] = [];
  private activeListeners: ((player: PlayerModel) => void)[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });

    // Reaction: Detect when a player is added (join) or removed (leave)
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

        // Trigger leave listeners
        removedPlayers.forEach((id) => {
          const player = this.playerMap.get(id);
          if (player) this.triggerLeave(player);
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
  }

  smartUpdatePlayers(dtos: PlayerDto[]) {
    const newConnectionIds = new Set(dtos.map((dto) => dto.connectionId));

    dtos.forEach((dto) => {
      const existingPlayer = this.playerMap.get(dto.connectionId);
      if (existingPlayer) {
        // NOTE: this is does not handle deep merging
        Object.assign(existingPlayer, dto);
      } else {
        this.playerMap.set(dto.connectionId, PlayerModel.fromDto(dto));
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
  addPlayerJoinListener(callback: (player: PlayerModel) => void) {
    this.joinListeners.push(callback);
    return {
      destroy: () => {
        this.joinListeners = this.joinListeners.filter((cb) => cb !== callback);
      },
    };
  }

  addPlayerReadyListener(callback: (player: PlayerModel) => void) {
    this.readyListeners.push(callback);
    return {
      destroy: () => {
        this.readyListeners = this.readyListeners.filter((cb) => cb !== callback);
      },
    };
  }

  addPlayerLeaveListener(callback: (player: PlayerModel) => void) {
    this.leaveListeners.push(callback);
    return {
      destroy: () => {
        this.leaveListeners = this.leaveListeners.filter((cb) => cb !== callback);
      },
    };
  }

  addPlayerActiveListener(callback: (player: PlayerModel) => void) {
    this.activeListeners.push(callback);
    return {
      destroy: () => {
        this.activeListeners = this.activeListeners.filter((cb) => cb !== callback);
      },
    };
  }

  // Trigger methods for each event type
  private triggerJoin(player: PlayerModel) {
    this.joinListeners.forEach((callback) => callback(player));
  }

  private triggerLeave(player: PlayerModel) {
    this.leaveListeners.forEach((callback) => callback(player));
  }

  private triggerReady(player: PlayerModel) {
    this.readyListeners.forEach((callback) => callback(player));
  }

  private triggerActive(player: PlayerModel) {
    this.activeListeners.forEach((callback) => callback(player));
  }
}
