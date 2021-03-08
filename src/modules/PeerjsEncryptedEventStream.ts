import { IEvent, IPeerToPeerEventStream, IStore, IUser } from '../interfaces'
import { IEventSubscriber } from '../packages/event-stream/interfaces'
import { ISignal, ISignalCiphertext, ISignalProtocolAddress, ISignalSignator, ISignalUserInstaller } from '../packages/signal-session/interfaces'
import JsonEventSerializer from './JsonEventSerializer'
import JsonInviteSerializer from './JsonInviteSerializer'

declare var Peer: any
declare var libsignal: ISignal

const CHANNEL_ID = '01F07WMZ2J7ZD725X25VJ6NE6J'

export interface IPeerjsAddress {
  userIdentifier: string
  address: ISignalProtocolAddress
}

export default class PeerjsEncryptedEventStream implements IPeerToPeerEventStream<JsonEventSerializer, string> {
  private eventSerializer: JsonEventSerializer = new JsonEventSerializer()
  private inviteSerializer: JsonInviteSerializer = new JsonInviteSerializer()
  private user?: IUser
  private localPeerId?: string
  private localSignalAddress?: ISignalProtocolAddress
  private conn?: any
  private remotes: any[] = []
  private subscribers: IEventSubscriber<IEvent>[] = []
  public inviteCode?: string

  constructor(
    private store: IStore,
    private installer: ISignalUserInstaller<IUser>,
    private signator: ISignalSignator<ISignalProtocolAddress, ISignalCiphertext>
  ) {}

  async setup() {
    await this.installer.install()
    this.user = await this.installer.getLocalUser()
    this.localPeerId = `${CHANNEL_ID}_${this.user.identifier}`
    this.localSignalAddress = new libsignal.SignalProtocolAddress(this.user.registrationId, this.user.deviceId)

    const preKeyBundle = await this.signator.createPreKeyBundle()
    this.inviteCode = this.inviteSerializer.serialize({ user: this.user!, preKeyBundle })

    this.store.subscribe('contacts', v => console.log('contacts', v))
    this.store.subscribe('received-invites', v => console.log('received-invites', v))
    this.store.subscribe('sent-invites', v => console.log('sent-invites', v))

    this.conn = new Peer(this.localPeerId)
    this.conn.on('connection', (remote: any) => {
      console.log(`${remote.peer} connected!`)

      remote.on('data', async (data: any) => {
        console.log(`${remote.peer} sent ${data}`)

        try {
          const message = JSON.parse(data)

          if (message.type === 'INVITE') {
            const invite = this.inviteSerializer.deserialize(message.invite)
            const address = new libsignal.SignalProtocolAddress(invite.user.registrationId, invite.user.deviceId)
            await this.signator.createSession(address, invite.preKeyBundle)

            const connectedRemote = this.conn.connect(remote.peer)
            connectedRemote.send(JSON.stringify({ type: 'INVITE', invite }))

            this.store.set(`address-book-${connectedRemote.peer}`, address.toString())
            this.remotes.push(connectedRemote)
          }

          if (message.type === 'EVENT') {
            const address = libsignal.SignalProtocolAddress.fromString(message.address)
            const decrypted = await this.signator.decrypt(address, message.payload)
            const event = JSON.parse(decrypted)

            this.subscribers.forEach(subscriber => subscriber(event))
          }

        } catch (e) {
          console.error(`Invalid message: ${data}`)
          console.error(e)
        }
      })
    })
  }

  async sync(inviteCode: string): Promise<void> {
    console.log(inviteCode)
    console.log(JSON.parse(inviteCode))
    const invite = this.inviteSerializer.deserialize(inviteCode)
    const address = new libsignal.SignalProtocolAddress(invite.user.registrationId, invite.user.deviceId)
    await this.signator.createSession(address, invite.preKeyBundle)

    const remotePeerId = `${CHANNEL_ID}_${invite.user.identifier}`
    const remote = this.conn.connect(remotePeerId)

    this.store.set(`address-book-${remote.peer}`, address.toString())
    this.remotes.push(remote)

    console.log(`trying to connect to ${remotePeerId}`)
    remote.on('open', () => {
      console.log(`connected to ${remote.peer}`)

      remote.send(JSON.stringify({ type: 'INVITE', invite: this.inviteCode }))
    })
  }

  subscribe(subscriber: IEventSubscriber<IEvent>): void {
    this.subscribers.push(subscriber)
  }

  async push(event: IEvent): Promise<void> {
    console.log('pushing')
    console.log(this.remotes)

    this.subscribers.forEach(subscriber => subscriber(event))

    await Promise.all(this.remotes.map(async remote => {
      console.log(`pushing ${event} to ${remote.peer}`)

      const address = this.store.get(`address-book-${remote.peer}`)
      if (!address) return console.error(`address not set for ${remote.peer}`)

      const payload = await this.signator.encrypt(
        libsignal.SignalProtocolAddress.fromString(address as string),
        JSON.stringify(event)
      )

      remote.send(JSON.stringify({ type: 'EVENT', address: this.localSignalAddress?.toString(), payload }))
      console.log(`sent ${JSON.stringify({ type: 'EVENT', address: this.localSignalAddress?.toString(), payload })}`)
    }))
  }
}
