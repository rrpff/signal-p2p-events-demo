module.exports = {
  preset: 'ts-jest',
  testEnvironment: './test/environment.js',
  setupFiles: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/public/vendor/libsignal-protocol.js'
  ]
};
