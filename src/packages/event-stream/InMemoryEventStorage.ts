import { IEventStream } from './interfaces'

export default class InMemoryEventStorage<TEvent> {
  constructor(public events: TEvent[] = []) {}

  async tap(stream: IEventStream<TEvent>) {
    this.events.forEach(event => stream.push(event))
    stream.subscribe(event => this.events.push(event))
  }
}
