import { IEventStream, IEventSubscriber, IEventFilter } from './interfaces'

const DEFAULT_FILTER = () => true

export default class FilterStream<TEvent> implements IEventStream<TEvent> {
  private subscribers: IEventSubscriber<TEvent>[] = []

  constructor(private filter: IEventFilter<TEvent> = DEFAULT_FILTER) {}

  subscribe(subscriber: IEventSubscriber<TEvent>): void {
    this.subscribers.push(subscriber)
  }

  push(event: TEvent): void {
    if (this.filter(event)) {
      this.subscribers.forEach(subscriber => subscriber(event))
    }
  }

  pipe(stream: IEventStream<TEvent>): IEventStream<TEvent> {
    this.subscribe(event => stream.push(event))
    return stream
  }
}
