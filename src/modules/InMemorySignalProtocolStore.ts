// Adapted from: https://github.com/signalapp/libsignal-protocol-javascript/blob/master/test/InMemorySignalProtocolStore.js

import { IKeyPair, IPublicKey, ISignal, ISignalProtocolStore, ISignalSessionRecord } from '../interfaces'
import { bufferToString } from '../helpers/buffers'

declare var libsignal: ISignal

export default class InMemorySignalProtocolStore implements ISignalProtocolStore {
  Direction = { SENDING: 1, RECEIVING: 2 }
  store: Record<string, unknown> = {}

  put<T>(key: string, value: T) {
    if (key === undefined || value === undefined || key === null || value === null)
      throw new Error('Tried to store undefined/null')

    this.store[key] = value
  }

  get<T>(key: string, defaultValue?: T): T {
    if (key === null || key === undefined)
      throw new Error('Tried to get value for undefined/null key')

    if (key in this.store)
      return this.store[key] as T

    return defaultValue as T
  }

  remove(key: string) {
    if (key === null || key === undefined)
      throw new Error('Tried to remove value for undefined/null key')

    delete this.store[key]
  }

  async getIdentityKeyPair(): Promise<IKeyPair> {
    return this.get('identityKey') as IKeyPair
  }

  async getLocalRegistrationId(): Promise<string> {
    return this.get('registrationId')
  }

  async isTrustedIdentity(identifier: string, identityKey: ArrayBuffer) {
    if (identifier === null || identifier === undefined)
      throw new Error('tried to check identity key for undefined/null key')

    if (!(identityKey instanceof ArrayBuffer))
      throw new Error('Expected identityKey to be an ArrayBuffer')

    const storedIdentityKey = this.get<ArrayBuffer>('identityKey' + identifier)
    if (storedIdentityKey === undefined) return true

    return bufferToString(identityKey) === bufferToString(storedIdentityKey)
  }

  async loadIdentityKey(identifier: string) {
    if (identifier === null || identifier === undefined)
      throw new Error('Tried to get identity key for undefined/null key')

    return this.get<ArrayBuffer>('identityKey' + identifier)
  }

  async saveIdentity(identifier: string, identityKey: IPublicKey) {
    if (identifier === null || identifier === undefined)
      throw new Error('Tried to put identity key for undefined/null key')

    const address = libsignal.SignalProtocolAddress.fromString(identifier)
    const existing = this.get<ArrayBuffer>('identityKey' + address.getName())

    this.put('identityKey' + address.getName(), identityKey)

    return existing && bufferToString(identityKey) !== bufferToString(existing)
  }

  async loadPreKey(keyId: number) {
    const res = this.get<IKeyPair>('25519KeypreKey' + keyId)
    if (res === undefined) return res

    return { pubKey: res.pubKey, privKey: res.privKey }
  }

  async storePreKey(keyId: number, keyPair: IKeyPair) {
    this.put('25519KeypreKey' + keyId, keyPair)
  }

  async removePreKey(keyId: number) {
    this.remove('25519KeypreKey' + keyId)
  }

  async loadSignedPreKey(keyId: number) {
    const res = this.get<IKeyPair>('25519KeysignedKey' + keyId)
    if (res === undefined) return res

    return { pubKey: res.pubKey, privKey: res.privKey }
  }

  async storeSignedPreKey(keyId: number, keyPair: IKeyPair) {
    this.put('25519KeysignedKey' + keyId, keyPair)
  }

  async removeSignedPreKey(keyId: number) {
    this.remove('25519KeysignedKey' + keyId)
  }

  async loadSession(identifier: string) {
    return this.get<ISignalSessionRecord>('session' + identifier)
  }

  async storeSession(identifier: string, record: ISignalSessionRecord) {
    this.put('session' + identifier, record)
  }

  async removeSession(identifier: string) {
    this.remove('session' + identifier)
  }

  async removeAllSessions(identifier: string) {
    for (const id in this.store) {
      if (id.startsWith('session' + identifier)) {
        delete this.store[id]
      }
    }
  }
}
