import { IUser, IInstallationEvent, IAddContactEvent, ISetUserDetailsEvent, IAddMessageEvent, IAckEvent, IBaseEvent } from './interfaces'
import TypeFaker from './packages/type-faker'

export const UserFaker = new TypeFaker<IUser>({
  identifier: TypeFaker.ulid(),
  registrationId: TypeFaker.integer(),
  deviceId: TypeFaker.integer()
})

export const EventFaker = new TypeFaker<IBaseEvent>({
  id: TypeFaker.ulid(),
  type: TypeFaker.word()
})

export const InstallationEventFaker = EventFaker.extend<IInstallationEvent>({
  type: TypeFaker.static('INSTALLATION'),
  user: UserFaker
})

export const AddContactEventFaker = EventFaker.extend<IAddContactEvent>({
  type: TypeFaker.static('ADD_CONTACT'),
  user: UserFaker,
  username: TypeFaker.word()
})

export const SetUserDetailsEventFaker = EventFaker.extend<ISetUserDetailsEvent>({
  type: TypeFaker.static('SET_USER_DETAILS'),
  user: UserFaker,
  username: TypeFaker.word()
})

export const AddMessageEventFaker = EventFaker.extend<IAddMessageEvent>({
  type: TypeFaker.static('ADD_MESSAGE'),
  user: UserFaker,
  conversationId: TypeFaker.ulid(),
  body: TypeFaker.word(),
  timestamp: () => Number(TypeFaker.date()())
})

export const AckEventFaker = EventFaker.extend<IAckEvent>({
  type: TypeFaker.static('ACK_EVENT'),
  user: UserFaker,
  eventId: TypeFaker.ulid(),
  eventType: TypeFaker.word()
})
