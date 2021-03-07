import {
  ISignal,
  ISignalPreKeyBundle,
  ISignalProtocolAddress,
  ISignalProtocolStore,
  IEvent,
  IEventSubscriber,
  IEventStream,
  ISerializer,
  IPeerToPeerCommunicator,
  IMessage,
  IUser
} from '../../src/interfaces'
import InMemorySignalProtocolStore from '../../src/modules/InMemorySignalProtocolStore'
import SignalSignator from '../../src/modules/SignalSignator'
import SignalUserInstaller from '../../src/modules/SignalUserInstaller'

declare var libsignal: ISignal

class ExampleEventStream implements IEventStream {
  private subscribers: Set<IEventSubscriber> = new Set()

  add(event: IEvent): void {
    this.subscribers.forEach(subscriber => subscriber(event))
  }

  stream(subscriber: IEventSubscriber): void {
    this.subscribers.add(subscriber)
  }
}

class ExamplePeerToPeerCommunicator implements IPeerToPeerCommunicator<ExamplePeerToPeerCommunicator, IEvent, { identifier: string }> {
  private subscribers: Set<(address: ExamplePeerToPeerCommunicator, message: IEvent) => void> = new Set()

  constructor(private serializer: ISerializer<IEvent, string>) {}

  async setup() { return { identifier: '123' } }

  connect(address: ExamplePeerToPeerCommunicator): Promise<void> {
    return Promise.resolve()
  }

  send(address: ExamplePeerToPeerCommunicator, message: IEvent): void {
    address.exampleReceive(this, this.serializer.serialize(message))
  }

  stream(handler: (address: ExamplePeerToPeerCommunicator, message: IEvent) => void): void {
    this.subscribers.add(handler)
  }

  exampleReceive(address: ExamplePeerToPeerCommunicator, message: string): void {
    this.subscribers.forEach(subscriber => subscriber(address, this.serializer.deserialize(message)))
  }

  safetyNumberFor(address: ExamplePeerToPeerCommunicator): Promise<string> {
    throw new Error('Method not implemented.')
  }
}

const ADDRESS_LOOKUP = new Map<string, ExampleSignalPeerToPeerCommunicator>()

class ExampleSignalPeerToPeerCommunicator implements IPeerToPeerCommunicator<ISignalProtocolAddress, IEvent, IUser> {
  private subscribers: Set<(address: ISignalProtocolAddress, message: IEvent) => void> = new Set()
  private address?: ISignalProtocolAddress

  constructor(
    private serializer: ISerializer<IEvent, string>,
    private signalUserInstaller: SignalUserInstaller,
    private signator: SignalSignator
  ) {}

  async setup() {
    await this.signalUserInstaller.install()

    const { registrationId, deviceId } = await this.signalUserInstaller.getLocalUser()
    const address = new libsignal.SignalProtocolAddress(registrationId, deviceId)

    ADDRESS_LOOKUP.set(address.toString(), this)
    this.address = address

    return { identifier: '123', registrationId, deviceId }
  }

  async connect(address: ISignalProtocolAddress): Promise<void> {
    const instance = ADDRESS_LOOKUP.get(address.toString())
    const preKeyBundle = await this.signator.createPreKeyBundle()

    await instance!.exampleReceiveConnection(this.address!, preKeyBundle)
  }

  async send(address: ISignalProtocolAddress, message: IEvent): Promise<void> {
    const packet = await this.signator.encrypt(address, this.serializer.serialize(message))
    const instance = ADDRESS_LOOKUP.get(address.toString())

    instance!.exampleReceive(this.address!, JSON.stringify(packet))
  }

  stream(handler: (address: ISignalProtocolAddress, message: IEvent) => void): void {
    this.subscribers.add(handler)
  }

  async exampleReceive(address: ISignalProtocolAddress, message: string): Promise<void> {
    const plaintext = await this.signator.decrypt(address, JSON.parse(message))

    this.subscribers.forEach(subscriber => subscriber(address, this.serializer.deserialize(plaintext)))
  }

  async exampleReceiveConnection(address: ISignalProtocolAddress, preKeyBundle: ISignalPreKeyBundle) {
    this.signator.createSession(address, preKeyBundle)
  }

  safetyNumberFor(address: ISignalProtocolAddress): Promise<string> {
    throw new Error('Method not implemented.')
  }
}

const IDENTIFIER_LOOKUP = new Map<string, ExampleSignalPeerToPeerCommunicatorWithIdentifiers>()

class ExampleSignalPeerToPeerCommunicatorWithIdentifiers implements IPeerToPeerCommunicator<string, IEvent, IUser> {
  public identifier?: string
  private subscribers: Set<(identifier: string, message: IEvent) => void> = new Set()
  private address?: ISignalProtocolAddress
  private addressBook: Map<string, ISignalProtocolAddress> = new Map()

  constructor(
    private store: ISignalProtocolStore,
    private serializer: ISerializer<IEvent, string>,
    private signalUserInstaller: SignalUserInstaller,
    private signator: SignalSignator
  ) {}

  async setup() {
    await this.signalUserInstaller.install()

    const { identifier, registrationId, deviceId } = await this.signalUserInstaller.getLocalUser()

    this.address = new libsignal.SignalProtocolAddress(registrationId, deviceId)
    this.identifier = identifier
    IDENTIFIER_LOOKUP.set(identifier, this)

    return { identifier, registrationId, deviceId }
  }

  async connect(identifier: string): Promise<void> {
    const preKeyBundle = await this.signator.createPreKeyBundle()
    await IDENTIFIER_LOOKUP.get(identifier)!.exampleReceiveConnection(this.identifier!, this.address!, preKeyBundle)
  }

  async send(identifier: string, message: IEvent): Promise<void> {
    const address = this.addressBook.get(identifier)!
    const packet = await this.signator.encrypt(address, this.serializer.serialize(message))

    await IDENTIFIER_LOOKUP.get(identifier)!.exampleReceive(this.identifier!, JSON.stringify(packet))
  }

  stream(handler: (identifier: string, message: IEvent) => void): void {
    this.subscribers.add(handler)
  }

  async exampleReceive(identifier: string, message: string): Promise<void> {
    const address = this.addressBook.get(identifier)!
    const plaintext = await this.signator.decrypt(address, JSON.parse(message))

    this.subscribers.forEach(subscriber => subscriber(identifier, this.serializer.deserialize(plaintext)))
  }

  async exampleReceiveConnection(identifier: string, address: ISignalProtocolAddress, preKeyBundle: ISignalPreKeyBundle) {
    this.addressBook.set(identifier, address)
    await this.signator.createSession(address, preKeyBundle)
  }

  async safetyNumberFor(identifier: string): Promise<string> {
    const ourIdentityKey = (await this.store.getIdentityKeyPair()).pubKey
    const theirLibsignalIdentifier = this.addressBook.get(identifier)!.getName()
    const theirIdentityKey = await this.store.loadIdentityKey(theirLibsignalIdentifier)

    const fingerprintGenerator = new (libsignal as any).FingerprintGenerator(10) // iterations?
    return await fingerprintGenerator.createFor(this.identifier!, ourIdentityKey, identifier, theirIdentityKey)
  }
}

class ExampleJsonEventSerializer implements ISerializer<IEvent, string> {
  serialize(message: IEvent): string {
    return JSON.stringify(message)
  }

  deserialize(message: string): IEvent {
    return JSON.parse(message)
  }
}

test('Streaming encrypted events peer to peer with Example implementations', () => {
  const eventStreamBob = new ExampleEventStream()
  const serializerBob = new ExampleJsonEventSerializer()
  const communicatorBob = new ExamplePeerToPeerCommunicator(serializerBob)

  const eventStreamAlice = new ExampleEventStream()
  const serializerAlice = new ExampleJsonEventSerializer()
  const communicatorAlice = new ExamplePeerToPeerCommunicator(serializerAlice)

  const eventStreamJamie = new ExampleEventStream()
  const serializerJamie = new ExampleJsonEventSerializer()
  const communicatorJamie = new ExamplePeerToPeerCommunicator(serializerJamie)

  const eventBobToAlice = { id: Math.random().toString(), type: Math.random().toString() }
  const eventJamieToAlice = { id: Math.random().toString(), type: Math.random().toString() }
  const spy = jest.fn()

  communicatorBob.connect(communicatorAlice)
  communicatorJamie.connect(communicatorAlice)

  eventStreamBob.stream(event => communicatorBob.send(communicatorAlice, event))
  eventStreamJamie.stream(event => communicatorJamie.send(communicatorAlice, event))

  communicatorAlice.stream((address, event) => {
    if (address === communicatorBob) {
      eventStreamAlice.add(event)
    }
  })

  eventStreamAlice.stream(spy)
  eventStreamBob.add(eventBobToAlice)
  eventStreamJamie.add(eventJamieToAlice)

  expect(spy).toHaveBeenCalledWith(eventBobToAlice)
  expect(spy).not.toHaveBeenCalledWith(eventJamieToAlice)
})

test('Streaming encrypted events peer to peer with Example Signal implementations', async () => {
  const storeBob = new InMemorySignalProtocolStore()
  const installerBob = new SignalUserInstaller(storeBob)
  const signatorBob = new SignalSignator(storeBob)
  const eventStreamBob = new ExampleEventStream()
  const serializerBob = new ExampleJsonEventSerializer()
  const communicatorBob = new ExampleSignalPeerToPeerCommunicator(serializerBob, installerBob, signatorBob)
  await communicatorBob.setup()

  const storeAlice = new InMemorySignalProtocolStore()
  const installerAlice = new SignalUserInstaller(storeAlice)
  const signatorAlice = new SignalSignator(storeAlice)
  const eventStreamAlice = new ExampleEventStream()
  const serializerAlice = new ExampleJsonEventSerializer()
  const communicatorAlice = new ExampleSignalPeerToPeerCommunicator(serializerAlice, installerAlice, signatorAlice)
  await communicatorAlice.setup()

  const storeJamie = new InMemorySignalProtocolStore()
  const installerJamie = new SignalUserInstaller(storeJamie)
  const signatorJamie = new SignalSignator(storeJamie)
  const eventStreamJamie = new ExampleEventStream()
  const serializerJamie = new ExampleJsonEventSerializer()
  const communicatorJamie = new ExampleSignalPeerToPeerCommunicator(serializerJamie, installerJamie, signatorJamie)
  await communicatorJamie.setup()

  const eventBobToAlice = { id: Math.random().toString(), type: Math.random().toString() }
  const eventJamieToAlice = { id: Math.random().toString(), type: Math.random().toString() }
  const spy = jest.fn()

  const { registrationId: registrationIdBob, deviceId: deviceIdBob } = await installerBob.getLocalUser()
  const { registrationId: registrationIdAlice, deviceId: deviceIdAlice } = await installerAlice.getLocalUser()
  const { registrationId: registrationIdJamie, deviceId: deviceIdJamie } = await installerJamie.getLocalUser()
  const addressBob = new libsignal.SignalProtocolAddress(registrationIdBob, deviceIdBob)
  const addressJamie = new libsignal.SignalProtocolAddress(registrationIdJamie, deviceIdJamie)
  const addressAlice = new libsignal.SignalProtocolAddress(registrationIdAlice, deviceIdAlice)

  await communicatorAlice.connect(addressBob)
  await communicatorAlice.connect(addressJamie)

  eventStreamBob.stream(event => communicatorBob.send(addressAlice, event))
  eventStreamJamie.stream(event => communicatorJamie.send(addressAlice, event))

  communicatorAlice.stream((address, event) => {
    if (address.toString() === addressBob.toString()) {
      eventStreamAlice.add(event)
    }
  })

  eventStreamAlice.stream(spy)
  eventStreamBob.add(eventBobToAlice)
  eventStreamJamie.add(eventJamieToAlice)

  await new Promise(resolve => setTimeout(resolve, 100))

  expect(spy).toHaveBeenCalledWith(eventBobToAlice)
  expect(spy).not.toHaveBeenCalledWith(eventJamieToAlice)
})

test('Streaming encrypted events peer to peer with Example Signal implementations using Identifiers instead of addresses', async () => {
  const storeBob = new InMemorySignalProtocolStore()
  const installerBob = new SignalUserInstaller(storeBob)
  const signatorBob = new SignalSignator(storeBob)
  const eventStreamBob = new ExampleEventStream()
  const serializerBob = new ExampleJsonEventSerializer()
  const communicatorBob = new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeBob, serializerBob, installerBob, signatorBob)
  await communicatorBob.setup()

  const storeAlice = new InMemorySignalProtocolStore()
  const installerAlice = new SignalUserInstaller(storeAlice)
  const signatorAlice = new SignalSignator(storeAlice)
  const eventStreamAlice = new ExampleEventStream()
  const serializerAlice = new ExampleJsonEventSerializer()
  const communicatorAlice = new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeAlice, serializerAlice, installerAlice, signatorAlice)
  await communicatorAlice.setup()

  const storeJamie = new InMemorySignalProtocolStore()
  const installerJamie = new SignalUserInstaller(storeJamie)
  const signatorJamie = new SignalSignator(storeJamie)
  const eventStreamJamie = new ExampleEventStream()
  const serializerJamie = new ExampleJsonEventSerializer()
  const communicatorJamie = new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeJamie, serializerJamie, installerJamie, signatorJamie)
  await communicatorJamie.setup()

  const eventBobToAlice = { id: Math.random().toString(), type: Math.random().toString() }
  const eventJamieToAlice = { id: Math.random().toString(), type: Math.random().toString() }
  const spy = jest.fn()

  const { identifier: identifierBob } = await installerBob.getLocalUser()
  const { identifier: identifierAlice } = await installerAlice.getLocalUser()
  const { identifier: identifierJamie } = await installerJamie.getLocalUser()

  await communicatorBob.connect(identifierAlice)
  await communicatorJamie.connect(identifierAlice)
  await communicatorAlice.connect(identifierBob)
  await communicatorAlice.connect(identifierJamie)

  eventStreamBob.stream(event => communicatorBob.send(identifierAlice, event))
  eventStreamJamie.stream(event => communicatorJamie.send(identifierAlice, event))

  communicatorAlice.stream((identifier, event) => {
    if (identifier === identifierBob) {
      eventStreamAlice.add(event)
    }
  })

  eventStreamAlice.stream(spy)
  eventStreamBob.add(eventBobToAlice)
  eventStreamJamie.add(eventJamieToAlice)

  await new Promise(resolve => setTimeout(resolve, 100))

  expect(spy).toHaveBeenCalledWith(eventBobToAlice)
  expect(spy).not.toHaveBeenCalledWith(eventJamieToAlice)
})

class Messenger {
  public identifier?: string
  public messages: IMessage[] = []

  constructor(private communicator: IPeerToPeerCommunicator<string, IEvent, IUser>) {}

  async setup(): Promise<void> {
    const { identifier } = await this.communicator.setup()
    this.identifier = identifier
    this.communicator.stream((identifier, event) => {
      this.messages.push({ recipient: this.identifier!, sender: identifier, body: event.body, timestamp: event.timestamp })
    })
  }

  async connect(identifier: string): Promise<void> {
    await this.communicator.connect(identifier)
  }

  async send(identifier: string, { body, timestamp }: { body: string, timestamp: number }): Promise<void> {
    const event = { id: 'test', type: 'test', body, timestamp }
    this.messages.push({ recipient: identifier, sender: this.identifier!, body, timestamp })
    await this.communicator.send(identifier, event)
  }

  async safetyNumberWith(identifier: string): Promise<string> {
    return await this.communicator.safetyNumberFor(identifier)
  }
}

test('Two users messaging', async () => {
  const storeFox = new InMemorySignalProtocolStore()
  const installerFox = new SignalUserInstaller(storeFox)
  const signatorFox = new SignalSignator(storeFox)
  const serializerFox = new ExampleJsonEventSerializer()
  const messengerFox = new Messenger(new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeFox, serializerFox, installerFox, signatorFox))
  await messengerFox.setup()

  const storeDana = new InMemorySignalProtocolStore()
  const installerDana = new SignalUserInstaller(storeDana)
  const signatorDana = new SignalSignator(storeDana)
  const serializerDana = new ExampleJsonEventSerializer()
  const messengerDana = new Messenger(new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeDana, serializerDana, installerDana, signatorDana))
  await messengerDana.setup()

  await messengerFox.connect(messengerDana.identifier!)
  await messengerDana.connect(messengerFox.identifier!)

  const now = Date.now()

  await messengerFox.send(messengerDana.identifier!, { body: 'the truth is out there', timestamp: now })
  await messengerDana.send(messengerFox.identifier!, { body: 'but so are lies', timestamp: now + 2000 })

  expect(messengerFox.messages).toEqual([
    { sender: messengerFox.identifier, recipient: messengerDana.identifier, body: 'the truth is out there', timestamp: now },
    { sender: messengerDana.identifier, recipient: messengerFox.identifier, body: 'but so are lies', timestamp: now + 2000 },
  ])

  expect(messengerDana.messages).toEqual([
    { sender: messengerFox.identifier, recipient: messengerDana.identifier, body: 'the truth is out there', timestamp: now },
    { sender: messengerDana.identifier, recipient: messengerFox.identifier, body: 'but so are lies', timestamp: now + 2000 },
  ])
})

test('Two users comparing safety numbers', async () => {
  const storeFox = new InMemorySignalProtocolStore()
  const installerFox = new SignalUserInstaller(storeFox)
  const signatorFox = new SignalSignator(storeFox)
  const serializerFox = new ExampleJsonEventSerializer()
  const messengerFox = new Messenger(new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeFox, serializerFox, installerFox, signatorFox))
  await messengerFox.setup()

  const storeDana = new InMemorySignalProtocolStore()
  const installerDana = new SignalUserInstaller(storeDana)
  const signatorDana = new SignalSignator(storeDana)
  const serializerDana = new ExampleJsonEventSerializer()
  const messengerDana = new Messenger(new ExampleSignalPeerToPeerCommunicatorWithIdentifiers(storeDana, serializerDana, installerDana, signatorDana))
  await messengerDana.setup()

  await messengerFox.connect(messengerDana.identifier!)
  await messengerDana.connect(messengerFox.identifier!)

  const safetyNumberFox = await messengerFox.safetyNumberWith(messengerDana.identifier!)
  const safetyNumberDana = await messengerDana.safetyNumberWith(messengerFox.identifier!)

  expect(safetyNumberFox).toEqual(safetyNumberDana)
  expect(safetyNumberFox.length).toEqual(60)

  // .matchAll(/\w{5}/g).map((match: RegExpMatchArray) => match[0])
})
