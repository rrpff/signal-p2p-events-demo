import { IMessagingState, IAddMessageEvent, IEvent } from '../interfaces'

export const DEFAULT_STATE: IMessagingState = {
  user: undefined,
  username: undefined,
  contacts: [],
  conversations: [],
  messages: []
}

const createConversation = (state: IMessagingState, event: IAddMessageEvent) => ({
  id: event.conversationId,
  participantIds: [state.user?.identifier!, event.user.identifier]
})

const createMessage = (_: IMessagingState, event: IAddMessageEvent) => ({
  id: event.id,
  senderId: event.user.identifier,
  conversationId: event.conversationId,
  body: event.body,
  timestamp: event.timestamp,
  acks: [event.user.identifier],
  delivered: false
})

export const reducer = (state: IMessagingState, event: IEvent): IMessagingState => {
  switch (event.type) {
    case 'INSTALLATION':
      return { ...state, user: event.user }
    case 'ADD_CONTACT':
      return event.user.identifier === state.user?.identifier
        ? { ...state }
        : { ...state, contacts: [...state.contacts, { user: event.user, username: event.username }] }
    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: [
          ...state.conversations.filter(conversation => conversation.id !== event.conversationId),
          createConversation(state, event)
        ],
        messages: [...state.messages, createMessage(state, event)]
      }
    case 'SET_USER_DETAILS':
      return state.user === undefined
        ? { ...state }
        : { ...state, username: event.username }
    case 'ACK_EVENT':
      return event.eventType !== 'ADD_MESSAGE'
        ? { ...state }
        : { ...state, messages: state.messages.map(message => message.id !== event.eventId
          ? message
          : {
            ...message,
            acks: [...message.acks, event.user.identifier],
            delivered: state.conversations.find(conversation => conversation.id === message.conversationId)!.participantIds.every(id => {
              return ([...message.acks, event.user.identifier]).includes(id)
            })
          })
        }
    default:
      return state
  }
}
