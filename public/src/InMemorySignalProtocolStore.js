// Adapted from: https://github.com/signalapp/libsignal-protocol-javascript/blob/master/test/InMemorySignalProtocolStore.js
import { toString } from './utils.js'

export default class InMemorySignalProtocolStore {
  Direction = { SENDING: 1, RECEIVING: 2 }
  store = {}

  put(key, value) {
    if (key === undefined || value === undefined || key === null || value === null)
      throw new Error('Tried to store undefined/null')

    this.store[key] = value
  }

  get(key, defaultValue) {
    if (key === null || key === undefined)
      throw new Error('Tried to get value for undefined/null key')

    if (key in this.store)
      return this.store[key]

    return defaultValue
  }

  remove(key) {
    if (key === null || key === undefined)
      throw new Error('Tried to remove value for undefined/null key')

    delete this.store[key]
  }

  async getIdentityKeyPair() {
    return this.get('identityKey')
  }

  async getLocalRegistrationId() {
    return this.get('registrationId')
  }

  async isTrustedIdentity(identifier, identityKey, _direction) {
    if (identifier === null || identifier === undefined)
      throw new Error('tried to check identity key for undefined/null key')

    if (!(identityKey instanceof ArrayBuffer))
      throw new Error('Expected identityKey to be an ArrayBuffer')

    const storedIdentityKey = this.get('identityKey' + identifier)
    if (storedIdentityKey === undefined) return true

    return toString(identityKey) === toString(storedIdentityKey)
  }

  async loadIdentityKey(identifier) {
    if (identifier === null || identifier === undefined)
      throw new Error('Tried to get identity key for undefined/null key')

    return this.get('identityKey' + identifier)
  }

  async saveIdentity(identifier, identityKey) {
    if (identifier === null || identifier === undefined)
      throw new Error('Tried to put identity key for undefined/null key')

    const address = new libsignal.SignalProtocolAddress.fromString(identifier)
    const existing = this.get('identityKey' + address.getName())

    this.put('identityKey' + address.getName(), identityKey)

    return existing && toString(identityKey) !== toString(existing)
  }

  async loadPreKey(keyId) {
    const res = this.get('25519KeypreKey' + keyId)
    if (res === undefined) return res

    return { pubKey: res.pubKey, privKey: res.privKey }
  }

  async storePreKey(keyId, keyPair) {
    this.put('25519KeypreKey' + keyId, keyPair)
  }

  async removePreKey(keyId) {
    this.remove('25519KeypreKey' + keyId)
  }

  async loadSignedPreKey(keyId) {
    const res = this.get('25519KeysignedKey' + keyId)
    if (res === undefined) return res

    return { pubKey: res.pubKey, privKey: res.privKey }
  }

  async storeSignedPreKey(keyId, keyPair) {
    this.put('25519KeysignedKey' + keyId, keyPair)
  }

  async removeSignedPreKey(keyId) {
    this.remove('25519KeysignedKey' + keyId)
  }

  async loadSession(identifier) {
    return this.get('session' + identifier)
  }

  async storeSession(identifier, record) {
    this.put('session' + identifier, record)
  }

  async removeSession(identifier) {
    this.remove('session' + identifier)
  }

  async removeAllSessions(identifier) {
    for (const id in this.store) {
      if (id.startsWith('session' + identifier)) {
        delete this.store[id]
      }
    }
  }
}
