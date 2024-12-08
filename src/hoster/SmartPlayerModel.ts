import { reaction } from 'mobx';

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

  get hasConnection() {
    return this.playerModel.hasConnection;
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

  private addListenerHelper<T>(selector: () => T, listener: (value: T) => void) {
    return reaction(selector, callIfDifferent(listener));
  }

  addReadyListener(listener: (ready: boolean) => void) {
    return this.addListenerHelper(() => this.ready, listener);
  }

  addActiveListener(listener: (active: boolean) => void) {
    return this.addListenerHelper(() => this.active, listener);
  }

  addConnectionListener(listener: (hasConnection: boolean) => void) {
    return this.addListenerHelper(() => this.hasConnection, listener);
  }

  addHostListener(listener: (isHost: boolean) => void) {
    return this.addListenerHelper(() => this.isHost, listener);
  }

  addScreenNameListener(listener: (screenName: string | null) => void) {
    return this.addListenerHelper(() => this.screenName, listener);
  }

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
