module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '*.ts',
    '!index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 40,
      statements: 40
    }
  }
};
