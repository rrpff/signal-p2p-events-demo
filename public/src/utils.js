// Adapted from: https://github.com/signalapp/libsignal-protocol-javascript/blob/master/src/helpers.js

export const toString = function(thing) {
  if (typeof thing === 'string') return thing
  return new dcodeIO.ByteBuffer.wrap(thing).toString('binary')
}

export const toArrayBuffer = function(thing) {
  if (thing === undefined) return undefined
  if (thing === Object(thing)) {
    if (thing.__proto__ === StaticArrayBufferProto) {
      return thing
    }
  }

  if (typeof thing !== 'string')
    throw new Error(`Tried to convert a non-string of type ${typeof thing} to an array buffer`)

  return new dcodeIO.ByteBuffer.wrap(thing, 'binary').toArrayBuffer()
}

export const isEqual = function(aValue, bValue) {
  if (aValue === undefined || bValue === undefined) return false

  const a = toString(aValue)
  const b = toString(bValue)
  const maxLength = Math.max(a.length, b.length)

  if (maxLength < 5) throw new Error('a/b compare too short')

  return a.substring(0, Math.min(maxLength, a.length)) === b.substring(0, Math.min(maxLength, b.length))
}
