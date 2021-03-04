/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import { Avatar } from '../Avatar'
import { Message } from './Message'

export interface IMessageGroupProps {
  sender: { identifier: string, username: string, colour: string }
  messages: { body: string, timestamp: number }[]
  alignment: 'left' | 'right'
  messageBackground: string
  messageColour: string
}

export const MessageGroup = ({ sender, messages, alignment, messageBackground, messageColour }: IMessageGroupProps) => {
  const lastMessage = messages[messages.length - 1]

  const avatarElement = (
    <div css={css`
      padding: 5px;
      display: flex;
      align-self: flex-end;
    `}>
      <Avatar username={sender.username} colour={sender.colour} />
    </div>
  )

  const messageElements = (
    <div style={{ textAlign: alignment }}>
      {messages.map(message =>
        <Message message={{ username: sender.username, body: message.body }} background={messageBackground} colour={messageColour} />
      )}

      <span css={css`
        font-size: 10px;
        color: #aaa;
        padding: ${alignment === 'right' ? '0 10px 0 0' : '0 0 0 10px'};
      `}>
        {new Date(lastMessage.timestamp).toTimeString().slice(0, 8)}
      </span>
    </div>
  )

  return (
    <div css={css`
      padding: 8px 0;
      display: flex;
      justify-content: ${alignment};
      align-items: ${alignment === 'right' ? 'flex-end' : 'flex-start'};
    `}>
      {alignment === 'left' && avatarElement}
      {messageElements}
      {alignment === 'right' && avatarElement}
    </div>
  )
}
