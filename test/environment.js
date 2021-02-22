// Adapted from: https://github.com/ipfs/jest-environment-aegir/blob/master/src/index.js
const JsdomEnvironment = require('jest-environment-jsdom')

class Environment extends JsdomEnvironment {
  constructor(config) {
    super(
      Object.assign({}, config, {
        globals: Object.assign({}, config.globals, {
          Uint32Array: Uint32Array,
          Uint8Array: Uint8Array,
          ArrayBuffer: ArrayBuffer
        }),
      }),
    )
  }

  async setup() {}
  async teardown() {}
}

module.exports = Environment
