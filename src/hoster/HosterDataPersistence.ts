import { makeAutoObservable } from 'mobx';

import { CommunicationDataType } from '@/common/CommunicationDataTransfers';

import { HosterCommunicator } from './HosterCommunicator';

export enum MaturityLevel {
  Everyone = 'Everyone',
  Teen = 'Teen',
  Mature = 'Mature',
}

export interface HosterGlobalSettings {
  soundFxVolume: number;
  musicVolume: number;
  narrationVolume: number;

  maturityLevel: MaturityLevel;
}

export class HosterDataPersistence {
  /** global settings, null value until loaded */
  globalSettings: HosterGlobalSettings | null = null;

  /** game storage, null value until loaded */
  gameStorage: Record<string, string | undefined> | null = null;

  constructor(private hosterCommunicator: HosterCommunicator) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setGlobalSetting<T extends keyof HosterGlobalSettings>(
    key: T,
    value: HosterGlobalSettings[T],
  ): Promise<void> {
    this.hosterCommunicator.sendAppMessage({
      type: CommunicationDataType.SET_GLOBAL_SETTING_HOSTER_G2P,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- this is safe
      data: { key, value } as any,
    });

    const { promise, resolve } = Promise.withResolvers<void>();

    const listener = this.hosterCommunicator.addAppMessageListener((message) => {
      if (message.type !== CommunicationDataType.UPDATED_GLOBAL_SETTING_HOSTER_P2G)
        return;

      if (message.data.key !== key) return;

      resolve();
      listener.destroy();
    });

    return promise;
  }

  setGameStorage(key: string, value: string | undefined): Promise<void> {
    this.hosterCommunicator.sendAppMessage({
      type: CommunicationDataType.SET_GAME_STORAGE_HOSTER_G2P,
      data: { key, value },
    });

    const { promise, resolve } = Promise.withResolvers<void>();

    const listener = this.hosterCommunicator.addAppMessageListener((message) => {
      if (message.type !== CommunicationDataType.UPDATED_GAME_STORAGE_HOSTER_P2G) return;

      if (message.data.key !== key) return;

      resolve();
      listener.destroy();
    });

    return promise;
  }
}
