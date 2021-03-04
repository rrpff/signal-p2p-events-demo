import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { Message, IMessageProps } from './Message'

export default {
  title: 'Messages/Message',
  component: Message,
  argTypes: {
    background: { control: 'color' },
    colour: { control: 'color' },
  }
} as Meta

const Template: Story<IMessageProps> = (args) => <Message {...args} />

export const Primary = Template.bind({})
Primary.args = {
  message: { username: 'example', body: 'this is a test message' },
  background: '#3255da',
  colour: '#fff'
}

export const Secondary = Template.bind({})
Secondary.args = {
  message: { username: 'friend', body: 'what is up' },
  background: '#ededed',
  colour: '#111'
}

export const Long = Template.bind({})
Long.args = {
  message: { username: 'friend', body: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Minus inventore delectus, sunt libero, odit non quidem, eum est quae reiciendis autem debitis? Quae id repudiandae quod voluptatem. Aperiam, consectetur maxime.' },
  background: '#ededed',
  colour: '#111'
}
