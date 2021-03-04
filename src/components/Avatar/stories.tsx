import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'

import { Avatar, IAvatarProps } from './'

export default {
  title: 'Avatar',
  component: Avatar,
  argTypes: {
    colour: { control: 'color' },
  },
} as Meta

const Template: Story<IAvatarProps> = (args) => <Avatar {...args} />

export const Default = Template.bind({})
Default.args = {
  username: 'example',
  colour: 'limegreen'
}
