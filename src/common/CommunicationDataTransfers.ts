// TODO: need to be split between hoster and controller

export interface GameDataDefinition<C2H = unknown, H2C = unknown> {
  ControllerToHoster: C2H;
  HosterToController: H2C;
}

export enum CommunicationDataType {
  STARTUP_HOSTER,
  CONNECTION_HOSTER,
  DISCONNECTION_HOSTER,
  DEBUG,
  GAME_ACTION_HOSTER,
  GAME_ACTION_CONTROLLER,
  GAME_ACTION_RESPONSE_HOSTER,
  GAME_ACTION_RESPONSE_CONTROLLER,
  UPDATE_NAME_HOSTER,
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

export interface StartupTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.STARTUP_HOSTER;
  data: {
    players: { uuid: string; name: string }[];
  };
}

export interface ConnectionTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.CONNECTION_HOSTER;
  data: {
    uuid: string;
    name: string;
  };
}

export interface DisconnectionTransfer_HOSTER
  extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.DISCONNECTION_HOSTER;
  data: {
    uuid: string;
  };
}

export interface UpdateNameTransfer_HOSTER extends CommunicationDataTransfersStructure {
  type: CommunicationDataType.UPDATE_NAME_HOSTER;
  data: {
    uuid: string;
    name: string;
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

// Transfer listings

export type AppDataTransfer =
  | StartupTransfer_HOSTER
  | LogTransfer
  | ConnectionTransfer_HOSTER
  | DisconnectionTransfer_HOSTER
  | UpdateNameTransfer_HOSTER;

export type GameDataTransfer<T extends GameDataDefinition> =
  | GameActionTransfer_CONTROLLER<T>
  | GameActionTransfer_HOSTER<T>
  | GameActionResponseTransfer_HOSTER<T>
  | GameActionResponseTransfer_CONTROLLER<T>;

export type CommunicationDataTransfer<T extends GameDataDefinition> =
  | AppDataTransfer
  | GameDataTransfer<T>;

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
