import { makeAutoObservable } from 'mobx';

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
  active = true;

  isHost = false;

  subscription: Subscription = Subscription.Free;

  /**
   * Creates a new instance of the PlayerModel class.
   * @param screenName - The screen name of the player.
   */
  constructor(screenName: string | null, connectionId: string) {
    makeAutoObservable(this);
    this.screenName = screenName;
    this.connectionId = connectionId;
  }
}
