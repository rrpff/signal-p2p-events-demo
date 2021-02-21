import { ISignal, ISignalProtocolStore, IUser } from '../interfaces'
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
    const registrationId = createUser().registrationId
    libsignal.KeyHelper.generateRegistrationId = async () => registrationId

    await subject.install()

    expect(store.get('registrationId')).toEqual(registrationId)
  })

  it('should store a new device id of zero', async () => {
    await subject.install()
    expect(store.get('deviceId')).toEqual(0)
  })

  describe('if already installed', () => {
    it('should not change', async () => {
      const user = createUser()
      store.put('userId', user.identifier)
      store.put('registrationId', user.registrationId)
      store.put('deviceId', user.deviceId)

      await subject.install()

      expect(store.get('userId')).toEqual(user.identifier)
      expect(store.get('registrationId')).toEqual(user.registrationId)
      expect(store.get('deviceId')).toEqual(user.deviceId)
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
const createUser = (): IUser => ({
  identifier: Math.random().toString(),
  registrationId: Math.floor(Math.random() * 100),
  deviceId: Math.floor(Math.random() * 100),
})
