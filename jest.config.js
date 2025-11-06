module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js'],
  testEnvironment: 'node',
  transformIgnorePatterns: ['/node_modules/']
};