export type IEventSubscriber<TEvent> = (event: TEvent) => void
export type IEventFilter<TEvent> = (event: TEvent) => boolean

export interface IEventStream<TEvent> {
  subscribe(subscriber: IEventSubscriber<TEvent>): void
  push(event: TEvent): void
  pipe(stream: IEventStream<TEvent>): IEventStream<TEvent>
}
