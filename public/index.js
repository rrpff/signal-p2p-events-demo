import InMemorySignalProtocolStore from './src/InMemorySignalProtocolStore.js'
import { toString, toArrayBuffer, isEqual } from './src/utils.js'

;(async () => {
  // Alice installs the app
  const aliceStore = new InMemorySignalProtocolStore()
  const aliceRegistrationId = await generateIdentity(aliceStore)
  const aliceDeviceId = 0
  const aliceAddress = new libsignal.SignalProtocolAddress(aliceRegistrationId, aliceDeviceId)

  // Bob installs the app
  const bobStore = new InMemorySignalProtocolStore()
  const bobRegistrationId = await generateIdentity(bobStore)
  const bobDeviceId = 0
  const bobAddress = new libsignal.SignalProtocolAddress(bobRegistrationId, bobDeviceId)

  // Bob generates a PreKey bundle to share with Alice
  const bobPreKeyId = 123
  const bobSignedKeyId = 456
  const bobPreKeyBundle = await generatePreKeyBundle(bobStore, bobPreKeyId, bobSignedKeyId)

  // Bob shares his address and PreKey bundle with Alice

  // Alice creates a session with Bob
  const builder = new libsignal.SessionBuilder(aliceStore, bobAddress)
  await builder.processPreKey(bobPreKeyBundle)

  // Alice encrypts a message for Bob
  const message1 = toArrayBuffer('hey bob')
  const aliceSessionCipher = new libsignal.SessionCipher(aliceStore, bobAddress)
  const ciphertext1 = await aliceSessionCipher.encrypt(message1)

  // Alice sends the message and her signal address to Bob

  // Bob reads Alice's message using the bundled PreKey, implicitly creating a session with her
  if (ciphertext1.type !== 3) throw new Error('ciphertext did not include a PreKey bundle')
  const bobSessionCipher = new libsignal.SessionCipher(bobStore, aliceAddress)
  const plaintext1 = await bobSessionCipher.decryptPreKeyWhisperMessage(ciphertext1.body, 'binary')
  console.log(`> Alice to Bob: "${toString(plaintext1)}"`)

  // Bob encrypts a response for Alice
  const message2 = toArrayBuffer('hey alice!')
  const ciphertext2 = await bobSessionCipher.encrypt(message2)

  // Bob sends the message to Alice

  // Alice reads Bob's message using the existing Bob session she has created
  const plaintext2 = await aliceSessionCipher.decryptWhisperMessage(ciphertext2.body, 'binary')
  console.log(`> Bob to Alice: "${toString(plaintext2)}"`)

  // Alice and Bob sit together and confirm their messages match, just for fun
  console.log(`Message #1 matches? ${isEqual(plaintext1, message1)}`)
  console.log(`Message #2 matches? ${isEqual(plaintext2, message2)}`)

  // Now Alice and Bob can send messages with their established sessions
  const ciphertext3 = await aliceSessionCipher.encrypt(toArrayBuffer('have a great day'))
  const plaintext3 = await bobSessionCipher.decryptWhisperMessage(ciphertext3.body, 'binary')
  console.log(`> Alice to Bob: "${toString(plaintext3)}"`)

  const ciphertext4 = await bobSessionCipher.encrypt(toArrayBuffer('you too!'))
  const plaintext4 = await aliceSessionCipher.decryptWhisperMessage(ciphertext4.body, 'binary')
  console.log(`> Bob to Alice: "${toString(plaintext4)}"`)
})()

async function generateIdentity(store) {
  const identityKey = await libsignal.KeyHelper.generateIdentityKeyPair()
  const registrationId = await libsignal.KeyHelper.generateRegistrationId()

  store.put('identityKey', identityKey)
  store.put('registrationId', registrationId)

  return registrationId
}

async function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
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
