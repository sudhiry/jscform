import { signal, computed, effect, batch, untrack } from '../signals';
import { asyncComputed } from '../async-signals';

describe('Signals Integration Tests', () => {
  beforeEach(() => {
    setupTimers();
  });

  afterEach(() => {
    cleanupTimers();
  });

  describe('Complex reactive patterns', () => {
    it('should handle deeply nested computed dependencies', () => {
      const source = signal(1);
      const level1 = computed(() => source.value * 2);
      const level2 = computed(() => level1.value + 10);
      const level3 = computed(() => level2.value * 3);
      const level4 = computed(() => level3.value - 5);
      
      expect(level4.value).toBe(31); // ((1 * 2) + 10) * 3 - 5 = 31
      
      source.value = 3;
      expect(level4.value).toBe(61); // ((3 * 2) + 10) * 3 - 5 = 61
    });

    it('should handle conditional computed chains', () => {
      const condition = signal(true);
      const valueA = signal(10);
      const valueB = signal(20);
      
      const conditional = computed(() => {
        return condition.value ? valueA.value : valueB.value;
      });
      
      const doubled = computed(() => conditional.value * 2);
      const final = computed(() => doubled.value + 100);
      
      expect(final.value).toBe(120); // (10 * 2) + 100
      
      // Change condition
      condition.value = false;
      expect(final.value).toBe(140); // (20 * 2) + 100
      
      // Change valueA (should not affect result now)
      valueA.value = 50;
      expect(final.value).toBe(140); // Still using valueB
      
      // Change valueB (should affect result)
      valueB.value = 30;
      expect(final.value).toBe(160); // (30 * 2) + 100
    });

    it('should handle mixed sync and async computations', async () => {
      const source = signal(5);
      const syncComputed = computed(() => source.value * 2);
      
      const asyncComp = asyncComputed(async () => {
        const syncValue = syncComputed.value;
        await new Promise(resolve => setTimeout(resolve, 50));
        return syncValue + 100;
      });
      
      // Initial computation
      asyncComp.value; // Trigger computation
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      expect(asyncComp.value).toBe(110); // (5 * 2) + 100
      
      // Change source
      source.value = 10;
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      expect(syncComputed.value).toBe(20);
      expect(asyncComp.value).toBe(120); // (10 * 2) + 100
    });

    it('should handle effects with multiple signal dependencies', async () => {
      const a = signal(1);
      const b = signal(2);
      const c = signal(3);
      const results: number[] = [];
      
      effect(() => {
        results.push(a.value + b.value + c.value);
      });
      
      expect(results).toEqual([6]); // 1 + 2 + 3
      
      // Batch update
      batch(() => {
        a.value = 10;
        b.value = 20;
        c.value = 30;
      });
      
      await flushPromises();
      expect(results).toEqual([6, 60]); // Should only add one more result
    });

    it('should handle complex batching scenarios', () => {
      const source = signal(1);
      const doubled = computed(() => source.value * 2);
      const tripled = computed(() => source.value * 3);
      const combined = computed(() => doubled.value + tripled.value);
      
      const notifications: number[] = [];
      combined.subscribe(value => notifications.push(value));
      
      expect(combined.value).toBe(5); // (1 * 2) + (1 * 3) = 5
      
      // Batch multiple updates
      batch(() => {
        source.value = 2;
        source.value = 3;
        source.value = 4;
      });
      
      expect(combined.value).toBe(20); // (4 * 2) + (4 * 3) = 20
      expect(notifications).toEqual([20]); // Should only notify once
    });

    it('should handle untrack in complex scenarios', () => {
      const tracked = signal(1);
      const untracked = signal(100);
      const multiplier = signal(2);
      
      const comp = computed(() => {
        const trackedValue = tracked.value;
        const untrackedValue = untrack(() => untracked.value);
        const mult = multiplier.value;
        return (trackedValue + untrackedValue) * mult;
      });
      
      expect(comp.value).toBe(202); // (1 + 100) * 2
      
      // Change untracked - should not trigger recomputation
      untracked.value = 200;
      expect(comp.value).toBe(202); // Should not change
      
      // Change tracked - should trigger recomputation with new untracked value
      tracked.value = 5;
      expect(comp.value).toBe(410); // (5 + 200) * 2
      
      // Change multiplier - should also trigger recomputation
      multiplier.value = 3;
      expect(comp.value).toBe(615); // (5 + 200) * 3
    });
  });

  describe('Performance and memory management', () => {
    it('should properly dispose of complex dependency chains', () => {
      const source = signal(1);
      const comp1 = computed(() => source.value * 2);
      const comp2 = computed(() => comp1.value + 10);
      const comp3 = computed(() => comp2.value * 3);
      
      // Verify dependencies are established
      expect(source.computedSignals.has(comp1)).toBe(true);
      expect(comp1.computedSignals.has(comp2)).toBe(true);
      expect(comp2.computedSignals.has(comp3)).toBe(true);
      
      // Dispose middle computation
      comp2.dispose();
      
      // Verify cleanup
      expect(comp1.computedSignals.has(comp2)).toBe(false);
      expect(comp2.computedSignals.has(comp3)).toBe(false);
    });

    it('should handle rapid signal updates efficiently', () => {
      const source = signal(0);
      const computed1 = computed(() => source.value * 2);
      const computed2 = computed(() => computed1.value + 1);
      
      const notifications: number[] = [];
      computed2.subscribe(value => notifications.push(value));
      
      // Rapid updates in batch
      batch(() => {
        for (let i = 1; i <= 100; i++) {
          source.value = i;
        }
      });
      
      expect(source.value).toBe(100);
      expect(computed2.value).toBe(201); // (100 * 2) + 1
      expect(notifications).toEqual([201]); // Should only notify once
    });

    it('should handle async computations with rapid dependency changes', async () => {
      const source = signal(1);
      let computationCount = 0;
      
      const asyncComp = asyncComputed(async (signal) => {
        computationCount++;
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (signal.aborted) {
          return 'aborted';
        }
        
        return `result-${value}`;
      }, { debounce: 50 });
      
      // Trigger initial computation
      asyncComp.value;
      
      // Rapid changes within debounce period
      source.value = 2;
      source.value = 3;
      source.value = 4;
      source.value = 5;
      
      // Fast-forward past debounce
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      // Should only compute once with final value
      expect(computationCount).toBe(1);
      
      // Complete computation
      jest.advanceTimersByTime(100);
      await flushPromises();
      
      expect(asyncComp.value).toBe('result-5');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle errors in computed chains gracefully', () => {
      const source = signal(1);
      const errorComputed = computed(() => {
        if (source.value > 5) {
          throw new Error('Value too large');
        }
        return source.value * 2;
      });
      
      const dependentComputed = computed(() => {
        try {
          return errorComputed.value + 10;
        } catch (error) {
          return -1; // Error fallback
        }
      });
      
      expect(dependentComputed.value).toBe(12); // (1 * 2) + 10
      
      source.value = 10; // This will cause error
      expect(dependentComputed.value).toBe(-1); // Should use fallback
    });

    it('should handle async errors with proper cleanup', async () => {
      const source = signal(1);
      const errorHandler = jest.fn();
      
      const asyncComp = asyncComputed(async () => {
        const value = source.value;
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (value > 3) {
          throw new Error(`Value ${value} is too large`);
        }
        
        return value * 2;
      }, { onError: errorHandler });
      
      // Initial successful computation
      asyncComp.value;
      jest.advanceTimersByTime(50);
      await flushPromises();
      expect(asyncComp.value).toBe(2);
      
      // Trigger error
      source.value = 5;
      jest.advanceTimersByTime(50);
      await flushPromises();
      
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      expect(errorHandler.mock.calls[0][0].message).toBe('Value 5 is too large');
    });

    it('should handle circular dependencies in complex scenarios', () => {
      const source = signal(1);
      let comp1: any, comp2: any, comp3: any;
      
      comp1 = computed(() => {
        if (source.value === 1) {
          return source.value * 2;
        }
        return comp3.value + 1; // This creates potential circular dependency
      });
      
      comp2 = computed(() => comp1.value + 10);
      
      comp3 = computed(() => {
        if (source.value === 1) {
          return comp2.value * 2;
        }
        return comp1.value + 5; // This completes the circular dependency
      });
      
      // Should work fine when source is 1
      expect(comp1.value).toBe(2);
      expect(comp2.value).toBe(12);
      expect(comp3.value).toBe(24);
      
      // Should detect circular dependency when source changes
      expect(() => {
        source.value = 2;
        comp1.value; // This should trigger circular dependency detection
      }).toThrow('Circular dependency detected');
    });
  });

  describe('Real-world usage patterns', () => {
    it('should handle form-like reactive state', () => {
      // Simulate form state management
      const firstName = signal('');
      const lastName = signal('');
      const email = signal('');
      
      const fullName = computed(() => {
        const first = firstName.value.trim();
        const last = lastName.value.trim();
        return first && last ? `${first} ${last}` : '';
      });
      
      const isValidEmail = computed(() => {
        const emailValue = email.value;
        return emailValue.includes('@') && emailValue.includes('.');
      });
      
      const isFormValid = computed(() => {
        return fullName.value.length > 0 && isValidEmail.value;
      });
      
      const formData = computed(() => ({
        fullName: fullName.value,
        email: email.value,
        isValid: isFormValid.value
      }));
      
      // Initial state
      expect(formData.value).toEqual({
        fullName: '',
        email: '',
        isValid: false
      });
      
      // Fill form
      batch(() => {
        firstName.value = 'John';
        lastName.value = 'Doe';
        email.value = 'john.doe@example.com';
      });
      
      expect(formData.value).toEqual({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        isValid: true
      });
    });

    it('should handle shopping cart-like state management', () => {
      interface CartItem {
        id: string;
        name: string;
        price: number;
        quantity: number;
      }
      
      const cartItems = signal<CartItem[]>([]);
      const taxRate = signal(0.08);
      const discountPercent = signal(0);
      
      const subtotal = computed(() => {
        return cartItems.value.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
      });
      
      const discountAmount = computed(() => {
        return subtotal.value * (discountPercent.value / 100);
      });
      
      const taxAmount = computed(() => {
        return (subtotal.value - discountAmount.value) * taxRate.value;
      });
      
      const total = computed(() => {
        return subtotal.value - discountAmount.value + taxAmount.value;
      });
      
      const cartSummary = computed(() => ({
        itemCount: cartItems.value.length,
        totalQuantity: cartItems.value.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.value,
        discount: discountAmount.value,
        tax: taxAmount.value,
        total: total.value
      }));
      
      // Add items to cart
      cartItems.value = [
        { id: '1', name: 'Widget A', price: 10.00, quantity: 2 },
        { id: '2', name: 'Widget B', price: 15.00, quantity: 1 }
      ];
      
      expect(cartSummary.value).toEqual({
        itemCount: 2,
        totalQuantity: 3,
        subtotal: 35.00,
        discount: 0,
        tax: 2.80, // 35 * 0.08
        total: 37.80
      });
      
      // Apply discount
      discountPercent.value = 10;
      
      expect(cartSummary.value).toEqual({
        itemCount: 2,
        totalQuantity: 3,
        subtotal: 35.00,
        discount: 3.50, // 35 * 0.10
        tax: 2.52, // (35 - 3.50) * 0.08
        total: 34.02
      });
    });

    it('should handle async data fetching patterns', async () => {
      const userId = signal<string | null>(null);
      const refreshTrigger = signal(0);
      
      // Simulate API call
      const userData = asyncComputed(async (signal) => {
        const id = userId.value;
        refreshTrigger.value; // Create dependency on refresh trigger
        
        if (!id) return null;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (signal.aborted) return null;
        
        return {
          id,
          name: `User ${id}`,
          email: `user${id}@example.com`,
          fetchedAt: Date.now()
        };
      }, { debounce: 50 });
      
      const userProfile = computed(() => {
        const user = userData.value;
        if (!user) return null;
        
        return {
          ...user,
          displayName: user.name.toUpperCase(),
          domain: user.email.split('@')[1]
        };
      });
      
      // Initial state
      expect(userData.value).toBe(null);
      expect(userProfile.value).toBe(null);
      
      // Set user ID
      userId.value = '123';
      
      // Complete async operation
      jest.advanceTimersByTime(150);
      await flushPromises();
      
      expect(userData.value).toMatchObject({
        id: '123',
        name: 'User 123',
        email: 'user123@example.com'
      });
      
      expect(userProfile.value).toMatchObject({
        id: '123',
        displayName: 'USER 123',
        domain: 'example.com'
      });
      
      // Refresh data
      refreshTrigger.value += 1;
      
      jest.advanceTimersByTime(150);
      await flushPromises();
      
      // Should have new fetchedAt timestamp
      expect(userData.value?.fetchedAt).toBeGreaterThan(0);
    });
  });
});
