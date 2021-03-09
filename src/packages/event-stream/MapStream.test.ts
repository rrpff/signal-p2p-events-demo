import EventStream from './EventStream'
import MapStream from './MapStream'
import { testImplementsEventStream } from './sharedTests'

testImplementsEventStream(MapStream)

test('maps events which pass through the stream', () => {
  const event = Math.random()
  const stream = new EventStream<number>()
  const map = new MapStream<number>(event => event * 2)
  const subscriber = jest.fn()

  map.subscribe(subscriber)
  stream.pipe(map)
  stream.push(event)

  expect(subscriber).toHaveBeenCalledWith(event * 2)
})

test('supports async mappers', async () => {
  const event = Math.random()
  const stream = new EventStream<number>()
  const mapper = jest.fn(async event => event * 3)
  const map = new MapStream<number>(mapper)
  const subscriber = jest.fn()

  map.subscribe(subscriber)
  stream.pipe(map)
  stream.push(event)

  await new Promise(resolve => process.nextTick(resolve))

  expect(subscriber).toHaveBeenCalledWith(event * 3)
  expect(mapper).toHaveBeenCalledTimes(1)
})
