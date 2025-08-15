import {
    signal,
    computed,
    effect,
    batch,
    untrack,
    isSignal, Signal,
} from '../signals'; // Adjust path as needed

// Helper to flush the microtask queue for effect tests
const flushPromises = () => new Promise(resolve => setImmediate(resolve));

describe('Signals Core Library (Corrected Tests)', () => {
    let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;

    // Mock console.error before each test to check for expected errors
    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
        });
    });

    // Restore the original console.error after each test
    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });


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
            s.value = 42;

            expect(callback).not.toHaveBeenCalled();
        });

        it('should unsubscribe correctly', () => {
            const s = signal(1);
            const callback = jest.fn();

            const unsubscribe = s.subscribe(callback);
            s.value = 2;
            expect(callback).toHaveBeenCalledTimes(1);

            unsubscribe();
            s.value = 3;
            expect(callback).toHaveBeenCalledTimes(1);
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
    });

    describe('computed()', () => {
        it('should create computed signal from other signals', () => {
            const a = signal(2);
            const b = signal(3);
            const sum = computed(() => a.value + b.value);

            expect(sum.value).toBe(5);
        });

        it('should update when dependencies change', () => {
            const a = signal(2);
            const doubled = computed(() => a.value * 2);

            expect(doubled.value).toBe(4);
            a.value = 5;
            expect(doubled.value).toBe(10);
        });

        it('should notify subscribers only when computed value is accessed and changes', () => {
            const a = signal(1);
            const doubled = computed(() => a.value * 2);
            const callback = jest.fn();

            doubled.subscribe(callback);
            a.value = 3;

            // At this point, `doubled` is stale but has not recomputed.
            // The callback has not been called yet.
            expect(callback).not.toHaveBeenCalled();

            // Accessing the value triggers re-computation and notification.
            expect(doubled.value).toBe(6);
            expect(callback).toHaveBeenCalledWith(6);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not notify if computed value does not change', () => {
            const a = signal(1);
            const isEven = computed(() => a.value % 2 === 0);
            const callback = jest.fn();

            isEven.subscribe(callback);
            expect(isEven.value).toBe(false); // Initial access

            a.value = 3; // Still odd
            expect(callback).not.toHaveBeenCalled();

            a.value = 4; // Now even
            expect(isEven.value).toBe(true); // Access to recompute
            expect(callback).toHaveBeenCalledWith(true);
            expect(callback).toHaveBeenCalledTimes(1);
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

        it('should detect circular dependencies on access', () => {
            const a = signal(1);
            // Note: Types are needed here for the circular reference
            let b: Signal<number>;
            const c = computed(() => b.value + a.value);
            b = computed(() => c.value + 1);

            expect(() => {
                c.value; // Triggering computation reveals the cycle
            }).toThrow('Circular dependency detected in computed signal');
        });
    });

    describe('computed()', () => {
        it('should create computed signal from other signals', () => {
            const a = signal(2);
            const b = signal(3);
            const sum = computed(() => a.value + b.value);

            expect(sum.value).toBe(5);
        });

        it('should update when dependencies change', () => {
            const a = signal(2);
            const doubled = computed(() => a.value * 2);

            expect(doubled.value).toBe(4);
            a.value = 5;
            expect(doubled.value).toBe(10);
        });

        it('should notify subscribers only when computed value is accessed and changes', () => {
            const a = signal(1);
            const doubled = computed(() => a.value * 2);
            const callback = jest.fn();

            doubled.subscribe(callback);

            // Accessing the value triggers the first computation and notification
            expect(doubled.value).toBe(2);
            expect(callback).toHaveBeenCalledWith(2);
            expect(callback).toHaveBeenCalledTimes(1);

            a.value = 3;

            // Accessing the value again triggers re-computation and a second notification.
            expect(doubled.value).toBe(6);
            expect(callback).toHaveBeenCalledWith(6);
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should not notify if computed value does not change', () => {
            const a = signal(1);
            const isEven = computed(() => a.value % 2 === 0);
            const callback = jest.fn();

            isEven.subscribe(callback);
            expect(isEven.value).toBe(false); // Initial access triggers first notification
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(false);


            a.value = 3; // Value is still odd
            expect(isEven.value).toBe(false); // Access to recompute
            expect(callback).toHaveBeenCalledTimes(1); // No new call

            a.value = 4; // Now even
            expect(isEven.value).toBe(true); // Access to recompute
            expect(callback).toHaveBeenCalledWith(true);
            expect(callback).toHaveBeenCalledTimes(2);
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

        it('should throw on circular dependencies', () => {
            // Note: Types are needed here for the circular reference
            let b: Signal<number>;
            const c = computed(() => b.value + 1);
            b = computed(() => c.value + 1);

            // Accessing the value should now correctly throw an error.
            expect(() => {
                c.value;
            }).toThrow('Circular dependency detected in computed signal');
        });
    });

    describe('effect()', () => {
        it('should run immediately by default', () => {
            const callback = jest.fn();
            effect(callback);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not run immediately when immediate: false', () => {
            const callback = jest.fn();
            effect(callback, {
                immediate: false
            });
            expect(callback).not.toHaveBeenCalled();
        });

        it('should run asynchronously when dependencies change', async () => {
            const a = signal(1);
            const callback = jest.fn(() => {
                a.value;
            });

            effect(callback);
            expect(callback).toHaveBeenCalledTimes(1);

            a.value = 2;
            // The effect is scheduled in a microtask, so we wait for it
            await flushPromises();
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should handle errors with custom error handler', async () => {
            const a = signal(1);
            const errorHandler = jest.fn();

            effect(() => {
                if (a.value > 5) {
                    throw new Error('Value too large');
                }
            }, {
                onError: errorHandler
            });

            a.value = 10;
            await flushPromises();

            expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should use default error handler if none provided', async () => {
            const a = signal(1);
            effect(() => {
                if (a.value > 5) {
                    throw new Error('Value too large');
                }
            });

            a.value = 10;
            await flushPromises();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Effect error:', expect.any(Error));
        });

        it('should dispose correctly', async () => {
            const a = signal(1);
            const callback = jest.fn(() => {
                a.value;
            });

            const eff = effect(callback);
            expect(callback).toHaveBeenCalledTimes(1);

            eff.dispose();
            a.value = 2;
            await flushPromises();

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('batch()', () => {
        it('should batch updates so computed signals run only once', () => {
            const a = signal(1);
            const b = signal(2);
            const sum = computed(() => a.value + b.value);
            const callback = jest.fn();

            sum.subscribe(callback);

            batch(() => {
                a.value = 10;
                b.value = 20;
            });

            // Access the value to trigger re-computation and notification
            expect(sum.value).toBe(30);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(30);
        });

        it('should handle nested batching for computed signals', () => {
            const a = signal(1);
            const doubled = computed(() => a.value * 2);
            const callback = jest.fn();

            doubled.subscribe(callback);

            batch(() => {
                a.value = 2;
                batch(() => {
                    a.value = 3;
                });
                a.value = 4;
            });

            expect(doubled.value).toBe(8);
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('untrack()', () => {
        it('should prevent dependency tracking', () => {
            const a = signal(1);
            const b = signal(2);
            const callback = jest.fn();

            const comp = computed(() => {
                return a.value + untrack(() => b.value);
            });

            comp.subscribe(callback);
            expect(comp.value).toBe(3);

            b.value = 10;
            expect(comp.value).toBe(3); // Accessing does not re-run, value is cached
            expect(callback).not.toHaveBeenCalled();

            a.value = 5;
            expect(comp.value).toBe(15); // Re-runs and gets new untracked value
            expect(callback).toHaveBeenCalledWith(15);
        });
    });

    describe('Complex scenarios (Glitch-free)', () => {
        it('should handle diamond dependency pattern without glitches', () => {
            const source = signal(1);
            const left = computed(() => source.value * 2);
            const right = computed(() => source.value * 3);
            const result = computed(() => left.value + right.value);
            const callback = jest.fn();

            result.subscribe(callback);
            expect(result.value).toBe(5);

            source.value = 2;

            // Access value to trigger updates down the chain
            expect(result.value).toBe(10);
            // The subscriber should only be called ONCE with the final result
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(10);
        });

        it('should handle effects with multiple dependencies in a batch', async () => {
            const a = signal(1);
            const b = signal(2);
            const callback = jest.fn();

            effect(() => {
                callback(a.value + b.value);
            });

            expect(callback).toHaveBeenCalledWith(3);
            expect(callback).toHaveBeenCalledTimes(1);

            batch(() => {
                a.value = 10;
                b.value = 20;
            });
            await flushPromises();

            // The effect should run only ONCE after the batch is complete
            expect(callback).toHaveBeenCalledWith(30);
            expect(callback).toHaveBeenCalledTimes(2);
        });
    });
});
