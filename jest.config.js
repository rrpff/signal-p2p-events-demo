module.exports = {
  preset: 'ts-jest',
  testEnvironment: './test/environment.js',
  snapshotSerializers: ['@emotion/jest/serializer'],
  setupFiles: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/public/vendor/libsignal-protocol.js'
  ],
};
