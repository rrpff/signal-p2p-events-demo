import React from 'react'
import { MessageGroup } from './MessageGroup'

type ISender = { identifier: string, username: string, colour: string }
type IMessage = { sender: ISender, body: string, timestamp: number }
type IStyle = { alignment: string, background: string, colour: string }
type IMessageGroup = { sender: ISender, style: IStyle, messages: { body: string, timestamp: number }[] }

export interface IMessageListProps {
  messages: { sender: { identifier: string, username: string, colour: string }, body: string, timestamp: number }[]
  styleFor: (sender: ISender) => IStyle
}

export const MessageList = ({ messages, styleFor }: IMessageListProps) => {
  const groups = messages.reduce((groups: IMessageGroup[], message: IMessage): IMessageGroup[] => {
    const lastGroupIndex = groups.length - 1
    const lastGroup = groups[lastGroupIndex]

    if (lastGroup !== undefined && lastGroup.sender.identifier === message.sender.identifier)
      return groups.map((group, index) => index < lastGroupIndex ? group : { ...group, messages: [...group.messages, message] })

    return [...groups, { sender: message.sender, style: styleFor(message.sender), messages: [message] }]
  }, [])

  return (
    <>
      {groups.map((group, index) =>
        <MessageGroup
          key={index}
          sender={group.sender}
          messages={group.messages}
          alignment={group.style.alignment as 'left' | 'right'}
          messageBackground={group.style.background}
          messageColour={group.style.colour}
        />
      )}
    </>
  )
}
