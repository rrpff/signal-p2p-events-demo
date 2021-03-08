import { IEventStream } from './interfaces'

export const testImplementsEventStream = (Stream: new (...args: any[]) => IEventStream<number>) => {
  test('it passes events received to subscribers', () => {
    const event = Math.random()
    const subscriber = jest.fn()
    const stream = new Stream()

    stream.subscribe(subscriber)
    stream.push(event)

    expect(subscriber).toHaveBeenCalledWith(event)
  })

  test('it passes events received to multiple subscribers', () => {
    const event = Math.random()
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()
    const stream = new Stream()

    stream.subscribe(subscriber1)
    stream.subscribe(subscriber2)
    stream.push(event)

    expect(subscriber1).toHaveBeenCalledWith(event)
    expect(subscriber2).toHaveBeenCalledWith(event)
  })

  test('pipe passes all events from one stream into another', () => {
    const event = Math.random()
    const stream1 = new Stream()
    const stream2 = new Stream()
    const subscriber = jest.fn()

    stream2.subscribe(subscriber)
    stream1.pipe(stream2)
    stream1.push(event)

    expect(subscriber).toHaveBeenCalledWith(event)
  })
}
