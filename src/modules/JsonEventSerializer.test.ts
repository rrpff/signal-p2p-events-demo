import { IEvent } from '../interfaces'
import TypeFaker from '../packages/type-faker'
import JsonEventSerializer from './JsonEventSerializer'

const EventFaker = new TypeFaker<IEvent>({
  id: TypeFaker.ulid(),
  type: TypeFaker.word()
})

test('serializes events to JSON', () => {
  const event = EventFaker.generate()
  const serializer = new JsonEventSerializer()

  expect(serializer.serialize(event)).toEqual(JSON.stringify(event))
})

test('deserializes events from JSON', () => {
  const event = EventFaker.generate()
  const serializer = new JsonEventSerializer()

  expect(serializer.deserialize(JSON.stringify(event))).toEqual(event)
})
