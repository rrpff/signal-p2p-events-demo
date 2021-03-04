/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'

export interface IAvatarProps {
  username: string
  colour: string
}

export const Avatar = ({ username, colour }: IAvatarProps) => (
  <span title={username} css={css`
    align-items: center;
    border-radius: 50%;
    color: #fff;
    display: inline-flex;
    font-weight: bold;
    height: 30px;
    justify-content: center;
    text-align: center;
    width: 30px;
    font-size: 18px;
    background: ${colour}
  `}>
    {username.slice(0, 1).toUpperCase()}
  </span>
)
