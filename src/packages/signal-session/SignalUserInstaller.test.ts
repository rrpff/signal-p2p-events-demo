import { IKeyPair, ISignal, ISignalProtocolStore } from './interfaces'
import InMemorySignalProtocolStore from './InMemorySignalProtocolStore'
import SignalUserInstaller from './SignalUserInstaller'

declare var libsignal: ISignal

let subject: SignalUserInstaller
let store: ISignalProtocolStore
beforeEach(() => {
  store = new InMemorySignalProtocolStore()
  subject = new SignalUserInstaller(store)
})

describe('install', () => {
  const originalGenerateRegistrationId = libsignal.KeyHelper.generateRegistrationId
  beforeEach(() => libsignal.KeyHelper.generateRegistrationId = originalGenerateRegistrationId)

  it('should store a new ULID user id', async () => {
    await subject.install()
    expect(isUlid(store.get('userId'))).toEqual(true)
  })

  it('should store a new Signal registration id', async () => {
    const registrationId = (await createUser()).registrationId
    libsignal.KeyHelper.generateRegistrationId = async () => registrationId

    await subject.install()

    expect(store.get('registrationId')).toEqual(registrationId)
  })

  it('should store a new device id of zero', async () => {
    await subject.install()
    expect(store.get('deviceId')).toEqual(0)
  })

  it('should store a new identity key', async () => {
    await subject.install()
    expect(store.get<IKeyPair>('identityKey').pubKey).toBeInstanceOf(ArrayBuffer)
    expect(store.get<IKeyPair>('identityKey').privKey).toBeInstanceOf(ArrayBuffer)
  })

  describe('if already installed', () => {
    it('should not change', async () => {
      const user = await createUser()
      store.put('userId', user.identifier)
      store.put('registrationId', user.registrationId)
      store.put('deviceId', user.deviceId)
      store.put('identityKey', user.identityKey)

      await subject.install()

      expect(store.get('userId')).toEqual(user.identifier)
      expect(store.get('registrationId')).toEqual(user.registrationId)
      expect(store.get('deviceId')).toEqual(user.deviceId)
      expect(store.get('identityKey')).toEqual(user.identityKey)
    })
  })
})

describe('getLocalUser', () => {
  it('should return the current user', async () => {
    await subject.install()

    expect(await subject.getLocalUser()).toEqual({
      identifier: store.get('userId'),
      registrationId: store.get('registrationId'),
      deviceId: store.get('deviceId'),
    })
  })
})

const isUlid = (value: unknown) => typeof value === 'string' && value.length === 26
const createUser = async () => ({
  identifier: Math.random().toString(),
  registrationId: Math.floor(Math.random() * 100),
  deviceId: Math.floor(Math.random() * 100),
  identityKey: await libsignal.KeyHelper.generateIdentityKeyPair()
})
