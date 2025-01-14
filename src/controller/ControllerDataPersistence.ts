import { makeAutoObservable } from 'mobx';

import {
  CommunicationDataType,
  GameDataDefinition,
} from '@/common/CommunicationDataTransfers';

import { ControllerCommunicator } from './ControllerCommunicator';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ControllerGlobalSettings {
  soundFxVolume: number;
}

export class ControllerDataPersistence<TGameData extends GameDataDefinition> {
  /** global settings, null value until loaded */
  globalSettings: ControllerGlobalSettings | null = null;

  /** game storage, null value until loaded */
  gameStorage: Record<string, string | undefined> | null = null;

  constructor(private controllerCommunicator: ControllerCommunicator<TGameData>) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setGlobalSetting<T extends keyof ControllerGlobalSettings>(
    key: T,
    value: ControllerGlobalSettings[T],
  ): Promise<void> {
    this.controllerCommunicator.sendAppMessage({
      type: CommunicationDataType.SET_GLOBAL_SETTING_CONTROLLER_G2P,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is safe
      data: { key, value } as any,
    });

    const { promise, resolve } = Promise.withResolvers<void>();

    const listener = this.controllerCommunicator.addAppMessageListener((message) => {
      if (message.type !== CommunicationDataType.UPDATED_GLOBAL_SETTING_CONTROLLER_P2G)
        return;

      if (message.data.key !== key) return;

      resolve();
      listener.destroy();
    });

    return promise;
  }

  setGameStorage(key: string, value: string | undefined): Promise<void> {
    this.controllerCommunicator.sendAppMessage({
      type: CommunicationDataType.SET_GAME_STORAGE_CONTROLLER_G2P,
      data: { key, value },
    });

    const { promise, resolve } = Promise.withResolvers<void>();

    const listener = this.controllerCommunicator.addAppMessageListener((message) => {
      if (message.type !== CommunicationDataType.UPDATED_GAME_STORAGE_CONTROLLER_P2G)
        return;

      if (message.data.key !== key) return;

      resolve();
      listener.destroy();
    });

    return promise;
  }
}
