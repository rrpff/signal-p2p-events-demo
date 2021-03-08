import { IEvent, ISerializer } from '../interfaces'

export default class JsonEventSerializer implements ISerializer<IEvent, string> {
  serialize(event: IEvent): string {
    return JSON.stringify(event)
  }

  deserialize(json: string): IEvent {
    return JSON.parse(json)
  }
}
