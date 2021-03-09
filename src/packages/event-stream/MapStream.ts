import { IEventStream, IEventSubscriber, IEventMapper } from './interfaces'

const DEFAULT_MAPPER = (event: any) => event

export default class MapStream<TEvent> implements IEventStream<TEvent> {
  private subscribers: IEventSubscriber<TEvent>[] = []

  constructor(private mapper: IEventMapper<TEvent> = DEFAULT_MAPPER) {}

  subscribe(subscriber: IEventSubscriber<TEvent>): void {
    this.subscribers.push(subscriber)
  }

  async push(event: TEvent): Promise<void> {
    const mapped = this.mapper(event)

    if (mapped instanceof Promise) {
      this.subscribers.map(async subscriber => subscriber(await this.mapper(event)))
    } else {
      this.subscribers.map(subscriber => subscriber(mapped))
    }
  }

  pipe(stream: IEventStream<TEvent>): IEventStream<TEvent> {
    this.subscribe(event => stream.push(event))
    return stream
  }
}
