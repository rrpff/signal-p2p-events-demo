export type IEventSubscriber<TEvent> = (event: TEvent) => void
export type IEventFilter<TEvent> = (event: TEvent) => boolean
export type IEventMapper<TEvent> = (event: TEvent) => TEvent | Promise<TEvent>

export interface IEventStream<TEvent> {
  subscribe(subscriber: IEventSubscriber<TEvent>): void
  push(event: TEvent): void
  pipe(stream: IEventStream<TEvent>): IEventStream<TEvent>
}
