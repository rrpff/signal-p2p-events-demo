import { IEventStream } from './packages/event-stream/interfaces'
import { ISignalPreKeyBundle } from './packages/signal-session/interfaces'

type PlainType<T> = T extends ISerializer<infer T1, unknown> ? T1 : never

export interface ISerializer<TPlain, TSerialized> {
  serialize(plain: TPlain): TSerialized
  deserialize(serialized: TSerialized): TPlain
}

export interface IPeerToPeerEventStream<TSerializer, TAddress> extends IEventStream<PlainType<TSerializer>> {
  sync(address: TAddress): void
}

export interface IUser {
  identifier: string
  registrationId: number
  deviceId: number
}

export interface IStore {
  set<T>(key: string, value: T): void
  get<T>(key: string, defaultValue?: T): T
  append<T>(key: string, value: T): void
  remove(key: string): void
  subscribe<T>(key: string, handler: (value: T) => void): void
}

export interface IBaseEvent {
  id: string
  type: string
  [key: string]: any
}

export type IInstallationEvent = { id: string, type: 'INSTALLATION', user: IUser }
export type IAddContactEvent = { id: string, type: 'ADD_CONTACT', user: IUser, username: string }
export type ISetUserDetailsEvent = { id: string, type: 'SET_USER_DETAILS', user: IUser, username: string }
export type IAddMessageEvent = { id: string, type: 'ADD_MESSAGE', user: IUser, conversationId: string, body: string, timestamp: number }
export type IAckEvent = { id: string, type: 'ACK_EVENT', user: IUser, eventId: string, eventType: IEvent['type'] }
export type IEvent =
  | IInstallationEvent
  | IAddContactEvent
  | ISetUserDetailsEvent
  | IAddMessageEvent
  | IAckEvent

export interface IContact {
  user: IUser
  username: string
}

export interface IConversation {
  id: string
  participantIds: string[]
}

export interface IMessage {
  id: string
  senderId: string
  conversationId: string
  body: string
  timestamp: number
  acks: string[]
  delivered: boolean
}

export interface IMessagingState {
  user?: IUser
  username?: string
  contacts: IContact[]
  conversations: IConversation[]
  messages: IMessage[]
}

export interface IPeerToPeerCommunicator<TAddress, TInput, TUser extends { identifier: string }> {
  setup(): Promise<TUser>
  connect(address: TAddress): void
  send(address: TAddress, message: TInput): void
  stream(handler: (address: TAddress, message: TInput) => void): void
  safetyNumberFor(address: TAddress): Promise<string>
}

export interface IInvite {
  user: IUser
  preKeyBundle: ISignalPreKeyBundle
}
