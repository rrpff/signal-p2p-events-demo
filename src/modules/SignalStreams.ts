import MapStream from '../packages/event-stream/MapStream'
import { ISignalSignator, ISignalProtocolAddress, ISignalCiphertext, ISignalProtocolStore } from '../packages/signal-session/interfaces'

type ISignator = ISignalSignator<ISignalProtocolAddress, ISignalCiphertext>

export class EncryptStream extends MapStream<any> {
  static async forAddress(address: ISignalProtocolAddress, store: ISignalProtocolStore, signator: ISignator) {
    await validateSessionEstablished(address, store)
    return new EncryptStream(address, store, signator)
  }

  constructor(address: ISignalProtocolAddress, store: ISignalProtocolStore, signator: ISignator) {
    super((event: any) => {
      return signator.encrypt(address, event)
    })
  }
}

export class DecryptStream extends MapStream<any> {
  static async forAddress(address: ISignalProtocolAddress, store: ISignalProtocolStore, signator: ISignator) {
    await validateSessionEstablished(address, store)
    return new DecryptStream(address, store, signator)
  }

  constructor(address: ISignalProtocolAddress, store: ISignalProtocolStore, signator: ISignator) {
    super(async (event: any) => {
      const decrypted = await signator.decrypt(address, event)
      return decrypted
    })
  }
}

const validateSessionEstablished = async (address: ISignalProtocolAddress, store: ISignalProtocolStore) => {
  const identityKey = await store.loadIdentityKey(address.getName())

  if (identityKey === undefined) {
    throw new Error(`No session established with ${address.toString()}`)
  }
}
