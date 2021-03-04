/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

export interface IMessageProps {
  message: { username: string, body: string }
  background: string
  colour: string
}

export const Message = ({ message, background, colour }: IMessageProps) => {
  const style = css`
    display: block;
    margin: 5px 0;

    span {
      display: inline-block;
      background: ${background};
      color: ${colour};
      padding: 14px 12px 12px;
      border-radius: 10px;
      max-width: 80%;
      text-align: left;
    }
  `

  return (
    <span css={style}>
      <span>
        {message.body}
      </span>
    </span>
  )
}
