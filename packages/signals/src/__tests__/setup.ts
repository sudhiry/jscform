import '@testing-library/jest-dom';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore original console methods after each test
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
declare global {
  var flushPromises: () => Promise<void>;
  var setupTimers: () => void;
  var cleanupTimers: () => void;
  var activeEffects: any[];
  var trackEffect: (effect: any) => void;
  var cleanupEffects: () => void;
}

// Track active effects to dispose them after tests
global.activeEffects = [];

global.trackEffect = (effect: any) => {
  global.activeEffects.push(effect);
};

global.cleanupEffects = () => {
  global.activeEffects.forEach(effect => {
    if (effect && typeof effect.dispose === 'function') {
      effect.dispose();
    }
  });
  global.activeEffects = [];
};

global.flushPromises = () => new Promise(resolve => {
  // Flush both promises and microtasks
  setTimeout(() => {
    // Allow microtasks to complete
    queueMicrotask(() => resolve());
  }, 0);
});

// Mock timers for tests that need them
global.setupTimers = () => {
  jest.useFakeTimers();
};

global.cleanupTimers = () => {
  // Clear all timers
  jest.clearAllTimers();
  // Run any remaining timers
  jest.runOnlyPendingTimers();
  // Restore real timers
  jest.useRealTimers();
};

// Global cleanup after each test
afterEach(() => {
  // Clear any remaining timers
  jest.clearAllTimers();
  // Cleanup any tracked effects
  global.cleanupEffects();
});

// Global cleanup after all tests
afterAll(() => {
  // Ensure we're using real timers
  jest.useRealTimers();
});
