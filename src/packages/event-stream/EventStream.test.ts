import EventStream from './EventStream'

test('it passes events received to subscribers', () => {
  const event = Math.random()
  const subscriber = jest.fn()
  const stream = new EventStream<number>()

  stream.subscribe(subscriber)
  stream.push(event)

  expect(subscriber).toHaveBeenCalledWith(event)
})

test('it passes events received to multiple subscribers', () => {
  const event = Math.random()
  const subscriber1 = jest.fn()
  const subscriber2 = jest.fn()
  const stream = new EventStream<number>()

  stream.subscribe(subscriber1)
  stream.subscribe(subscriber2)
  stream.push(event)

  expect(subscriber1).toHaveBeenCalledWith(event)
  expect(subscriber2).toHaveBeenCalledWith(event)
})
