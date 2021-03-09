import InMemorySignalProtocolStore from '../packages/signal-session/InMemorySignalProtocolStore'
import { ISignal } from '../packages/signal-session/interfaces'
import SignalSignator from '../packages/signal-session/SignalSignator'
import SignalUserInstaller from '../packages/signal-session/SignalUserInstaller'
import { DecryptStream, EncryptStream } from './SignalStreams'

declare var libsignal: ISignal

test('EncryptStream should throw an error when no session has been established with the given address', async () => {
  const aliceStore = new InMemorySignalProtocolStore()
  const aliceSignator = new SignalSignator(aliceStore)
  const bobAddress = libsignal.SignalProtocolAddress.fromString('12345.12345')

  await expect(EncryptStream.forAddress(bobAddress, aliceStore, aliceSignator))
    .rejects
    .toThrow(`No session established with ${bobAddress.toString()}`)
})

test('DecryptStream should throw an error when no session has been established with the given address', async () => {
  const aliceStore = new InMemorySignalProtocolStore()
  const aliceSignator = new SignalSignator(aliceStore)
  const bobAddress = libsignal.SignalProtocolAddress.fromString('12345.12345')

  await expect(DecryptStream.forAddress(bobAddress, aliceStore, aliceSignator))
    .rejects
    .toThrow(`No session established with ${bobAddress.toString()}`)
})

test('EncryptStream should encrypt messages', async () => {
  const {
    address: aliceAddress,
    preKeyBundle: alicePreKeyBundle,
    store: aliceStore,
    signator: aliceSignator,
  } = await createSignalInstallation()

  const {
    address: bobAddress,
    preKeyBundle: bobPreKeyBundle,
    signator: bobSignator,
  } = await createSignalInstallation()

  await aliceSignator.createSession(bobAddress, bobPreKeyBundle)
  await bobSignator.createSession(aliceAddress, alicePreKeyBundle)

  const aliceToBobStream = await EncryptStream.forAddress(bobAddress, aliceStore, aliceSignator)
  const subscriber = jest.fn()

  aliceToBobStream.subscribe(subscriber)
  aliceToBobStream.push('yooyoooooo')

  await new Promise(resolve => process.nextTick(resolve))

  expect(subscriber).toHaveBeenCalledTimes(1)
  const ciphertext = subscriber.mock.calls[0][0]
  expect(ciphertext.body).not.toBeNull()
  expect(ciphertext.registrationId).toEqual(bobAddress.getName())
  expect(ciphertext.type).toEqual(3)
})

test('DecryptStream should decrypt messages', async () => {
  const {
    address: aliceAddress,
    preKeyBundle: alicePreKeyBundle,
    signator: aliceSignator,
  } = await createSignalInstallation()

  const {
    address: bobAddress,
    preKeyBundle: bobPreKeyBundle,
    store: bobStore,
    signator: bobSignator,
  } = await createSignalInstallation()

  await aliceSignator.createSession(bobAddress, bobPreKeyBundle)
  await bobSignator.createSession(aliceAddress, alicePreKeyBundle)

  const message = await aliceSignator.encrypt(bobAddress, 'yoyooyoooooo')

  const bobFromAliceStream = await DecryptStream.forAddress(aliceAddress, bobStore, bobSignator)
  const subscriber = jest.fn()

  bobFromAliceStream.subscribe(subscriber)
  bobFromAliceStream.push(message)

  await new Promise(resolve => process.nextTick(resolve))

  expect(subscriber).toHaveBeenCalledWith('yoyooyoooooo')
})

test('EncryptStream and DecryptStream should work together', async () => {
  const {
    address: aliceAddress,
    preKeyBundle: alicePreKeyBundle,
    store: aliceStore,
    signator: aliceSignator,
  } = await createSignalInstallation()

  const {
    address: bobAddress,
    preKeyBundle: bobPreKeyBundle,
    store: bobStore,
    signator: bobSignator,
  } = await createSignalInstallation()

  await aliceSignator.createSession(bobAddress, bobPreKeyBundle)
  await bobSignator.createSession(aliceAddress, alicePreKeyBundle)

  const aliceToBobStream = await EncryptStream.forAddress(bobAddress, aliceStore, aliceSignator)
  const bobFromAliceStream = await DecryptStream.forAddress(aliceAddress, bobStore, bobSignator)

  const subscriber = jest.fn()

  bobFromAliceStream.subscribe(subscriber)
  aliceToBobStream.pipe(bobFromAliceStream)

  await aliceToBobStream.push('heyyyy')

  await new Promise(resolve => process.nextTick(resolve))

  expect(subscriber).toHaveBeenCalledWith('heyyyy')
})

const createSignalInstallation = async () => {
  const store = new InMemorySignalProtocolStore()
  const installer = new SignalUserInstaller(store)
  const signator = new SignalSignator(store)
  await installer.install()
  const user = await installer.getLocalUser()
  const address = new libsignal.SignalProtocolAddress(user.registrationId, user.deviceId)
  const preKeyBundle = await signator.createPreKeyBundle()

  return { address, installer, preKeyBundle, signator, store, user }
}
