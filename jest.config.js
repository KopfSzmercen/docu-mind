module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/jest-unit.json'],
  testMatch: ['**/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};