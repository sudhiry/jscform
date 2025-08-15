import '@testing-library/jest-dom';

// Simple effect tracking for cleanup
const activeEffects: any[] = [];

// Global cleanup after each test
afterEach(() => {
  // Dispose all tracked effects
  activeEffects.forEach(effect => {
    if (effect && typeof effect.dispose === 'function') {
      effect.dispose();
    }
  });
  activeEffects.length = 0; // Clear the array
});

// Helper to track effects
(global as any).trackEffect = (effect: any) => {
  activeEffects.push(effect);
};

// Simple promise flushing
(global as any).flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
