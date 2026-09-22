/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**', '!src/index.ts'],
  coverageThreshold: {
    global: { branches: 80, functions: 90, lines: 90, statements: 90 },
  },
};
