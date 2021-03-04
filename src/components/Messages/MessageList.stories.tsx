import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { createRng, pick } from '../../helpers/random'

import { MessageList, IMessageListProps } from './MessageList'
import UsernameGenerator from '../../modules/UsernameGenerator'

export default {
  title: 'Messages/MessageList',
  component: MessageList
} as Meta

const rng = createRng()

const randomColour = () => `hsla(${rng() * 360}, ${25 + rng() * 75}%, 50%, 100%)`
const createUser = () => ({ identifier: rng().toString(), username: UsernameGenerator.generate(), colour: randomColour() })
const createMessages = (users: { identifier: string, username: string, colour: string }[], numMessages: number) => {
  const messages = []

  for (let i = 0; i < numMessages; i++) {
    const words = []
    for (let i = 0; i < 1 + (rng() * 10); i++)
      words.push(pick(rng, UsernameGenerator.WORDS))

    messages.push({ sender: pick(rng, users), body: words.join(' '), timestamp: Date.parse('2021-01-01') })
  }

  return messages
}

const TWO_USERS = [createUser(), createUser()]
const SEVERAL_USERS = [createUser(), createUser(), createUser(), createUser(), createUser(), createUser()]
const PRIMARY_STYLE = { alignment: 'right', background: '#3255da', colour: '#fff' }
const SECONDARY_STYLE = { alignment: 'left', background: '#ededed', colour: '#111' }

const Template: Story<IMessageListProps> = (args) => <MessageList {...args} />

export const TwoUsers = Template.bind({})
TwoUsers.args = {
  messages: createMessages(TWO_USERS, 6),
  styleFor: user => user.identifier === TWO_USERS[0].identifier ? PRIMARY_STYLE : SECONDARY_STYLE
}

export const TwoUsersLong = Template.bind({})
TwoUsersLong.args = {
  messages: createMessages(TWO_USERS, 50),
  styleFor: user => user.identifier === TWO_USERS[0].identifier ? PRIMARY_STYLE : SECONDARY_STYLE
}

export const SeveralUsers = Template.bind({})
SeveralUsers.args = {
  messages: createMessages(SEVERAL_USERS, 100),
  styleFor: user => user.identifier === SEVERAL_USERS[0].identifier ? PRIMARY_STYLE : SECONDARY_STYLE
}
