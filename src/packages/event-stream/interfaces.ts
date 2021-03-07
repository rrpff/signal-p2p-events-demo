export type IEventSubscriber<TEvent> = (event: TEvent) => void

export interface IEventStream<TEvent> {
  subscribe(subscriber: IEventSubscriber<TEvent>): void
  push(event: TEvent): void
}
