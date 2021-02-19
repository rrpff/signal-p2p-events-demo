import InMemorySignalProtocolStore from './src/InMemorySignalProtocolStore.js'

const createClient = async (store, recipientId) => {
  const registrationId = libsignal.KeyHelper.generateRegistrationId()
  const identityKeyPair = await libsignal.KeyHelper.generateIdentityKeyPair()

  const preKey = await libsignal.KeyHelper.generatePreKey(registrationId)
  const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(identityKeyPair, registrationId)

  console.log(`${recipientId} preKey`, preKey)
  console.log(`${recipientId} signedPreKey`, signedPreKey)

  store.put('registrationId', registrationId)
  store.put('identityKey', identityKeyPair)
  store.storePreKey(preKey.keyId, preKey.keyPair)
  store.storeSignedPreKey(signedPreKey.keyId, signedPreKey.keyPair)

  return { registrationId, identityKeyPair, preKey, signedPreKey, recipientId, deviceId: 0 }
}

const createSession = async (store, client, recipient) => {
  try {
    const address = new libsignal.SignalProtocolAddress(recipient.recipientId, recipient.deviceId)
    const sessionBuilder = new libsignal.SessionBuilder(store, address)

    await sessionBuilder.processPreKey({
      registrationId: recipient.registrationId,
      identityKey: recipient.identityKeyPair.pubKey,
      signedPreKey: {
        keyId: recipient.signedPreKey.keyId,
        publicKey: recipient.signedPreKey.keyPair.pubKey,
        signature: recipient.signedPreKey.signature,
      },
      preKey: {
        keyId: recipient.preKey.keyId,
        publicKey: recipient.preKey.keyPair.pubKey
      }
    })

    console.log('ready')
  } catch (e) {
    console.error(e)
  }
}

;(async () => {
  const storeA = new InMemorySignalProtocolStore()
  const clientA = await createClient(storeA, 'cooper')

  const storeB = new InMemorySignalProtocolStore()
  const clientB = await createClient(storeB, 'truman')

  console.log('clientA', clientA)
  console.log('clientB', clientB)
  console.log('storeA', storeA)
  console.log('storeB', storeB)

  const sessionA = createSession(storeA, clientA, clientB)
})()
