import { ulid } from 'ulid'
import { ISignal, ISignalProtocolStore, IUser, IUserInstaller } from "../interfaces";

declare var libsignal: ISignal

export default class SignalUserInstaller implements IUserInstaller<IUser> {
  constructor(private store: ISignalProtocolStore) {}

  async install(): Promise<void> {
    if (this.store.get('userId') === undefined)
      this.store.put('userId', ulid())

    if (this.store.get('registrationId') === undefined)
      this.store.put('registrationId', await libsignal.KeyHelper.generateRegistrationId())

    if (this.store.get('deviceId') === undefined)
      this.store.put('deviceId', 0)
  }

  async getLocalUser(): Promise<IUser> {
    return {
      identifier: this.store.get('userId'),
      registrationId: this.store.get('registrationId'),
      deviceId: this.store.get('deviceId'),
    }
  }
}
