import { makeAutoObservable, reaction } from 'mobx';

import { GameDataDefinition } from '@/common/CommunicationDataTransfers';
import { EventEmitter } from '@/common/models/EventEmitter.skip-barrel';
import { PlayerDto, PlayerModel } from '@/common/models/PlayerModel';

import { HosterCommunicator } from './HosterCommunicator';
import { SmartPlayerModel } from './SmartPlayerModel';
export class PlayerStore<TGameData extends GameDataDefinition> {
  playerMap: Map<string, SmartPlayerModel<TGameData>> = new Map();

  get players() {
    return Array.from(this.playerMap.values());
  }

  private joinEmitter = new EventEmitter<SmartPlayerModel<TGameData>>();
  private kickedEmitter = new EventEmitter<SmartPlayerModel<TGameData>>();

  constructor(private hosterCommunicator: HosterCommunicator<TGameData>) {
    makeAutoObservable(this, {}, { autoBind: true });

    reaction(
      () => Array.from(this.playerMap.keys()),
      (connectionIds, prevConnectionIds) => {
        const addedPlayers = connectionIds.filter(
          (id) => !prevConnectionIds.includes(id),
        );
        const removedPlayers = prevConnectionIds.filter(
          (id) => !connectionIds.includes(id),
        );

        addedPlayers.forEach((id) => {
          const player = this.playerMap.get(id);
          if (player) this.joinEmitter.emit(player);
        });

        removedPlayers.forEach((id) => {
          const player = this.playerMap.get(id);
          if (player) this.kickedEmitter.emit(player);
        });
      },
    );
  }

  smartUpdatePlayers(dtos: PlayerDto[]) {
    const newConnectionIds = new Set(dtos.map((dto) => dto.connectionId));

    dtos.forEach((dto) => {
      const existingPlayer = this.playerMap.get(dto.connectionId);
      if (existingPlayer) {
        Object.assign(existingPlayer, dto);
      } else {
        this.playerMap.set(
          dto.connectionId,
          new SmartPlayerModel(this.hosterCommunicator, PlayerModel.fromDto(dto)),
        );
      }
    });

    this.playerMap.forEach((_, connectionId) => {
      if (!newConnectionIds.has(connectionId)) {
        this.playerMap.delete(connectionId);
      }
    });
  }

  addPlayerJoinListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
    return this.joinEmitter.addListener(callback);
  }

  addPlayerKickedListener(callback: (player: SmartPlayerModel<TGameData>) => void) {
    return this.kickedEmitter.addListener(callback);
  }

  addPlayerReadyListener(
    callback: (player: SmartPlayerModel<TGameData>, ready: boolean) => void,
  ) {
    return this.addPlayerEventListener(
      (player, cb) => player.addReadyListener(cb),
      callback,
    );
  }

  addPlayerActiveListener(
    callback: (player: SmartPlayerModel<TGameData>, active: boolean) => void,
  ) {
    return this.addPlayerEventListener(
      (player, cb) => player.addActiveListener(cb),
      callback,
    );
  }

  addPlayerHostListener(
    callback: (player: SmartPlayerModel<TGameData>, isHost: boolean) => void,
  ) {
    return this.addPlayerEventListener(
      (player, cb) => player.addHostListener(cb),
      callback,
    );
  }

  addPlayerConnectionListener(
    callback: (player: SmartPlayerModel<TGameData>, hasConnection: boolean) => void,
  ) {
    return this.addPlayerEventListener(
      (player, cb) => player.addConnectionListener(cb),
      callback,
    );
  }

  addPlayerImageListener(
    callback: (player: SmartPlayerModel<TGameData>, image: string | null) => void,
  ) {
    return this.addPlayerEventListener(
      (player, cb) => player.addImageListener(cb),
      callback,
    );
  }

  addPlayerScreenNameListener(
    callback: (player: SmartPlayerModel<TGameData>, screenName: string | null) => void,
  ) {
    return this.addPlayerEventListener(
      (player, cb) => player.addScreenNameListener(cb),
      callback,
    );
  }

  private addPlayerEventListener<T>(
    playerListenerMethod: (
      player: SmartPlayerModel<TGameData>,
      callback: (value: T) => void,
    ) => () => void,
    callback: (player: SmartPlayerModel<TGameData>, value: T) => void,
  ) {
    const playerListenerMap = new Map<SmartPlayerModel<TGameData>, () => void>(); // Track destructors for each player

    const joinDestructor = this.addPlayerJoinListener((player) => {
      const destructor = playerListenerMethod(player, (value: T) =>
        callback(player, value),
      );
      playerListenerMap.set(player, destructor);
    });

    const kickedDestructor = this.addPlayerKickedListener((player) => {
      const destructor = playerListenerMap.get(player);
      if (destructor) {
        destructor();
        playerListenerMap.delete(player);
      }
    });

    return {
      destroy: () => {
        joinDestructor.destroy();
        kickedDestructor.destroy();
        playerListenerMap.forEach((destructor) => destructor());
        playerListenerMap.clear();
      },
    };
  }
}
