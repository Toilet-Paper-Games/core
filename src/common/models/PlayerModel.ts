import { makeAutoObservable } from 'mobx';

export class PlayerModel {
  screenName: string | null;
  image = '';
  score = 0;
  active = true;

  constructor(screenName: string | null) {
    makeAutoObservable(this);
    this.screenName = screenName;
  }
}
