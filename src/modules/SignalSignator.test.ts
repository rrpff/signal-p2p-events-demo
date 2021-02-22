import { bufferToArrayBuffer, bufferToString } from '../helpers/buffers'
import { generateKeyId, generatePreKeyBundle } from '../helpers/signal'
import { ISignalProtocolStore, ISignal, ISignalProtocolAddress, IKeyPair, ISignalPreKeyBundle } from '../interfaces'
import InMemorySignalProtocolStore from './InMemorySignalProtocolStore'
import SignalSignator from './SignalSignator'
import UsernameGenerator from './UsernameGenerator'

declare var libsignal: ISignal

let subject: SignalSignator
let user: ITestUser
beforeEach(async () => {
  user = await registerTestUser()
  subject = new SignalSignator(user.store)
})

it('#encrypt should not include the plaintext', async () => {
  const recipient = await registerTestUser()
  subject.createSession(recipient.address, recipient.preKeyBundle)

  const plaintext = randomPlaintext()
  const ciphertext = await subject.encrypt(recipient.address, plaintext)

  expect(ciphertext.body).not.toContain(plaintext)
})

describe('when the device is unregistered', () => {
  it('#encrypt should throw an error', async () => {
    const store = new InMemorySignalProtocolStore()
    const subject = new SignalSignator(store)

    const recipient = await registerTestUser()
    const recipientAddress = new libsignal.SignalProtocolAddress(recipient.registrationId, recipient.deviceId)

    expect(subject.encrypt(recipientAddress, ''))
      .rejects.toThrow('registrationId and deviceId are not stored')
  })
})

describe('when a session has not been established with the recipient', () => {
  it('#encrypt should throw an error', async () => {
    const recipient = await registerTestUser()

    expect(subject.encrypt(recipient.address, 'hey there'))
      .rejects.toThrow(`No record for ${recipient.address.toString()}`)
  })
})

describe('when a session has NOT been established by the recipient', () => {
  it('#decrypt should decrypt the message', async () => {
    const recipient = await registerTestUser()
    const recipientSubject = new SignalSignator(recipient.store)
    subject.createSession(recipient.address, recipient.preKeyBundle)

    const plaintext = randomPlaintext()
    const ciphertext = await subject.encrypt(recipient.address, plaintext)
    const decrypted = await recipientSubject.decrypt(recipient.address, ciphertext)

    expect(ciphertext.type).toEqual(3) // includes PreKeyBundle
    expect(decrypted).toEqual(bufferToString(plaintext))
  })
})

describe('when a session has been established with the sender', () => {
  it('#decrypt should decrypt the message', async () => {
    const alice = user
    const aliceSubject = subject

    const bob = await registerTestUser()
    const bobSubject = new SignalSignator(bob.store)

    aliceSubject.createSession(bob.address, bob.preKeyBundle)

    const message1 = bufferToArrayBuffer('hey bob')
    const ciphertext1 = await aliceSubject.encrypt(bob.address, message1)
    expect(ciphertext1.type).toEqual(3) // includes PreKeyBundle

    const plaintext1 = await bobSubject.decrypt(alice.address, ciphertext1)
    expect(plaintext1).toEqual(bufferToString(message1)) // read using bundled PreKey

    const message2 = bufferToArrayBuffer('hey alice!')
    const ciphertext2 = await bobSubject.encrypt(alice.address, message2)
    expect(ciphertext2.type).toEqual(1) // does not include PreKeyBundle

    const plaintext2 = await aliceSubject.decrypt(bob.address, ciphertext2)
    expect(plaintext2).toEqual(bufferToString(message2)) // read using established session
  })
})

interface ITestUser {
  store: ISignalProtocolStore
  identityKey: IKeyPair
  address: ISignalProtocolAddress
  registrationId: number
  deviceId: number
  preKeyBundle: ISignalPreKeyBundle
}

const randomPlaintext = () => bufferToArrayBuffer(UsernameGenerator.generate())

const registerTestUser = async (): Promise<ITestUser> => {
  const identityKey = await libsignal.KeyHelper.generateIdentityKeyPair()
  const registrationId = await libsignal.KeyHelper.generateRegistrationId()
  const deviceId = await generateKeyId()
  const address = new libsignal.SignalProtocolAddress(registrationId, deviceId)
  const store = new InMemorySignalProtocolStore()

  store.put('identityKey', identityKey)
  store.put('registrationId', registrationId)
  store.put('deviceId', deviceId)

  const preKeyBundle = await generatePreKeyBundle(store, await generateKeyId(), await generateKeyId())

  return { store, identityKey, address, registrationId, deviceId, preKeyBundle }
}
