import { ISignal, ISignalProtocolStore } from '../interfaces'

declare var libsignal: ISignal

export async function generateIdentity(store: ISignalProtocolStore) {
  const identityKey = await libsignal.KeyHelper.generateIdentityKeyPair()
  const registrationId = await libsignal.KeyHelper.generateRegistrationId()

  store.put('identityKey', identityKey)
  store.put('registrationId', registrationId)

  return registrationId.toString()
}

export async function generatePreKeyBundle(store: ISignalProtocolStore, preKeyId: number, signedPreKeyId: number) {
  const identity = await store.getIdentityKeyPair()
  const registrationId = await store.getLocalRegistrationId()
  const preKey = await libsignal.KeyHelper.generatePreKey(preKeyId)
  const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(identity, signedPreKeyId)

  store.storePreKey(preKeyId, preKey.keyPair)
  store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair)

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
