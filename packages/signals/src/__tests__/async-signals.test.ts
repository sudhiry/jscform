import { signal, computed } from '../signals';
import { asyncComputed, AsyncComputed } from '../async-signals';

describe('Async Signals', () => {
  let asyncComputedInstances: any[] = [];

  // Helper function to create and track async computed instances
  const createTrackedAsyncComputed = (computeFn: any, options?: any) => {
    const instance = asyncComputed(computeFn, options);
    asyncComputedInstances.push(instance);
    return instance;
  };

  beforeEach(() => {
    setupTimers();
    asyncComputedInstances = [];
  });

  afterEach(() => {
    // Dispose all async computed instances to prevent hanging
    asyncComputedInstances.forEach(instance => {
      if (instance && typeof instance.dispose === 'function') {
        instance.dispose();
      }
    });
    asyncComputedInstances = [];
    cleanupTimers();
  });

  describe('asyncComputed()', () => {
    it('should create async computed signal with initial value', async () => {
      const asyncComp = createTrackedAsyncComputed(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'async result';
        },
        { initialValue: 'loading...' }
      );

      expect(asyncComp.value).toBe('loading...');
    });

    it('should update value when async computation completes', async () => {
      const asyncComp = createTrackedAsyncComputed(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'completed';
      });

      // Initial value should be null
      expect(asyncComp.value).toBe(null);

      // Fast-forward timers
      jest.advanceTimersByTime(100);
      await flushPromises();

      expect(asyncComp.value).toBe('completed');
    });

    it('should recompute when dependencies change', async () => {
      const source = signal(1);
      const asyncComp = createTrackedAsyncComputed(async () => {
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 50));
        return value * 2;
      });

      // Trigger initial computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();
      expect(asyncComp.value).toBe(2);

      // Change dependency
      source.value = 5;
      jest.advanceTimersByTime(50);
      await flushPromises();
      expect(asyncComp.value).toBe(10);
    });

    it('should handle abort signals correctly', async () => {
      let abortSignal: AbortSignal | null = null;
      const asyncComp = createTrackedAsyncComputed(async (signal: AbortSignal) => {
        abortSignal = signal;
        await new Promise(resolve => setTimeout(resolve, 100));
        if (signal.aborted) {
          throw new Error('Aborted');
        }
        return 'completed';
      });

      // Start computation
      asyncComp.value;
      expect(abortSignal).not.toBeNull();
      expect(abortSignal!.aborted).toBe(false);

      // Trigger another computation before first completes
      asyncComp.markStale();
      await flushPromises();

      // Previous signal should be aborted
      expect(abortSignal!.aborted).toBe(true);
    });

    it('should support debouncing', async () => {
      const source = signal(1);
      const computeFn = jest.fn(async () => {
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 10));
        return value * 2;
      });

      const asyncComp = createTrackedAsyncComputed(computeFn, { debounce: 100 });

      // Trigger multiple rapid changes
      source.value = 2;
      source.value = 3;
      source.value = 4;

      // Should not have computed yet due to debouncing
      expect(computeFn).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      jest.advanceTimersByTime(100);
      await flushPromises();

      // Should compute only once with the latest value
      expect(computeFn).toHaveBeenCalledTimes(1);
      
      // Fast-forward computation time
      jest.advanceTimersByTime(10);
      await flushPromises();
      
      expect(asyncComp.value).toBe(8); // 4 * 2
    });

    it('should handle errors with custom error handler', async () => {
      const errorHandler = jest.fn();
      const asyncComp = createTrackedAsyncComputed(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Async error');
        },
        { onError: errorHandler }
      );

      // Trigger computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors with default error handler', async () => {
      const asyncComp = createTrackedAsyncComputed(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Async error');
      });

      // Trigger computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();

      expect(console.error).toHaveBeenCalledWith('AsyncComputed error:', expect.any(Error));
    });

    it('should not update value if computation was aborted', async () => {
      const source = signal(1);
      const asyncComp = createTrackedAsyncComputed(async (signal: AbortSignal) => {
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 100));
        if (signal.aborted) {
          return 'aborted'; // This should not be set as value
        }
        return value * 2;
      });

      // Start first computation
      asyncComp.value;
      
      // Start second computation before first completes
      source.value = 5;
      
      // Complete both computations
      jest.advanceTimersByTime(100);
      await flushPromises();

      // Should have the result from the second computation
      expect(asyncComp.value).toBe(10);
    });

    it('should throw error when trying to set value directly', () => {
      const asyncComp = createTrackedAsyncComputed(async () => 'test');
      
      expect(() => {
        asyncComp.value = 'new value';
      }).toThrow('Cannot directly set the value of an async computed signal');
    });

    it('should dispose correctly', async () => {
      const source = signal(1);
      const asyncComp = createTrackedAsyncComputed(async () => {
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 50));
        return value * 2;
      });

      const callback = jest.fn();
      asyncComp.subscribe(callback);

      // Dispose
      asyncComp.dispose();

      // Change dependency
      source.value = 5;
      jest.advanceTimersByTime(50);
      await flushPromises();

      // Should not have triggered callback
      expect(callback).not.toHaveBeenCalled();
    });

    it('should work with regular computed signals as dependencies', async () => {
      const source = signal(2);
      const doubled = computed(() => source.value * 2);
      
      const asyncComp = createTrackedAsyncComputed(async () => {
        const value = doubled.value;
        await new Promise(resolve => setTimeout(resolve, 50));
        return value + 10;
      });

      // Trigger computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      expect(asyncComp.value).toBe(14); // (2 * 2) + 10

      // Change source
      source.value = 5;
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      expect(asyncComp.value).toBe(20); // (5 * 2) + 10
    });

    it('should notify subscribers when value changes', async () => {
      const asyncComp = createTrackedAsyncComputed(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'result';
      });

      const callback = jest.fn();
      asyncComp.subscribe(callback);

      // Trigger computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();

      expect(callback).toHaveBeenCalledWith('result');
    });

    it('should not notify subscribers if value does not change', async () => {
      const source = signal(1);
      const asyncComp = createTrackedAsyncComputed(async () => {
        source.value; // Create dependency
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'constant';
      });

      const callback = jest.fn();
      
      // Initial computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      asyncComp.subscribe(callback);

      // Change dependency but result is the same
      source.value = 2;
      jest.advanceTimersByTime(50);
      await flushPromises();

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple async computations correctly', async () => {
      const source1 = signal(1);
      const source2 = signal(10);
      
      const async1 = createTrackedAsyncComputed(async () => {
        const value = source1.value;
        await new Promise(resolve => setTimeout(resolve, 30));
        return value * 2;
      });

      const async2 = createTrackedAsyncComputed(async () => {
        const value = source2.value;
        await new Promise(resolve => setTimeout(resolve, 50));
        return value * 3;
      });

      const combined = createTrackedAsyncComputed(async () => {
        const val1 = async1.value as number;
        const val2 = async2.value as number;
        await new Promise(resolve => setTimeout(resolve, 20));
        return val1 + val2;
      });

      // Trigger all computations
      combined.value;
      
      // Complete all async operations
      jest.advanceTimersByTime(100);
      await flushPromises();

      expect(async1.value).toBe(2);
      expect(async2.value).toBe(30);
      expect(combined.value).toBe(32);
    });

    it('should handle rapid dependency changes with debouncing', async () => {
      const source = signal(0);
      const computeFn = jest.fn(async () => {
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 10));
        return value;
      });

      const asyncComp = createTrackedAsyncComputed(computeFn, { debounce: 50 });

      // Rapid changes
      for (let i = 1; i <= 10; i++) {
        source.value = i;
        jest.advanceTimersByTime(10); // Less than debounce time
      }

      // Should not have computed yet
      expect(computeFn).not.toHaveBeenCalled();

      // Complete debounce period
      jest.advanceTimersByTime(50);
      await flushPromises();

      // Should compute only once with final value
      expect(computeFn).toHaveBeenCalledTimes(1);
      
      // Complete computation
      jest.advanceTimersByTime(10);
      await flushPromises();
      
      expect(asyncComp.value).toBe(10);
    });
  });

  describe('AsyncComputed class', () => {
    it('should be instance of AsyncComputed', () => {
      const asyncComp = createTrackedAsyncComputed(async () => 'test');
      expect(asyncComp).toBeInstanceOf(AsyncComputed);
    });

    it('should have proper dependency tracking', async () => {
      const source = signal(1);
      const asyncComp = createTrackedAsyncComputed(async () => {
        return source.value * 2;
      });

      // Access value to establish dependency and trigger computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      // Check that source has asyncComp as a dependent
      expect(source.computedSignals.has(asyncComp)).toBe(true);

      // Dispose and check cleanup
      asyncComp.dispose();
      expect(source.computedSignals.has(asyncComp)).toBe(false);
    });

    it('should clear debounce timer on dispose', () => {
      const asyncComp = createTrackedAsyncComputed(async () => 'test', { debounce: 100 });
      
      // Trigger debounced computation
      asyncComp.markStale();
      
      // Dispose should clear the timer
      asyncComp.dispose();
      
      // Advance time - should not cause any issues
      jest.advanceTimersByTime(100);
    });
  });
});
