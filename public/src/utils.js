export const toString = function(thing) {
  if (typeof thing === 'string') return thing
  return new dcodeIO.ByteBuffer.wrap(thing).toString('binary')
}
