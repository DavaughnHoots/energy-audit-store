module.exports = {
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  testRegex: '/src/__tests__/.*\\.test\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  testEnvironment: 'node'
};
