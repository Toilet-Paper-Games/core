/* eslint-disable @typescript-eslint/ban-types */
// TODO: need to be split between hoster and controller

import { ControllerGlobalSettings } from '@/controller/ControllerDataPersistence';
import { HosterGlobalSettings } from '@/hoster/HosterDataPersistence';

import { PlayerDto } from './models/PlayerModel';

export interface GameDataDefinition<C2H = unknown, H2C = unknown> {
  ControllerToHoster: C2H;
  HosterToController: H2C;
}

// G2P = Game to Platform
// P2G = Platform to Game

export enum CommunicationDataType {
  DEBUG = 'DEBUG',

  AppData_HOSTER = 'AppData_HOSTER',
  AppData_CONTROLLER = 'AppData_CONTROLLER',

  INIT_GAME_HOSTER = 'INIT_GAME_HOSTER',
  INIT_GAME_CONTROLLER = 'INIT_GAME_CONTROLLER',

  READY_STATUS_HOSTER = 'READY_STATUS_HOSTER',
  READY_STATUS_CONTROLLER = 'READY_STATUS_CONTROLLER',

  PING_HOSTER = 'PING_HOSTER',
  PONG_CONTROLLER = 'PONG_CONTROLLER',
  PONG_HOSTER = 'PONG_HOSTER',

  GAME_ACTION_HOSTER = 'GAME_ACTION_HOSTER',
  GAME_ACTION_CONTROLLER = 'GAME_ACTION_CONTROLLER',
  GAME_ACTION_RESPONSE_HOSTER = 'GAME_ACTION_RESPONSE_HOSTER',
  GAME_ACTION_RESPONSE_CONTROLLER = 'GAME_ACTION_RESPONSE_CONTROLLER',

  END_GAME_HOSTER = 'END_GAME_HOSTER',
  END_GAME_CONTROLLER = 'END_GAME_CONTROLLER',
  RELOAD_GAME_HOSTER = 'RELOAD_GAME_HOSTER',
  RELOAD_GAME_CONTROLLER = 'RELOAD_GAME_CONTROLLER',

  SET_GLOBAL_SETTING_HOSTER_G2P = 'SET_GLOBAL_SETTING_HOSTER_G2P',
  SET_GLOBAL_SETTING_CONTROLLER_G2P = 'SET_GLOBAL_SETTING_CONTROLLER_G2P',

  SET_GAME_STORAGE_HOSTER_G2P = 'SET_GAME_STORAGE_HOSTER_G2P',
  SET_GAME_STORAGE_CONTROLLER_G2P = 'SET_GAME_STORAGE_CONTROLLER_G2P',

  UPDATED_GLOBAL_SETTING_HOSTER_P2G = 'UPDATED_GLOBAL_SETTING_HOSTER_P2G',
  UPDATED_GLOBAL_SETTING_CONTROLLER_P2G = 'UPDATED_GLOBAL_SETTING_CONTROLLER_P2G',

  UPDATED_GAME_STORAGE_HOSTER_P2G = 'UPDATED_GAME_STORAGE_HOSTER_P2G',
  UPDATED_GAME_STORAGE_CONTROLLER_P2G = 'UPDATED_GAME_STORAGE_CONTROLLER_P2G',
}

export interface CommunicationDataTransfersStructure {
  type: CommunicationDataType;
  data: unknown;
}

// App messages

export interface LogTransfer extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.DEBUG;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

/** Sent at the initialization of a hoster communicator and anytime a value is changed */
export interface AppDataTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.AppData_HOSTER;
  data: {
    connectionId: string;
    players: PlayerDto[];
    joinUrl: string;
    joinCode: string;
    devMode: boolean;
    lobbyGame: boolean;
    globalSettings: HosterGlobalSettings | null;
    gameStorage: Record<string, string | undefined> | null;
  };
}

/** Sent at the initialization of a controller communicator and anytime a value is changed */
export interface AppDataTransfer_CONTROLLER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.AppData_CONTROLLER;
  data: {
    hosterReady: boolean;
    connectionId: string;
    joinUrl: string;
    joinCode: string;
    devMode: boolean;
    lobbyGame: boolean;
    globalSettings: ControllerGlobalSettings | null;
    gameStorage: Record<string, string | undefined> | null;
  };
}

/** This message will be sent as soon as the communicator in constructed */
export interface InitGameTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.INIT_GAME_HOSTER;
  data: {
    coreVersion: string;
  };
}

/** This message will be sent as soon as the communicator in constructed */
export interface InitGameTransfer_CONTROLLER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.INIT_GAME_CONTROLLER;
  data: {
    coreVersion: string;
  };
}

export interface ReadyStatusTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.READY_STATUS_HOSTER;
  data: {
    ready: boolean;
  };
}

export interface ReadyStatusTransfer_CONTROLLER
  extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.READY_STATUS_CONTROLLER;
  data: {
    ready: boolean;
  };
}

export interface PingTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.PING_HOSTER;
  data: {
    id: string;
    playerId: string;
    timeSinceStart: number;
    hosterTime: number;
  };
}

export interface PongTransfer_CONTROLLER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.PONG_CONTROLLER;
  data: {
    id: string;
    playerId: string;
    controllerTime: number;
  };
}

export interface PongTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.PONG_HOSTER;
  data: {
    id: string;
    playerId: string;
    pingMs: number;
    timeSinceStart: number;
    hosterTime: number;
  };
}

// Game messages

export interface GameActionTransfer_HOSTER<T extends GameDataDefinition>
  extends Omit<CommunicationDataTransfersStructure, 'type'> {
  type: CommunicationDataType.GAME_ACTION_HOSTER;
  data: {
    to: string;
    payload: T['HosterToController'];
  };
}

export interface GameActionTransfer_CONTROLLER<T extends GameDataDefinition>
  extends Omit<CommunicationDataTransfersStructure, 'type'> {
  type: CommunicationDataType.GAME_ACTION_CONTROLLER;
  data: {
    payload: T['ControllerToHoster'];
  };
}

export interface GameActionResponseTransfer_HOSTER<T extends GameDataDefinition>
  extends Omit<CommunicationDataTransfersStructure, 'type'> {
  type: CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER;
  data: {
    from: string;
    payload: T['ControllerToHoster'];
  };
}

export interface GameActionResponseTransfer_CONTROLLER<T extends GameDataDefinition>
  extends Omit<CommunicationDataTransfersStructure, 'type'> {
  type: CommunicationDataType.GAME_ACTION_RESPONSE_CONTROLLER;
  data: {
    payload: T['HosterToController'];
  };
}

export interface EndGame_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.END_GAME_HOSTER;
  data: {};
}

export interface EndGame_CONTROLLER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.END_GAME_CONTROLLER;
  data: {};
}

export interface ReloadGame_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.RELOAD_GAME_HOSTER;
  data: {};
}

export interface ReloadGame_CONTROLLER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.RELOAD_GAME_CONTROLLER;
  data: {};
}

export type SetGlobalSettingTransfer_HOSTER = {
  [K in keyof HosterGlobalSettings]: {
    type: CommunicationDataType.SET_GLOBAL_SETTING_HOSTER_G2P;
    data: {
      key: K;
      value: HosterGlobalSettings[K];
    };
  };
}[keyof HosterGlobalSettings];

export type SetGlobalSettingTransfer_CONTROLLER = {
  [K in keyof ControllerGlobalSettings]: {
    type: CommunicationDataType.SET_GLOBAL_SETTING_CONTROLLER_G2P;
    data: {
      key: K;
      value: ControllerGlobalSettings[K];
    };
  };
}[keyof ControllerGlobalSettings];

export interface SetGameSettingTransfer_HOSTER
  extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.SET_GAME_STORAGE_HOSTER_G2P;
  data: {
    key: string;
    value: string | undefined;
  };
}

export interface SetGameSettingTransfer_CONTROLLER
  extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.SET_GAME_STORAGE_CONTROLLER_G2P;
  data: {
    key: string;
    value: string | undefined;
  };
}

export type UpdatedGlobalSettingTransfer_HOSTER = {
  [K in keyof HosterGlobalSettings]: {
    type: CommunicationDataType.UPDATED_GLOBAL_SETTING_HOSTER_P2G;
    data: {
      key: K;
      value: HosterGlobalSettings[K];
    };
  };
}[keyof HosterGlobalSettings];

export type UpdatedGlobalSettingTransfer_CONTROLLER = {
  [K in keyof ControllerGlobalSettings]: {
    type: CommunicationDataType.UPDATED_GLOBAL_SETTING_CONTROLLER_P2G;
    data: {
      key: K;
      value: ControllerGlobalSettings[K];
    };
  };
}[keyof ControllerGlobalSettings];

export interface UpdatedGameSettingTransfer_HOSTER
  extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.UPDATED_GAME_STORAGE_HOSTER_P2G;
  data: {
    key: string;
    value: string | undefined;
  };
}

export interface UpdatedGameSettingTransfer_CONTROLLER
  extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.UPDATED_GAME_STORAGE_CONTROLLER_P2G;
  data: {
    key: string;
    value: string | undefined;
  };
}

// Transfer listings

export type AppDataTransfer =
  | AppDataTransfer_HOSTER
  | AppDataTransfer_CONTROLLER
  | LogTransfer
  | InitGameTransfer_HOSTER
  | InitGameTransfer_CONTROLLER
  | ReadyStatusTransfer_HOSTER
  | ReadyStatusTransfer_CONTROLLER
  | EndGame_HOSTER
  | EndGame_CONTROLLER
  | ReloadGame_HOSTER
  | ReloadGame_CONTROLLER
  | PingTransfer_HOSTER
  | PongTransfer_CONTROLLER
  | PongTransfer_HOSTER
  | SetGlobalSettingTransfer_HOSTER
  | SetGlobalSettingTransfer_CONTROLLER
  | SetGameSettingTransfer_HOSTER
  | SetGameSettingTransfer_CONTROLLER
  | UpdatedGlobalSettingTransfer_HOSTER
  | UpdatedGlobalSettingTransfer_CONTROLLER
  | UpdatedGameSettingTransfer_HOSTER
  | UpdatedGameSettingTransfer_CONTROLLER;

export type GameDataTransfer<T extends GameDataDefinition> =
  | GameActionTransfer_CONTROLLER<T>
  | GameActionTransfer_HOSTER<T>
  | GameActionResponseTransfer_HOSTER<T>
  | GameActionResponseTransfer_CONTROLLER<T>;

export type CommunicationDataTransfer<T extends GameDataDefinition> =
  | AppDataTransfer
  | GameDataTransfer<T>;

/**
 * Checks if the provided data is a valid CommunicationDataTransfer object.
 * @param data The data to be checked.
 * @returns True if the data is a valid CommunicationDataTransfer object, false otherwise.
 */
export function isCommunicationDataTransfer<T extends GameDataDefinition>(
  data: unknown,
): data is CommunicationDataTransfer<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    (typeof data.type === 'number' || typeof data.type === 'string') &&
    'data' in data &&
    typeof data.data !== 'undefined'
  );
}
