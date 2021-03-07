import { ulid } from 'ulid'
import { ISignal, ISignalProtocolStore, ISignalUser, ISignalUserInstaller } from "./interfaces"

declare var libsignal: ISignal

export default class SignalUserInstaller implements ISignalUserInstaller<ISignalUser> {
  constructor(private store: ISignalProtocolStore) {}

  async install(): Promise<void> {
    if (this.store.get('userId') === undefined)
      this.store.put('userId', ulid())

    if (this.store.get('registrationId') === undefined)
      this.store.put('registrationId', await libsignal.KeyHelper.generateRegistrationId())

    if (this.store.get('deviceId') === undefined)
      this.store.put('deviceId', 0)

    if (this.store.get('identityKey') === undefined)
      this.store.put('identityKey', await libsignal.KeyHelper.generateIdentityKeyPair())
  }

  async getLocalUser(): Promise<ISignalUser> {
    return {
      identifier: this.store.get('userId'),
      registrationId: this.store.get('registrationId'),
      deviceId: this.store.get('deviceId'),
    }
  }
}
