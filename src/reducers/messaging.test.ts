// event2.id = [event1.user.identifier, event2.user.identifier].sort().join(':')

import { IEvent, IMessagingState } from '../interfaces'
import { DEFAULT_STATE, reducer } from './messaging'
import { InstallationEventFaker, AddContactEventFaker, AddMessageEventFaker, SetUserDetailsEventFaker, AckEventFaker } from '../fakers'

test('an INSTALLATION event should set the current user', () => {
  const event = InstallationEventFaker.generate()
  const state = apply([event])

  expect(state.user).toEqual(event.user)
})

test('an ADD_CONTACT event should add a contact', () => {
  const event = AddContactEventFaker.generate()
  const state = apply([event])

  expect(state.contacts).toEqual([{ user: event.user, username: event.username }])
})

test('an ADD_CONTACT event for the current user should not add a contact', () => {
  const event1 = InstallationEventFaker.generate()
  const event2 = AddContactEventFaker.generate({ user: event1.user })
  const state = apply([event1, event2])

  expect(state.contacts).toEqual([])
})

test('multiple ADD_CONTACT events should add multiple contacts', () => {
  const event1 = AddContactEventFaker.generate()
  const event2 = AddContactEventFaker.generate()
  const event3 = AddContactEventFaker.generate()
  const state = apply([event1, event2, event3])

  expect(state.contacts).toEqual([
    { user: event1.user, username: event1.username },
    { user: event2.user, username: event2.username },
    { user: event3.user, username: event3.username }
  ])
})

test('an ADD_MESSAGE event for a new conversation should create a new conversation', () => {
  const event1 = InstallationEventFaker.generate()
  const event2 = AddMessageEventFaker.generate()
  const state = apply([event1, event2])

  expect(state.conversations).toEqual([{
    id: event2.conversationId,
    participantIds: [event1.user.identifier, event2.user.identifier]
  }])
})

test('sequential ADD_MESSAGE events for the same conversation should not recreate the conversation', () => {
  const event1 = InstallationEventFaker.generate()
  const event2 = AddMessageEventFaker.generate({ conversationId: 'testooo' })
  const event3 = AddMessageEventFaker.generate({ conversationId: 'testooo', user: event2.user })
  const event4 = AddMessageEventFaker.generate({ conversationId: 'testooo', user: event2.user })
  const state = apply([event1, event2, event3, event4])

  expect(state.conversations).toEqual([{
    id: 'testooo',
    participantIds: [event1.user.identifier, event2.user.identifier]
  }])
})

test('an ADD_MESSAGE event should append a message', () => {
  const event = AddMessageEventFaker.generate()
  const state = apply([event])

  expect(state.messages).toEqual([{
    id: event.id,
    senderId: event.user.identifier,
    conversationId: event.conversationId,
    body: event.body,
    timestamp: event.timestamp,
    acks: [event.user.identifier],
    delivered: false
  }])
})

test('multiple ADD_MESSAGE events should append multiple messages', () => {
  const state = apply([
    AddMessageEventFaker.generate(),
    AddMessageEventFaker.generate(),
    AddMessageEventFaker.generate()
  ])

  expect(state.messages.length).toEqual(3)
})

test('a SET_USER_DETAILS event for the current user should change its details', () => {
  const event1 = InstallationEventFaker.generate()
  const event2 = SetUserDetailsEventFaker.generate()
  const state = apply([event1, event2])

  expect(state.username).toEqual(event2.username)
})

test('a SET_USER_DETAILS event when there is no current user should do nothing', () => {
  const event = SetUserDetailsEventFaker.generate()
  const state = apply([event])

  expect(state.username).toEqual(undefined)
})

test('an ACK_EVENT event for a message should add an ack to that message', () => {
  const event1 = InstallationEventFaker.generate()
  const event2 = AddMessageEventFaker.generate()
  const event3 = AckEventFaker.generate({ eventType: 'ADD_MESSAGE', user: event1.user, eventId: event2.id })
  const state = apply([event1, event2, event3])

  expect(state.messages[0].acks).toEqual([event2.user.identifier, event1.user.identifier])
})

test('ACK_EVENT events should determine if a message has been delivered', () => {
  const event1 = InstallationEventFaker.generate()
  const event2 = AddMessageEventFaker.generate()
  const event3 = AckEventFaker.generate({ eventType: 'ADD_MESSAGE', user: event1.user, eventId: event2.id })

  const state1 = apply([event1, event2])
  const state2 = apply([event1, event2, event3])

  expect(state1.messages[0].delivered).toEqual(false)
  expect(state2.messages[0].delivered).toEqual(true)
})

const apply = (events: IEvent[], state = DEFAULT_STATE): IMessagingState => {
  if (events.length === 0) return state
  return apply(events.slice(1), reducer(state, events[0]))
}
