// TODO: need to be split between hoster and controller

import { PlayerDto } from './models/PlayerModel';

export interface GameDataDefinition<C2H = unknown, H2C = unknown> {
  ControllerToHoster: C2H;
  HosterToController: H2C;
}

export enum CommunicationDataType {
  DEBUG,

  AppData_HOSTER,
  AppData_CONTROLLER,

  INIT_GAME_HOSTER,
  INIT_GAME_CONTROLLER,

  READY_STATUS_HOSTER,
  READY_STATUS_CONTROLLER,

  GAME_ACTION_HOSTER,
  GAME_ACTION_CONTROLLER,
  GAME_ACTION_RESPONSE_HOSTER,
  GAME_ACTION_RESPONSE_CONTROLLER,

  END_GAME_HOSTER,
  END_GAME_CONTROLLER,
  RELOAD_GAME_HOSTER,
  RELOAD_GAME_CONTROLLER,
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
    joinCode: string;
    devMode: boolean;
  };
}

/** Sent at the initialization of a controller communicator and anytime a value is changed */
export interface AppDataTransfer_CONTROLLER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.AppData_CONTROLLER;
  data: {
    hosterReady: boolean;
    connectionId: string;
    joinCode: string;
    devMode: boolean;
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
  | ReloadGame_CONTROLLER;

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
    typeof data.type === 'number' &&
    'data' in data &&
    typeof data.data !== 'undefined'
  );
}
