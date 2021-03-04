import UsernameGenerator from './UsernameGenerator'

it('should generate a username', () => {
  expect(UsernameGenerator.generate()).toMatch(/^\w*_\w*_\w*$/)
})

it('should not reuse words', () => {
  const rng = (() => {
    const numWords = UsernameGenerator.WORDS.length
    let index = 0
    let values = [0, 0, 0, 0, 1 / numWords, 2 / numWords, 3 / numWords]
    return () => values[index++]
  })()

  expect(UsernameGenerator.generate(rng)).toEqual(UsernameGenerator.WORDS.slice(0, 3).join('_'))
})
