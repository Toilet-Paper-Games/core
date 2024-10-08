import { makeAutoObservable, when } from 'mobx';

import { Subscription } from '../types';

/**
 * Represents a player in the game.
 */
export class PlayerModel {
  screenName: string | null;
  /** String ID connecting the player to their connection */
  readonly connectionId: string;

  image: string | null = null;

  /** For when your controller is ready to play the game */
  ready = false;

  /** True is the user is actively playing and not disconnected */
  active = true;

  isHost = false;

  subscription: Subscription = Subscription.Free;

  static fromDto(dto: PlayerDto): PlayerModel {
    const player = new PlayerModel(dto.screenName, dto.connectionId);
    player.image = dto.image;
    player.ready = dto.ready;
    player.active = dto.active;
    player.isHost = dto.isHost;
    player.subscription = dto.subscription;
    return player;
  }

  /**
   * Creates a new instance of the PlayerModel class.
   * @param screenName - The screen name of the player.
   */
  constructor(screenName: string | null, connectionId: string) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.screenName = screenName;
    this.connectionId = connectionId;
  }

  async waitForReady(abortSignal?: AbortSignal): Promise<void> {
    return when(() => this.ready, {
      name: `Wait for ${this.connectionId}|${this.screenName} to be ready`,
      signal: abortSignal,
    });
  }

  get dto(): PlayerDto {
    return {
      screenName: this.screenName,
      connectionId: this.connectionId,
      image: this.image,
      ready: this.ready,
      active: this.active,
      isHost: this.isHost,
      subscription: this.subscription,
    };
  }
}

export interface PlayerDto {
  screenName: string | null;
  connectionId: string;
  image: string | null;
  ready: boolean;
  active: boolean;
  isHost: boolean;
  subscription: Subscription;
}
