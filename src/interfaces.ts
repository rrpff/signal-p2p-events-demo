export interface IUser {
  identifier: string
  registrationId: number
  deviceId: number
}

export interface IStore {
  set<T>(key: string, value: T): void
  get<T>(key: string, defaultValue?: T): T
  append<T>(key: string, value: T): void
  remove(key: string): void
  subscribe<T>(key: string, handler: (value: T) => void): void
}

export interface IEvent {
  id: string
  type: string
  [key: string]: any
}

export interface ISerializer<TInput, TOutput> {
  serialize(message: TInput): TOutput
  deserialize(message: TOutput): TInput
}

export interface IPeerToPeerCommunicator<TAddress, TInput, TUser extends { identifier: string }> {
  setup(): Promise<TUser>
  connect(address: TAddress): void
  send(address: TAddress, message: TInput): void
  stream(handler: (address: TAddress, message: TInput) => void): void
  safetyNumberFor(address: TAddress): Promise<string>
}

export interface IMessage {
  sender: string
  recipient: string
  body: string
  timestamp: number
}
