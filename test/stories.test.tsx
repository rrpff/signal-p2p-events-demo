import React from 'react'
import renderer from 'react-test-renderer'
import { resolve } from 'path'
import globby from 'globby'
import { stories as storyGlobs } from '../.storybook/main'

const stories = globby.sync(storyGlobs.map(glob => resolve(__dirname, glob)))

stories.forEach(path => {
  const story = require(path)
  const meta = story.default
  const examples = Object.keys(story).filter(key => key !== 'default')

  describe(`Stories › ${meta.title}`, () => {
    examples.forEach(name => {
      test(name, () => {
        const Component = meta.component
        const args = story[name].args
        const tree = renderer
          .create(<Component {...args} />)
          .toJSON()

        expect(tree).toMatchSnapshot()
      })
    })
  })
})
