import { bufferToString } from './helpers/buffers'
import { ByteBufferCompatible, ISignal, ISignalCiphertext, ISignalPreKeyBundle, ISignalProtocolAddress, ISignalProtocolStore, ISignalSignator } from './interfaces'

declare var libsignal: ISignal

export default class SignalSignator implements ISignalSignator<ISignalProtocolAddress, ISignalCiphertext> {
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

  // TODO: wrap a test around this, i'm feeling lazy and i'd already written it
  public async createPreKeyBundle(): Promise<ISignalPreKeyBundle> {
    const preKeyId = await this.generateKeyId()
    const signedPreKeyId = await this.generateKeyId()

    const identity = await this.store.getIdentityKeyPair()
    const registrationId = await this.store.getLocalRegistrationId()
    const preKey = await libsignal.KeyHelper.generatePreKey(preKeyId)
    const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(identity, signedPreKeyId)

    this.store.storePreKey(preKeyId, preKey.keyPair)
    this.store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair)

    return {
      identityKey: identity.pubKey,
      registrationId: registrationId,
      preKey: {
        keyId: preKeyId,
        publicKey: preKey.keyPair.pubKey
      },
      signedPreKey: {
        keyId: signedPreKeyId,
        publicKey: signedPreKey.keyPair.pubKey,
        signature: signedPreKey.signature
      }
    }
  }

  private async checkRegistration() {
    if (this.store.get('registrationId') === undefined && this.store.get('deviceId') === undefined)
      throw new Error('registrationId and deviceId are not stored')
  }

  // TODO: is this limit set correctly?
  // TODO: how bad are collisions?
  // See: https://crypto.stackexchange.com/questions/82113/what-is-keyid-in-signal-protocol-javascript-library
  private async generateKeyId(): Promise<number> {
    const limit = 2^24
    return Math.ceil(Math.random() * limit)
  }
}
