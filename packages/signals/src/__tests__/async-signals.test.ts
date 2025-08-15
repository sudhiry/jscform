import { signal, computed } from '../signals';
import { asyncComputed } from '../async-signals';

// A robust helper to flush all pending promises and timers
const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('Async Signals (Corrected Tests)', () => {
    // Use modern fake timers for better async control
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('asyncComputed()', () => {
        it('should create an async computed signal with an initial value', () => {
            const asyncComp = asyncComputed(
                () => new Promise(resolve => setTimeout(() => resolve('async result'), 100)), {
                    initialValue: 'loading...'
                }
            );
            expect(asyncComp.value).toBe('loading...');
        });

        it('should have an undefined initial value by default', () => {
            const asyncComp = asyncComputed(() => Promise.resolve('value'));
            expect(asyncComp.value).toBe(undefined);
        });

        it('should update value when async computation completes', async () => {
            const asyncComp = asyncComputed(() =>
                new Promise(resolve => setTimeout(() => resolve('completed'), 100))
            );

            expect(asyncComp.value).toBe(undefined);

            await jest.advanceTimersByTimeAsync(100);
            await flushPromises();

            expect(asyncComp.value).toBe('completed');
        });

        it('should recompute when dependencies change', async () => {
            const source = signal(1);
            const asyncComp = asyncComputed(() =>
                new Promise(resolve => {
                    const value = source.value;
                    setTimeout(() => resolve(value * 2), 50);
                })
            );

            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();
            expect(asyncComp.value).toBe(2);

            source.value = 5;
            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();
            expect(asyncComp.value).toBe(10);
        });

        it('should support debouncing', async () => {
            const source = signal(1);
            const computeFn = jest.fn(() =>
                new Promise(resolve => {
                    const value = source.value;
                    setTimeout(() => resolve(value * 2), 10);
                })
            );

            const asyncComp = asyncComputed(computeFn, {
                debounce: 100
            });

            // Initial computation is still immediate
            expect(computeFn).toHaveBeenCalledTimes(1);
            await jest.advanceTimersByTimeAsync(10);
            await flushPromises();
            expect(asyncComp.value).toBe(2);

            // Trigger multiple rapid changes
            source.value = 2;
            source.value = 3;
            source.value = 4;

            // Should not have re-computed yet due to debouncing
            expect(computeFn).toHaveBeenCalledTimes(1);

            await jest.advanceTimersByTimeAsync(100);
            await flushPromises();

            // Should compute only once more with the latest value
            expect(computeFn).toHaveBeenCalledTimes(2);

            await jest.advanceTimersByTimeAsync(10);
            await flushPromises();
            expect(asyncComp.value).toBe(8); // 4 * 2
        });

        it('should handle errors with custom error handler', async () => {
            const errorHandler = jest.fn();
            asyncComputed(
                () =>
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Async error')), 50)
                    ), {
                    onError: errorHandler
                }
            );

            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();

            expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
        });

        it('should not update value if computation was aborted', async () => {
            const source = signal(1);
            const asyncComp = asyncComputed(() =>
                new Promise(resolve => {
                    const value = source.value;
                    setTimeout(() => resolve(value * 2), 100);
                })
            );

            // Wait for initial computation
            await jest.advanceTimersByTimeAsync(100);
            await flushPromises();
            expect(asyncComp.value).toBe(2);

            // Trigger a new computation
            source.value = 5;

            // Wait only 50ms, the computation is still running
            await jest.advanceTimersByTimeAsync(50);

            // Trigger another computation, which should abort the previous one
            source.value = 10;

            // Wait for the final computation to finish
            await jest.advanceTimersByTimeAsync(100);
            await flushPromises();

            // The value should be from the last computation, not the aborted one
            expect(asyncComp.value).toBe(20);
        });

        it('should work with regular computed signals as dependencies', async () => {
            const source = signal(2);
            const doubled = computed(() => source.value * 2);

            const asyncComp = asyncComputed(() =>
                new Promise(resolve => {
                    const value = doubled.value;
                    setTimeout(() => resolve(value + 10), 50);
                })
            );

            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();
            expect(asyncComp.value).toBe(14); // (2 * 2) + 10

            source.value = 5;
            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();
            expect(asyncComp.value).toBe(20); // (5 * 2) + 10
        });

        it('should notify subscribers when value changes', async () => {
            const source = signal(1);
            const asyncComp = asyncComputed(() =>
                new Promise(resolve => {
                    const value = source.value;
                    setTimeout(() => resolve(value * 2), 50);
                })
            );

            const callback = jest.fn();
            asyncComp.subscribe(callback);

            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();
            expect(callback).toHaveBeenCalledWith(2);

            source.value = 3;
            await jest.advanceTimersByTimeAsync(50);
            await flushPromises();
            expect(callback).toHaveBeenCalledWith(6);
            expect(callback).toHaveBeenCalledTimes(2);
        });
    });

    describe('AsyncComputed class', () => {
        it('should have proper dependency tracking', async () => {
            const source = signal(1);
            const asyncComp = asyncComputed(() => Promise.resolve(source.value * 2));

            // Wait for initial computation to establish dependency
            await flushPromises();

            // Check that source has asyncComp as a dependent
            expect(source.dependents.has(asyncComp)).toBe(true);

            // Dispose and check cleanup
            asyncComp.dispose();
            expect(source.dependents.has(asyncComp)).toBe(false);
        });

        it('should clear debounce timer on dispose', async () => {
            const source = signal(1);
            const computeFn = jest.fn(() => Promise.resolve(source.value));
            const asyncComp = asyncComputed(computeFn, {
                debounce: 100
            });

            // Wait for initial computation
            await flushPromises();
            expect(computeFn).toHaveBeenCalledTimes(1);

            // Trigger debounced computation
            source.value = 2;

            // Dispose before debounce timer fires
            asyncComp.dispose();

            // Advance time - should not cause any issues or new computations
            await jest.advanceTimersByTimeAsync(100);
            await flushPromises();
            expect(computeFn).toHaveBeenCalledTimes(1);
        });
    });

});
