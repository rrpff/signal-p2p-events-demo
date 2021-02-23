import InMemoryStore from './InMemoryStore'

describe('when a key has been set', () => {
  it.each([
    ['test', true],
    ['cool', 'yep'],
  ])('#get should get the value for the given key', (key, value) => {
    const store = new InMemoryStore()
    store.set(key, value)

    expect(store.get(key)).toEqual(value)
  })

  it('#remove should remove it', () => {
    const key = Math.random().toString()
    const store = new InMemoryStore()

    store.set(key, true)
    store.remove(key)

    expect(store.get(key)).toBeUndefined()
  })

  it('#append should add to it', () => {
    const key = Math.random().toString()
    const store = new InMemoryStore()

    store.set(key, [123])
    store.append(key, 456)

    expect(store.get(key)).toEqual([123, 456])
  })
})

describe('when a key has NOT been set', () => {
  it('#get should return undefined', () => {
    const store = new InMemoryStore()
    expect(store.get('testing')).toBeUndefined()
  })

  it.each([
    ['test', undefined],
    ['wicked', 'great'],
    ['cool', 123]
  ])('#get should return the default value if given', (key, defaultValue) => {
    const store = new InMemoryStore()

    expect(store.get(key, defaultValue)).toEqual(defaultValue)
  })

  it('#remove should do nothing', () => {
    const key = Math.random().toString()
    const store = new InMemoryStore()
    store.remove(key)
  })

  it('#append should create it and add to it', () => {
    const key = Math.random().toString()
    const store = new InMemoryStore()

    store.append(key, 123)

    expect(store.get(key)).toEqual([123])
  })

  describe('and it is not an array', () => {
    it('#append should throw an error', () => {
      const key = Math.random().toString()
      const store = new InMemoryStore()

      store.set(key, '123')

      expect(() => store.append(key, 456)).toThrow(`${key} is not an array`)
    })
  })
})

describe('subscribing to keys', () => {
  it('should call the handler function every time it is changed', async () => {
    const spy = jest.fn()
    const key = Math.random().toString()
    const store = new InMemoryStore()

    store.subscribe(key, spy)

    store.set(key, [123])
    store.append(key, 456)

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenCalledWith([123])
    expect(spy).toHaveBeenCalledWith([123, 456])
  })
})
