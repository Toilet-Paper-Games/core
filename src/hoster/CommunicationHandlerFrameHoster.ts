import { BaseCommunicationHandler } from '../common/BaseCommunicationHandler';
import {
  CommunicationDataType,
  GameDataTransfer,
} from '../common/CommunicationDataTransfers';
import { PlayerModel } from '../common/models/PlayerModel';

export class CommunicationHandlerFrameHoster<
  TGameData = unknown,
> extends BaseCommunicationHandler<TGameData> {
  connectionPlayerMap: Map<
    string,
    { uuid: string; player: PlayerModel; active: boolean }
  > = new Map();

  connectionListeners: ((player: { uuid: string; name: string }) => void)[] = [];
  disconnectionListeners: ((player: { uuid: string }) => void)[] = [];
  nameUpdateListeners: ((player: { uuid: string; name: string }) => void)[] = [];

  constructor() {
    super();
    window.addEventListener('message', (event) => this.messageHandler(event.data));

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
  }

  addConnectionListener(listener: (player: { uuid: string; name: string }) => void) {
    this.connectionListeners.push(listener);
  }

  addDisconnectionListener(listener: (player: { uuid: string }) => void) {
    this.disconnectionListeners.push(listener);
  }

  addNameUpdateListener(listener: (player: { uuid: string; name: string }) => void) {
    this.nameUpdateListeners.push(listener);
  }

  sendGameMessage(data: TGameData, userId: string) {
    this.sendMessage({
      type: CommunicationDataType.GAME_ACTION_HOSTER,
      data: {
        to: userId,
        payload: data,
      },
    } satisfies GameDataTransfer<TGameData>);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // protected messageHandler(data: any): void {
  //   super.messageHandler(data);
  // }
}
