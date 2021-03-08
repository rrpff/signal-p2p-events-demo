import { IEventStream, IEventSubscriber } from './interfaces'

export default class EventStream<TEvent> implements IEventStream<TEvent> {
  private subscribers: IEventSubscriber<TEvent>[] = []

  subscribe(subscriber: IEventSubscriber<TEvent>): void {
    this.subscribers.push(subscriber)
  }

  push(event: TEvent): void {
    this.subscribers.forEach(subscriber => subscriber(event))
  }

  pipe(stream: IEventStream<TEvent>): IEventStream<TEvent> {
    this.subscribe(event => stream.push(event))
    return stream
  }
}
