import TypeFaker from './'
import WORDS from './words.json' // Words from: https://www.random-generator.org.uk/words/

interface IAnimal {
  name: string
  age?: number
}

describe('TypeFaker', () => {
  it('should call the given faker function for each key specified', () => {
    const random = Math.random()
    const faker = new TypeFaker<IAnimal>({
      name: () => 'kepler',
      age: () => random
    })

    expect(faker.generate()).toEqual({ name: 'kepler', age: random })
  })

  it('should support only generating with mandatory properties', () => {
    const faker = new TypeFaker<IAnimal>({
      name: () => 'kepler'
    })

    expect(faker.generate()).toEqual({ name: 'kepler' })
  })

  it('should support overriding properties when generating', () => {
    const faker = new TypeFaker<IAnimal>({
      name: () => 'kepler'
    })

    expect(faker.generate({ age: 2 })).toEqual({ name: 'kepler', age: 2 })
  })

  it('should support TypeFaker helper functions', () => {
    const faker = new TypeFaker<IAnimal>({
      name: TypeFaker.word(),
      age: TypeFaker.integer(),
    })

    const generated = faker.generate()
    expect(typeof generated.name).toEqual('string')
    expect(typeof generated.age).toEqual('number')
  })
})

describe('TypeFaker.static', () => {
  it('should return a function which returns the value', () => {
    const value = Math.random()
    expect(TypeFaker.static(value)()).toEqual(value)
  })
})

describe('TypeFaker.word', () => {
  it('should return a function which returns a word', () => {
    expect(WORDS).toContain(TypeFaker.word()())
  })
})

describe('TypeFaker.letter', () => {
  it('should return a function which returns a letter', () => {
    expect(TypeFaker.letter()()).toMatch(/^[a-z]$/)
  })
})

describe('TypeFaker.integer', () => {
  it('should return a function which returns a number', () => {
    const number = TypeFaker.integer()()

    expect(typeof number).toEqual('number')
    expect(Math.floor(number)).toEqual(number)
  })
})

describe('TypeFaker.ulid', () => {
  it('should return something sort of resembling a ulid', () => {
    const ulid = TypeFaker.ulid()()
    expect(ulid).toMatch(/^[A-Z0-9]{26}$/)
  })
})
