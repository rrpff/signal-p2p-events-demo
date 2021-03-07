import EventStream from './EventStream'
import InMemoryEventStorage from './InMemoryEventStorage'

test('loads stored events into streams when connected', async () => {
  const event = Math.random()
  const storage = new InMemoryEventStorage<number>([event])
  const stream = new EventStream<number>()
  const subscriber = jest.fn()

  stream.subscribe(subscriber)
  await storage.connect(stream)

  expect(subscriber).toHaveBeenCalledWith(event)
})

test('stores new events from a connected stream in memory', async () => {
  const event = Math.random()
  const storage = new InMemoryEventStorage<number>()
  const stream = new EventStream<number>()

  await storage.connect(stream)
  stream.push(event)

  expect(storage.events).toContain(event)
})

test('stores new events from all connected stream in memory', async () => {
  const event1 = Math.random()
  const event2 = Math.random()
  const storage = new InMemoryEventStorage<number>()
  const stream1 = new EventStream<number>()
  const stream2 = new EventStream<number>()

  await storage.connect(stream1)
  await storage.connect(stream2)
  stream1.push(event1)
  stream2.push(event2)

  expect(storage.events).toEqual([event1, event2])
})
