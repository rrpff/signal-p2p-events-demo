import EventStream from './EventStream'
import FilterStream from './FilterStream'
import { testImplementsEventStream } from './sharedTests'

testImplementsEventStream(FilterStream)

test('only propagates events which do not pass the predicate', () => {
  const event1 = Math.random() + 0.51
  const event2 = Math.random() - 0.51
  const event3 = Math.random() + 0.51
  const stream = new EventStream<number>()
  const filter = new FilterStream<number>(event => event > 0.5)
  const subscriber = jest.fn()

  filter.subscribe(subscriber)
  stream.pipe(filter)
  stream.push(event1)
  stream.push(event2)
  stream.push(event3)

  expect(subscriber).toHaveBeenCalledWith(event1)
  expect(subscriber).toHaveBeenCalledWith(event3)
  expect(subscriber).not.toHaveBeenCalledWith(event2)
})
