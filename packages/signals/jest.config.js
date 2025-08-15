const { createJestConfig } = require('@repo/jest-presets/browser/jest-preset');

module.exports = {
  ...require('@repo/jest-presets/browser/jest-preset'),
  displayName: '@repo/signals',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js|jsx)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup-simple.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  },
  // Ensure tests exit properly
  forceExit: true,
  detectOpenHandles: true,
  // Timeout settings
  testTimeout: 10000,
  // Clear mocks and timers after each test
  clearMocks: true,
  restoreMocks: true
};
