import { bufferToString } from '../helpers/buffers'
import { ByteBufferCompatible, ISignal, ISignalCiphertext, ISignalPreKeyBundle, ISignalProtocolAddress, ISignalProtocolStore, ISignator } from '../interfaces'

declare var libsignal: ISignal

export default class SignalSignator implements ISignator<ISignalProtocolAddress, ISignalCiphertext> {
  constructor(private store: ISignalProtocolStore) {}

  public async encrypt(address: ISignalProtocolAddress, plaintext: ByteBufferCompatible): Promise<ISignalCiphertext> {
    await this.checkRegistration()

    const cipher = new libsignal.SessionCipher(this.store, address)
    return await cipher.encrypt(plaintext)
  }

  public async decrypt(address: ISignalProtocolAddress, ciphertext: ISignalCiphertext): Promise<string> {
    try {
      const cipher = new libsignal.SessionCipher(this.store, address)

      if (ciphertext.type === 3) {
        return bufferToString(await cipher.decryptPreKeyWhisperMessage(ciphertext.body, 'binary'))
      } else {
        return bufferToString(await cipher.decryptWhisperMessage(ciphertext.body, 'binary'))
      }
    } catch (e) {
      throw e
    }
  }

  public async createSession(address: ISignalProtocolAddress, preKeyBundle: ISignalPreKeyBundle): Promise<void> {
    const builder = new libsignal.SessionBuilder(this.store, address)
    await builder.processPreKey(preKeyBundle)
  }

  private async checkRegistration() {
    if (this.store.get('registrationId') === undefined && this.store.get('deviceId') === undefined)
      throw new Error('registrationId and deviceId are not stored')
  }
}
