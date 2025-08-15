import {
  signal,
  computed,
  effect,
  batch,
  untrack,
  isSignal,
  ComputedSignal
} from '../signals';

describe('Signals Core Library', () => {
  describe('signal()', () => {
    it('should create a signal with initial value', () => {
      const s = signal(42);
      expect(s.value).toBe(42);
      expect(isSignal(s)).toBe(true);
    });

    it('should update value and notify subscribers', () => {
      const s = signal(0);
      const callback = jest.fn();
      
      s.subscribe(callback);
      s.value = 10;
      
      expect(s.value).toBe(10);
      expect(callback).toHaveBeenCalledWith(10);
    });

    it('should not notify if value is the same', () => {
      const s = signal(42);
      const callback = jest.fn();
      
      s.subscribe(callback);
      s.value = 42; // Same value
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const s = signal('hello');
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      s.subscribe(callback1);
      s.subscribe(callback2);
      s.value = 'world';
      
      expect(callback1).toHaveBeenCalledWith('world');
      expect(callback2).toHaveBeenCalledWith('world');
    });

    it('should unsubscribe correctly', () => {
      const s = signal(1);
      const callback = jest.fn();
      
      const unsubscribe = s.subscribe(callback);
      s.value = 2;
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      s.value = 3;
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should support watch() method that calls immediately', () => {
      const s = signal('initial');
      const callback = jest.fn();
      
      s.watch(callback);
      
      expect(callback).toHaveBeenCalledWith('initial');
      
      s.value = 'updated';
      expect(callback).toHaveBeenCalledWith('updated');
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle errors in subscribers gracefully', () => {
      const s = signal(1);
      const errorCallback = jest.fn(() => {
        throw new Error('Subscriber error');
      });
      const normalCallback = jest.fn();
      
      s.subscribe(errorCallback);
      s.subscribe(normalCallback);
      
      s.value = 2;
      
      expect(console.error).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalledWith(2);
    });

    it('should have unique IDs', () => {
      const s1 = signal(1);
      const s2 = signal(2);
      
      expect(s1.id).not.toBe(s2.id);
      expect(typeof s1.id).toBe('number');
      expect(typeof s2.id).toBe('number');
    });

    it('should have meaningful toString()', () => {
      const s = signal('test');
      expect(s.toString()).toBe('Signal(test)');
    });
  });

  describe('computed()', () => {
    it('should create computed signal from other signals', () => {
      const a = signal(2);
      const b = signal(3);
      const sum = computed(() => a.value + b.value);
      
      expect(sum.value).toBe(5);
      expect(isSignal(sum)).toBe(true);
    });

    it('should update when dependencies change', () => {
      const a = signal(2);
      const doubled = computed(() => a.value * 2);
      
      expect(doubled.value).toBe(4);
      
      a.value = 5;
      expect(doubled.value).toBe(10);
    });

    it('should notify subscribers when computed value changes', () => {
      const a = signal(1);
      const doubled = computed(() => a.value * 2);
      const callback = jest.fn();
      
      doubled.subscribe(callback);
      a.value = 3;
      
      expect(callback).toHaveBeenCalledWith(6);
    });

    it('should not notify if computed value does not change', () => {
      const a = signal(1);
      const isEven = computed(() => a.value % 2 === 0);
      const callback = jest.fn();
      
      isEven.subscribe(callback);
      
      a.value = 3; // Still odd
      expect(callback).not.toHaveBeenCalled();
      
      a.value = 4; // Now even
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should handle nested computed signals', () => {
      const a = signal(2);
      const doubled = computed(() => a.value * 2);
      const quadrupled = computed(() => doubled.value * 2);
      
      expect(quadrupled.value).toBe(8);
      
      a.value = 3;
      expect(quadrupled.value).toBe(12);
    });

    it('should throw error when trying to set computed value', () => {
      const a = signal(1);
      const doubled = computed(() => a.value * 2);
      
      expect(() => {
        doubled.value = 10;
      }).toThrow('Cannot directly set the value of a computed signal');
    });

    it('should detect circular dependencies', () => {
      let b: ComputedSignal<number>;
      let c: ComputedSignal<number>;
      
      b = computed(() => {
        return c.value + 1; // This will create a circular dependency
      });
      c = computed(() => {
        return b.value + 1;
      });
      
      expect(() => {
        b.value; // Trigger computation
      }).toThrow('Circular dependency detected in computed signal');
    });

    it('should dispose correctly', () => {
      const a = signal(1);
      const doubled = computed(() => a.value * 2);
      const callback = jest.fn();
      
      doubled.subscribe(callback);
      doubled.dispose();
      
      a.value = 5;
      expect(callback).not.toHaveBeenCalled();
    });

    it('should have meaningful toString()', () => {
      const a = signal(5);
      const doubled = computed(() => a.value * 2);
      expect(doubled.toString()).toBe('ComputedSignal(10)');
    });

    it('should handle errors in compute function', () => {
      const a = signal(1);
      const errorComputed = computed(() => {
        if (a.value > 5) {
          throw new Error('Value too large');
        }
        return a.value * 2;
      });
      
      expect(errorComputed.value).toBe(2);
      
      a.value = 10;
      expect(() => errorComputed.value).toThrow('Value too large');
    });
  });

  describe('effect()', () => {
    it('should run immediately by default', () => {
      const callback = jest.fn();
      const eff = effect(callback);
      trackEffect(eff);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not run immediately when immediate: false', () => {
      const callback = jest.fn();
      const eff = effect(callback, { immediate: false });
      trackEffect(eff);
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should run when dependencies change', async () => {
      const a = signal(1);
      const callback = jest.fn(() => {
        a.value; // Access signal to create dependency
      });
      
      const eff = effect(callback);
      trackEffect(eff);
      expect(callback).toHaveBeenCalledTimes(1);
      
      a.value = 2;
      await flushPromises();
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should handle errors with custom error handler', async () => {
      const a = signal(1);
      const errorHandler = jest.fn();
      
      const eff = effect(() => {
        if (a.value > 5) {
          throw new Error('Value too large');
        }
      }, { onError: errorHandler });
      trackEffect(eff);
      
      a.value = 10;
      await flushPromises();
      
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors with default error handler', async () => {
      const a = signal(1);
      
      const eff = effect(() => {
        if (a.value > 5) {
          throw new Error('Value too large');
        }
      });
      trackEffect(eff);
      
      a.value = 10;
      await flushPromises();
      
      expect(console.error).toHaveBeenCalledWith('Effect error:', expect.any(Error));
    });

    it('should dispose correctly', async () => {
      const a = signal(1);
      const callback = jest.fn(() => {
        a.value; // Create dependency
      });
      
      const eff = effect(callback);
      trackEffect(eff);
      expect(callback).toHaveBeenCalledTimes(1);
      
      eff.dispose();
      a.value = 2;
      await flushPromises();
      
      expect(callback).toHaveBeenCalledTimes(1); // Should not run again
    });

    it('should not run if already disposed', () => {
      const callback = jest.fn();
      const eff = effect(callback, { immediate: false });
      trackEffect(eff);
      
      eff.dispose();
      eff.run();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('batch()', () => {
    it('should batch multiple signal updates', () => {
      const a = signal(1);
      const b = signal(2);
      const sum = computed(() => a.value + b.value);
      const callback = jest.fn();
      
      sum.subscribe(callback);
      
      batch(() => {
        a.value = 10;
        b.value = 20;
      });
      
      expect(sum.value).toBe(30);
      expect(callback).toHaveBeenCalledTimes(1); // Should only be called once
    });

    it('should handle nested batching', () => {
      const a = signal(1);
      const callback = jest.fn();
      
      a.subscribe(callback);
      
      batch(() => {
        a.value = 2;
        batch(() => {
          a.value = 3;
        });
        a.value = 4;
      });
      
      expect(a.value).toBe(4);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle errors in batch function', () => {
      const a = signal(1);
      const callback = jest.fn();
      
      a.subscribe(callback);
      
      expect(() => {
        batch(() => {
          a.value = 2;
          throw new Error('Batch error');
        });
      }).toThrow('Batch error');
      
      expect(a.value).toBe(2);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('untrack()', () => {
    it('should prevent dependency tracking', () => {
      const a = signal(1);
      const b = signal(2);
      const callback = jest.fn();
      
      const comp = computed(() => {
        const aValue = a.value;
        const bValue = untrack(() => b.value); // b should not be a dependency
        return aValue + bValue;
      });
      
      comp.subscribe(callback);
      expect(comp.value).toBe(3);
      
      b.value = 10; // Should not trigger recomputation
      expect(callback).not.toHaveBeenCalled();
      expect(comp.value).toBe(3); // Value should not change
      
      a.value = 5; // Should trigger recomputation
      expect(comp.value).toBe(15); // Now uses new b.value
      expect(callback).toHaveBeenCalledWith(15);
    });

    it('should return the result of the function', () => {
      const result = untrack(() => 42);
      expect(result).toBe(42);
    });

    it('should handle nested untrack calls', () => {
      const a = signal(1);
      const b = signal(2);
      const c = signal(3);
      
      const comp = computed(() => {
        const aValue = a.value;
        const result = untrack(() => {
          const bValue = b.value;
          return untrack(() => {
            return bValue + c.value;
          });
        });
        return aValue + result;
      });
      
      expect(comp.value).toBe(6); // 1 + (2 + 3)
      
      // Only a should be a dependency
      b.value = 10;
      c.value = 20;
      expect(comp.value).toBe(6); // Should not change
      
      a.value = 5;
      expect(comp.value).toBe(35); // 5 + (10 + 20)
    });
  });

  describe('isSignal()', () => {
    it('should identify signals correctly', () => {
      const s = signal(1);
      const c = computed(() => s.value * 2);
      
      expect(isSignal(s)).toBe(true);
      expect(isSignal(c)).toBe(true);
      expect(isSignal(42)).toBe(false);
      expect(isSignal({})).toBe(false);
      expect(isSignal(null)).toBe(false);
      expect(isSignal(undefined)).toBe(false);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle diamond dependency pattern', () => {
      const source = signal(1);
      const left = computed(() => source.value * 2);
      const right = computed(() => source.value * 3);
      const result = computed(() => left.value + right.value);
      const callback = jest.fn();
      
      result.subscribe(callback);
      expect(result.value).toBe(5); // (1*2) + (1*3) = 5
      
      source.value = 2;
      expect(result.value).toBe(10); // (2*2) + (2*3) = 10
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle conditional dependencies', () => {
      const condition = signal(true);
      const a = signal(1);
      const b = signal(10);
      
      const result = computed(() => {
        return condition.value ? a.value : b.value;
      });
      
      expect(result.value).toBe(1);
      
      // Changing b should not trigger update when condition is true
      const callback = jest.fn();
      result.subscribe(callback);
      
      b.value = 20;
      expect(callback).not.toHaveBeenCalled();
      
      // Changing a should trigger update
      a.value = 5;
      expect(callback).toHaveBeenCalledWith(5);
      
      // Switch condition
      condition.value = false;
      expect(result.value).toBe(20); // Now uses b.value
    });

    it('should handle effects with multiple dependencies', async () => {
      const a = signal(1);
      const b = signal(2);
      const c = signal(3);
      const callback = jest.fn();
      
      const eff = effect(() => {
        callback(a.value + b.value + c.value);
      });
      trackEffect(eff);
      
      expect(callback).toHaveBeenCalledWith(6);
      
      batch(() => {
        a.value = 10;
        b.value = 20;
        c.value = 30;
      });
      
      await flushPromises();
      expect(callback).toHaveBeenCalledWith(60);
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});
