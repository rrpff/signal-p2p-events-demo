// Adapted from: https://github.com/signalapp/libsignal-protocol-javascript/blob/master/src/helpers.js

import ByteBuffer from 'bytebuffer'
import { ByteBufferCompatible } from '../interfaces'

export const isArrayBuffer = (thing: any) => {
  return thing.__proto__ === (new ArrayBuffer(0) as any).__proto__
}

export const bufferToString = function(thing: ByteBufferCompatible): string {
  if (typeof thing === 'string') return thing
  return ByteBuffer.wrap(thing).toString('binary')
}

export const bufferToArrayBuffer = function(thing: ByteBufferCompatible): ArrayBuffer {
  if (thing === undefined) throw new Error('Buffer cannot be undefined')
  if (thing === Object(thing) && isArrayBuffer(thing)) return thing as ArrayBuffer

  if (typeof thing !== 'string')
    throw new Error(`Tried to convert a non-string of type ${typeof thing} to an array buffer`)

  return ByteBuffer.wrap(thing, 'binary').toArrayBuffer()
}

export const buffersAreEqual = function(aValue: ByteBufferCompatible, bValue: ByteBufferCompatible) {
  if (aValue === undefined || bValue === undefined) return false

  const a = bufferToString(aValue)
  const b = bufferToString(bValue)
  const maxLength = Math.max(a.length, b.length)

  if (maxLength < 5) throw new Error('a/b compare too short')

  return a.substring(0, Math.min(maxLength, a.length)) === b.substring(0, Math.min(maxLength, b.length))
}
