import { makeAutoObservable, reaction } from 'mobx';

import { GameDataDefinition } from '@/common/CommunicationDataTransfers';
import { PlayerDto, PlayerModel } from '@/common/models/PlayerModel';

import { HosterCommunicator } from './HosterCommunicator';
import { SmartPlayerModel } from './SmartPlayerModel';

export class PlayerStore<TGameData extends GameDataDefinition> {
  playerMap: Map<string, SmartPlayerModel<TGameData>> = new Map();

  get players() {
    return Array.from(this.playerMap.values());
  }

  // Arrays to store event listeners
  private joinListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private readyListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private unreadyListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private kickedListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private activeListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private inactiveListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private connectedListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];
  private disconnectedListeners: ((player: SmartPlayerModel<TGameData>) => void)[] = [];

  constructor(private hosterCommunicator: HosterCommunicator<TGameData>) {
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
        if (readyStates.length !== prevReadyStates.length) return;

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
        if (unreadyStates.length !== prevUnreadyStates.length) return;

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
        if (activeStates.length !== prevActiveStates.length) return;

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
        if (inactiveStates.length !== prevInactiveStates.length) return;

        inactiveStates.forEach((isInactive, index) => {
          if (isInactive && !prevInactiveStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerInactive(player); // Trigger inactive listener when a player becomes inactive
          }
        });
      },
    );

    // Reaction: Detect when a player gains connection
    reaction(
      () => Array.from(this.playerMap.values()).map((player) => player.hasConnection), // Track "hasConnection" state of all players
      (connectionStates, prevConnectionStates) => {
        if (connectionStates.length !== prevConnectionStates.length) return;

        connectionStates.forEach((hasConnection, index) => {
          if (hasConnection && !prevConnectionStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerConnected(player); // Trigger connected listener when a player gains connection
          }
        });
      },
    );

    // Reaction: Detect when a player loses connection
    reaction(
      () => Array.from(this.playerMap.values()).map((player) => !player.hasConnection), // Track "hasConnection" state of all players
      (disconnectionStates, prevDisconnectionStates) => {
        if (disconnectionStates.length !== prevDisconnectionStates.length) return;

        disconnectionStates.forEach((hasDisconnected, index) => {
          if (hasDisconnected && !prevDisconnectionStates[index]) {
            const player = Array.from(this.playerMap.values())[index];
            this.triggerDisconnected(player); // Trigger disconnected listener when a player loses connection
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
          new SmartPlayerModel(this.hosterCommunicator, PlayerModel.fromDto(dto)),
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
  addPlayerJoinListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
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
  addPlayerReadyListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
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
  addPlayerUnreadyListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
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
  addPlayerKickedListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
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
  addPlayerActiveListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
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
  addPlayerInactiveListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
    this.inactiveListeners.push(callback);
    return {
      destroy: () => {
        this.inactiveListeners = this.inactiveListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player is connected
   * Ex. For when you want to display if a player has gained connection
   */
  addPlayerConnectedListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
    this.connectedListeners.push(callback);
    return {
      destroy: () => {
        this.connectedListeners = this.connectedListeners.filter((cb) => cb !== callback);
      },
    };
  }

  /** Add listener for when a player's connection is lost
   * Ex. For when you want to display if a player has lost connection
   */
  addPlayerDisconnectedListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
    this.disconnectedListeners.push(callback);
    return {
      destroy: () => {
        this.disconnectedListeners = this.disconnectedListeners.filter(
          (cb) => cb !== callback,
        );
      },
    };
  }

  // Trigger methods for each event type
  private triggerJoin(player: SmartPlayerModel<TGameData>) {
    this.joinListeners.forEach((callback) => callback(player));
  }

  private triggerKick(player: SmartPlayerModel<TGameData>) {
    this.kickedListeners.forEach((callback) => callback(player));
  }

  private triggerReady(player: SmartPlayerModel<TGameData>) {
    this.readyListeners.forEach((callback) => callback(player));
  }

  private triggerUnready(player: SmartPlayerModel<TGameData>) {
    this.unreadyListeners.forEach((callback) => callback(player));
  }

  private triggerActive(player: SmartPlayerModel<TGameData>) {
    this.activeListeners.forEach((callback) => callback(player));
  }

  private triggerInactive(player: SmartPlayerModel<TGameData>) {
    this.inactiveListeners.forEach((callback) => callback(player));
  }

  private triggerConnected(player: SmartPlayerModel<TGameData>) {
    this.connectedListeners.forEach((callback) => callback(player));
  }

  private triggerDisconnected(player: SmartPlayerModel<TGameData>) {
    this.disconnectedListeners.forEach((callback) => callback(player));
  }
}
