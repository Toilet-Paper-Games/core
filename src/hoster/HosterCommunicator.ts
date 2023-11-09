import { BaseCommunicator } from '../common/BaseCommunicator';
import {
  CommunicationDataType,
  GameActionResponseTransfer_HOSTER,
  GameDataDefinition,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';
import { PlayerModel } from '../common/models/PlayerModel';

export class HosterCommunicator<
  TGameData extends GameDataDefinition = {
    ControllerToHoster: unknown;
    HosterToController: unknown;
  },
> extends BaseCommunicator<GameDataDefinition> {
  connectionPlayerMap: Map<
    string,
    { uuid: string; player: PlayerModel; active: boolean }
  > = new Map();

  connectionListeners: ((player: { uuid: string; name: string }) => void)[] = [];
  disconnectionListeners: ((player: { uuid: string }) => void)[] = [];
  nameUpdateListeners: ((player: { uuid: string; name: string }) => void)[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageListener: (this: Window, ev: MessageEvent<any>) => any;

  constructor(autoReady = false) {
    super();
    this.messageListener = (event) => this.messageHandler(event.data);
    window.addEventListener('message', this.messageListener);

    this.addAppMessageListener(({ data }) => {
      data.players.forEach((player) => {
        this.connectionPlayerMap.set(player.uuid, {
          uuid: player.uuid,
          player: new PlayerModel(player.name),
          active: true,
        });
      });
    }, CommunicationDataType.STARTUP_HOSTER);

    this.addAppMessageListener(({ data }) => {
      this.connectionListeners.forEach((callbackfn) => callbackfn(data));

      this.connectionPlayerMap.set(data.uuid, {
        uuid: data.uuid,
        player: new PlayerModel(data.name),
        active: true,
      });
    }, CommunicationDataType.CONNECTION_HOSTER);

    this.addAppMessageListener(({ data }) => {
      this.disconnectionListeners.forEach((callbackfn) => callbackfn(data));

      const player = this.connectionPlayerMap.get(data.uuid);
      if (player) player.active = false;
    }, CommunicationDataType.DISCONNECTION_HOSTER);

    this.addAppMessageListener(({ data }) => {
      this.nameUpdateListeners.forEach((callbackfn) => callbackfn(data));

      const player = this.connectionPlayerMap.get(data.uuid);
      if (player) player.player.screenName = data.name;
    }, CommunicationDataType.UPDATE_NAME_HOSTER);

    if (autoReady) {
      this.ready();
    }
  }

  destructor() {
    window.removeEventListener('message', this.messageListener);
  }

  ready() {
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_HOSTER,
      data: {
        ready: true,
      },
    });
  }

  unready() {
    this.sendAppMessage({
      type: CommunicationDataType.READY_STATUS_HOSTER,
      data: {
        ready: false,
      },
    });
  }

  addConnectionListener(listener: (player: { uuid: string; name: string }) => void) {
    this.connectionListeners.push(listener);

    return {
      destroy: () => {
        const index = this.connectionListeners.indexOf(listener);
        if (index === -1) return;

        this.connectionListeners.splice(index, 1);
      },
    };
  }

  addDisconnectionListener(listener: (player: { uuid: string }) => void) {
    this.disconnectionListeners.push(listener);

    return {
      destroy: () => {
        const index = this.disconnectionListeners.indexOf(listener);
        if (index === -1) return;

        this.disconnectionListeners.splice(index, 1);
      },
    };
  }

  addNameUpdateListener(listener: (player: { uuid: string; name: string }) => void) {
    this.nameUpdateListeners.push(listener);

    return {
      destroy: () => {
        const index = this.nameUpdateListeners.indexOf(listener);
        if (index === -1) return;

        this.nameUpdateListeners.splice(index, 1);
      },
    };
  }

  sendGameMessage(data: TGameData['HosterToController'], userId: string) {
    this.sendMessage({
      type: CommunicationDataType.GAME_ACTION_HOSTER,
      data: {
        to: userId,
        payload: data,
      },
    } satisfies GameDataTransfer<TGameData>);
  }

  broadcastGameMessage(data: TGameData['HosterToController']) {
    for (const userId of this.connectionPlayerMap.keys()) {
      this.sendGameMessage(data, userId);
    }
  }

  addGameMessageListener(
    listener: (message: GameActionResponseTransfer_HOSTER<TGameData>['data']) => void,
  ) {
    const newListener = {
      listener: (message: GameDataTransfer<TGameData>) => {
        if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER) {
          listener(message.data);
        }
      },
    };
    this.gameMessageListeners.push(newListener);

    return {
      destroy: () => {
        const index = this.gameMessageListeners.indexOf(newListener);
        if (index === -1) return;

        this.gameMessageListeners.splice(index, 1);
      },
    };
  }

  messageHandler(message: unknown) {
    super.messageHandler(message);

    if (message.type === CommunicationDataType.GAME_ACTION_RESPONSE_HOSTER) {
      this.gameMessageListeners.forEach((callbackfn) => callbackfn.listener(message));
      return;
    }
  }
}
