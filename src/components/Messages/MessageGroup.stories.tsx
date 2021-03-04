import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import { createRng, pick } from '../../helpers/random'

import { MessageGroup, IMessageGroupProps } from './MessageGroup'
import UsernameGenerator from '../../modules/UsernameGenerator'

export default {
  title: 'Messages/MessageGroup',
  component: MessageGroup
} as Meta

const rng = createRng()

const randomColour = () => `hsla(${rng() * 360}, ${25 + rng() * 75}%, 50%, 100%)`
const createUser = () => ({ identifier: '123', username: UsernameGenerator.generate(), colour: randomColour() })
const createMessages = (numMessages: number) => {
  const messages = []

  for (let i = 0; i < numMessages; i++) {
    const words = []
    for (let i = 0; i < 1 + (rng() * 10); i++)
      words.push(pick(rng, UsernameGenerator.WORDS))

    messages.push({ body: words.join(' '), timestamp: Date.parse('2021-01-01') })
  }

  return messages
}

const Template: Story<IMessageGroupProps> = (args) => <MessageGroup {...args} />

export const Primary = Template.bind({})
Primary.args = {
  sender: createUser(),
  messages: createMessages(5),
  alignment: 'right',
  messageBackground: '#3255da',
  messageColour: '#fff'
}

export const Secondary = Template.bind({})
Secondary.args = {
  sender: createUser(),
  messages: createMessages(5),
  alignment: 'left',
  messageBackground: '#ededed',
  messageColour: '#111'
}

export const Long = Template.bind({})
Long.args = {
  sender: createUser(),
  messages: createMessages(50),
  alignment: 'left',
  messageBackground: '#ededed',
  messageColour: '#111'
}
