/**
 * Ultra-Simple Async Computed Signals (Corrected)
 * Just like regular computed, but supports async functions
 */

import { Signal, currentComputation, setCurrentComputation } from './signals';
import type { Computation, ErrorHandler, Staleable } from './signals';

// Type definitions for async signals
// This allows all dependencies to be tracked before any async operation begins.
export type AsyncComputeFn<T = any> = () => Promise<T>;

export interface AsyncComputedOptions<T = any> {
    initialValue?: T;
    debounce?: number;
    onError?: ErrorHandler;
}

/**
 * AsyncComputed - A computed signal that handles async functions.
 */
export class AsyncComputed<T = any> extends Signal<T> implements Computation, Staleable {
    private readonly asyncComputeFn: AsyncComputeFn<T>;
    private readonly dependencies: Set<Signal<any>>;
    private isStale: boolean;
    private isComputing: boolean;
    private abortController: AbortController;

    // Options
    private readonly debounceMs: number;
    // FIX: Use ReturnType<typeof setTimeout> for cross-platform (browser/node) compatibility.
    private debounceTimer: ReturnType<typeof setTimeout> | null;
    private readonly onError: ErrorHandler;

    constructor(asyncComputeFn: AsyncComputeFn<T>, options: AsyncComputedOptions<T> = {}) {
        // Use `undefined` for a more conventional "not yet loaded" initial state.
        super(options.initialValue as T);

        this.asyncComputeFn = asyncComputeFn;
        this.dependencies = new Set();
        this.isStale = true;
        this.isComputing = false;
        this.abortController = new AbortController();

        // Options
        this.debounceMs = options.debounce || 0;
        this.debounceTimer = null;
        this.onError = options.onError || ((error: Error) => console.error('AsyncComputed error:', error));

        // Initial computation
        this.recompute();
    }

    get value(): T {
        // The value getter is now simpler. It just registers dependencies and returns the current state.
        // The re-computation logic is handled by `markStale`.
        if (currentComputation && currentComputation !== this) {
            currentComputation.addDependency(this);
        }
        return this._value;
    }

    set value(_newValue: T) {
        throw new Error('Cannot directly set the value of an async computed signal');
    }

    addDependency(signal: Signal<any>): void {
        if (!this.dependencies.has(signal)) {
            this.dependencies.add(signal);
            signal.dependents.add(this);
        }
    }

    clearDependencies(): void {
        this.dependencies.forEach(dep => {
            dep.dependents.delete(this);
        });
        this.dependencies.clear();
    }

    markStale(): void {
        if (!this.isStale) {
            this.isStale = true;
            // Schedule a re-computation. This is an "eager" approach, unlike the lazy
            // synchronous computed signal.
            this.scheduleComputation();
        }
    }

    private scheduleComputation(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (this.debounceMs > 0) {
            this.debounceTimer = setTimeout(() => {
                this.recompute();
            }, this.debounceMs);
        } else {
            // Use a microtask to batch synchronous updates within the same event loop tick.
            queueMicrotask(() => this.recompute());
        }
    }

    private async recompute(): Promise<void> {
        // If a computation is already running for this signal, abort the old one and start over.
        if (this.isComputing) {
            this.abortController.abort();
            this.abortController = new AbortController();
        }

        if (!this.isStale) return;

        this.isComputing = true;
        this.isStale = false;
        const localAbortSignal = this.abortController.signal;

        // FIX: The core logic change is here. We run the user's function synchronously
        // to track all dependencies, then we await the promise it returns.
        const previousComputation = currentComputation;
        setCurrentComputation(this);
        this.clearDependencies();

        try {
            const promise = this.asyncComputeFn(); // This tracks dependencies
            setCurrentComputation(previousComputation); // Restore context immediately

            const result = await promise;

            // If this computation was aborted while it was running, do not update the value.
            if (localAbortSignal.aborted) {
                return;
            }

            if (this._value !== result) {
                this._value = result;
                this.notify();
            }

        } catch (error) {
            setCurrentComputation(previousComputation); // Ensure context is restored on error
            if (!localAbortSignal.aborted) {
                this.onError(error as Error);
            }
        } finally {
            // Only mark as not computing if this specific run wasn't aborted.
            if (!localAbortSignal.aborted) {
                this.isComputing = false;
            }
        }
    }

    dispose(): void {
        this.abortController.abort();
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.clearDependencies();
        this.subscribers.clear();
    }
}


/**
 * Create an async computed signal
 * @param asyncComputeFn - A synchronous function that returns a Promise. All signals accessed within this function will be tracked as dependencies.
 * @param options - Options: { debounce, initialValue, onError }
 * @returns An async computed signal
 */
export function asyncComputed<T>(asyncComputeFn: AsyncComputeFn<T>, options: AsyncComputedOptions<T> = {}): AsyncComputed<T> {
    return new AsyncComputed(asyncComputeFn, options);
}
