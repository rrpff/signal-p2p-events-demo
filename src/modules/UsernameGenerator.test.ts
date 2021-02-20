import UsernameGenerator from './UsernameGenerator'

const ORIGINAL_MATH_RANDOM = window.Math.random
afterEach(() => window.Math.random = ORIGINAL_MATH_RANDOM)

it('should generate a username', () => {
  expect(UsernameGenerator.generate()).toMatch(/^\w*_\w*_\w*$/)
})

it('should not reuse words', () => {
  window.Math.random = (() => {
    const numWords = UsernameGenerator.WORDS.length
    let index = 0
    let values = [0, 0, 0, 0, 1 / numWords, 2 / numWords, 3 / numWords]
    return () => values[index++]
  })()

  expect(UsernameGenerator.generate()).toEqual(UsernameGenerator.WORDS.slice(0, 3).join('_'))
})
