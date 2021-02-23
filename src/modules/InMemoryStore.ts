import { IStore } from '../interfaces'

export default class InMemoryStore implements IStore {
  private state: Map<string, any> = new Map()
  private listeners: Map<string, ((value: any) => void)[]> = new Map()

  set<T>(key: string, value: T): void {
    this.state.set(key, value)

    const listeners = this.listeners.get(key) || []
    listeners.forEach(listener => listener(value))
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.state.get(key) || defaultValue
  }

  append<T>(key: string, value: T) {
    const currentValue = this.get(key)

    if (Array.isArray(currentValue)) {
      const nextValue = [...currentValue, value]
      this.set(key, nextValue)
      return
    }

    if (currentValue === undefined) {
      this.set(key, [value])
      return
    }

    throw new Error(`${key} is not an array`)
  }

  remove(key: string): void {
    this.state.delete(key)
  }

  subscribe<T>(key: string, handler: (value: T) => void): void {
    const keyListeners = this.listeners.get(key) || []
    const newListeners = [...keyListeners, handler]

    this.listeners.set(key, newListeners)
  }
}
