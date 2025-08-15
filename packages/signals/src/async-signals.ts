/**
 * Ultra-Simple Async Computed Signals
 * Just like regular computed, but supports async functions
 */

import { Signal } from './signals';
import type { Computation, ErrorHandler, Staleable } from './signals';

// Type definitions for async signals
type AsyncComputeFn<T = any> = (signal: AbortSignal) => Promise<T>;

interface AsyncComputedOptions<T = any> {
    initialValue?: T;
    debounce?: number;
    onError?: ErrorHandler;
}

// Extend global interface for currentComputation
declare global {
    var currentComputation: Computation | null;
}

/**
 * AsyncComputed - A computed signal that handles async functions
 * Returns the computed value directly, just like regular computed
 */
class AsyncComputed<T = any> extends Signal<T> implements Computation, Staleable {
    private readonly asyncComputeFn: AsyncComputeFn<T>;
    private readonly dependencies: Set<Signal<any>>;
    private isStale: boolean;
    private isComputing: boolean;
    private abortController: AbortController | null;
    
    // Options
    private readonly debounceMs: number;
    private debounceTimer: NodeJS.Timeout | null;
    private readonly onError: ErrorHandler;

    constructor(asyncComputeFn: AsyncComputeFn<T>, options: AsyncComputedOptions<T> = {}) {
        super(options.initialValue ?? null as T);
        
        this.asyncComputeFn = asyncComputeFn;
        this.dependencies = new Set();
        this.isStale = true;
        this.isComputing = false;
        this.abortController = null;
        
        // Options
        this.debounceMs = options.debounce || 0;
        this.debounceTimer = null;
        this.onError = options.onError || ((error: Error) => console.error('AsyncComputed error:', error));
    }

    get value(): T {
        // Trigger computation if needed
        if (this.isStale && !this.isComputing) {
            if (this.debounceMs > 0) {
                this.scheduleComputation();
            } else {
                this.recompute();
            }
        }

        // Register as dependency for other computations
        if (globalThis.currentComputation && globalThis.currentComputation !== this) {
            globalThis.currentComputation.addDependency(this);
        }

        return this._value;
    }

    set value(_newValue: T) {
        throw new Error('Cannot directly set the value of an async computed signal');
    }

    addDependency(signal: Signal<any>): void {
        if (!this.dependencies.has(signal)) {
            this.dependencies.add(signal);
            signal.computedSignals.add(this);
        }
    }

    clearDependencies(): void {
        this.dependencies.forEach(dep => {
            dep.computedSignals.delete(this);
        });
        this.dependencies.clear();
    }

    markStale(): void {
        if (!this.isStale) {
            this.isStale = true;
            
            // Cancel ongoing computation
            if (this.abortController) {
                this.abortController.abort();
            }
            
            queueMicrotask(() => {
                if (this.isStale && !this.isComputing) {
                    if (this.debounceMs > 0) {
                        this.scheduleComputation();
                    } else {
                        this.recompute();
                    }
                }
            });
        }
    }

    private scheduleComputation(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.recompute();
        }, this.debounceMs);
    }

    private async recompute(): Promise<void> {
        if (this.isComputing) return;

        this.isComputing = true;
        this.isStale = false;

        // Cancel previous computation
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        // Clear old dependencies
        this.clearDependencies();

        // Set up dependency tracking
        const previousComputation = globalThis.currentComputation;
        globalThis.currentComputation = this;

        try {
            // Run async computation
            const result = await this.asyncComputeFn(this.abortController.signal);

            // Check if computation was aborted
            if (this.abortController.signal.aborted) {
                return;
            }

            // Update value if it changed
            if (this._value !== result) {
                this._value = result;
                this.notify();
            }

        } catch (error) {
            if (!this.abortController.signal.aborted) {
                this.onError(error as Error);
                // Optionally, you could set the value to null or keep the previous value
                // this._value = null;
            }
        } finally {
            globalThis.currentComputation = previousComputation;
            this.isComputing = false;
        }
    }

    dispose(): void {
        if (this.abortController) {
            this.abortController.abort();
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.clearDependencies();
        this.subscribers.clear();
    }
}

// Add currentComputation to global if not exists
if (!globalThis.currentComputation) {
    globalThis.currentComputation = null;
}

/**
 * Create an async computed signal
 * @param asyncComputeFn - Async function to compute the value
 * @param options - Options: { debounce, initialValue, onError }
 * @returns Async computed signal
 */
function asyncComputed<T>(asyncComputeFn: AsyncComputeFn<T>, options: AsyncComputedOptions<T> = {}): AsyncComputed<T> {
    return new AsyncComputed(asyncComputeFn, options);
}

export {
    AsyncComputed,
    asyncComputed
};

// Export types for external use
export type {
    AsyncComputeFn,
    AsyncComputedOptions
};
