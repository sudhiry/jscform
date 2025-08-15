/**
 * Simple Signals Core Library
 * A minimal reactive programming library for JavaScript
 */

// Type definitions
type SubscriberCallback<T = any> = (value: T) => void;
type ComputeFn<T = any> = () => T;
type EffectFn = () => void;
type UnsubscribeFn = () => void;
type ErrorHandler = (error: Error) => void;

interface EffectOptions {
    immediate?: boolean;
    onError?: ErrorHandler;
}

interface Computation {
    addDependency(signal: Signal<any>): void;
}

interface Staleable {
    markStale(): void;
}

// Global state for dependency tracking
let currentComputation: Computation | null = null;
let nextSignalId = 0;

/**
 * Base Signal class - represents a reactive value
 */
class Signal<T = any> {
    public readonly id: number;
    protected _value: T;
    public readonly subscribers: Set<SubscriberCallback<T>>;
    public readonly computedSignals: Set<Staleable>;

    constructor(initialValue: T) {
        this.id = nextSignalId++;
        this._value = initialValue;
        this.subscribers = new Set();
        this.computedSignals = new Set();
    }

    get value(): T {
        // Register this signal as a dependency if we're inside a computation
        if (currentComputation) {
            currentComputation.addDependency(this);
        }
        return this._value;
    }

    set value(newValue: T) {
        if (this._value !== newValue) {
            this._value = newValue;
            this.notify();
        }
    }

    notify(): void {
        // Notify direct subscribers
        this.subscribers.forEach(callback => {
            try {
                callback(this._value);
            } catch (error) {
                console.error('Error in signal subscriber:', error);
            }
        });

        // If batching, defer computed signal notifications
        if (isBatching) {
            batchedSignals.add(this);
        } else {
            // Notify computed signals that depend on this
            this.computedSignals.forEach(computed => computed.markStale());
        }
    }

    subscribe(callback: SubscriberCallback<T>): UnsubscribeFn {
        this.subscribers.add(callback);
        // Return unsubscribe function
        return () => this.subscribers.delete(callback);
    }

    // Subscribe and immediately call with current value
    watch(callback: SubscriberCallback<T>): UnsubscribeFn {
        const unsubscribe = this.subscribe(callback);
        callback(this._value);
        return unsubscribe;
    }

    toString(): string {
        return `Signal(${this._value})`;
    }
}

/**
 * Computed Signal class - represents a derived reactive value
 */
class ComputedSignal<T = any> extends Signal<T> implements Computation {
    private readonly computeFn: ComputeFn<T>;
    private readonly dependencies: Set<Signal<any>>;
    private isStale: boolean;
    private isComputing: boolean;

    constructor(computeFn: ComputeFn<T>) {
        super(undefined as any); // Will be computed on first access
        this.computeFn = computeFn;
        this.dependencies = new Set();
        this.isStale = true;
        this.isComputing = false;
    }

    get value(): T {
        if (this.isStale && !this.isComputing) {
            this.recompute();
        }

        // Register this computed as a dependency for other computations
        if (currentComputation && currentComputation !== this) {
            currentComputation.addDependency(this);
        }

        return this._value;
    }

    set value(_newValue: T) {
        throw new Error('Cannot directly set the value of a computed signal');
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
            // Recompute immediately to get the new value, then notify if changed
            const oldValue = this._value;
            this.recompute();
            // Only notify if the value actually changed after recomputation
            if (this._value !== oldValue) {
                this.notify();
            }
        }
    }

    private recompute(): void {
        if (this.isComputing) {
            throw new Error('Circular dependency detected in computed signal');
        }

        this.isComputing = true;
        this.isStale = false;

        // Clear old dependencies
        this.clearDependencies();

        // Set up dependency tracking
        const previousComputation = currentComputation;
        currentComputation = this;

        try {
            const newValue = this.computeFn();

            // Only notify if value actually changed
            if (this._value !== newValue) {
                this._value = newValue;
                this.notify();
            }
        } catch (error) {
            console.error('Error in computed signal:', error);
            throw error;
        } finally {
            currentComputation = previousComputation;
            this.isComputing = false;
        }
    }

    dispose(): void {
        this.clearDependencies();
        this.subscribers.clear();
    }

    toString(): string {
        return `ComputedSignal(${this._value})`;
    }
}

/**
 * Effect class - runs side effects when dependencies change
 */
class Effect implements Computation {
    private readonly effectFn: EffectFn;
    private readonly dependencies: Set<Signal<any>>;
    private isRunning: boolean;
    private isDisposed: boolean;
    private readonly immediate: boolean;
    private readonly onError: ErrorHandler;

    constructor(effectFn: EffectFn, options: EffectOptions = {}) {
        this.effectFn = effectFn;
        this.dependencies = new Set();
        this.isRunning = false;
        this.isDisposed = false;

        // Options
        this.immediate = options.immediate !== false; // Run immediately by default
        this.onError = options.onError || ((error: Error) => console.error('Effect error:', error));

        if (this.immediate) {
            this.run();
        }
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
        if (!this.isDisposed) {
            queueMicrotask(() => this.run());
        }
    }

    run(): void {
        if (this.isRunning || this.isDisposed) return;

        this.isRunning = true;
        this.clearDependencies();

        const previousComputation = currentComputation;
        currentComputation = this;

        try {
            this.effectFn();
        } catch (error) {
            this.onError(error as Error);
        } finally {
            currentComputation = previousComputation;
            this.isRunning = false;
        }
    }

    dispose(): void {
        this.isDisposed = true;
        this.clearDependencies();
    }
}

/**
 * Public API functions
 */

/**
 * Create a new signal with an initial value
 * @param initialValue - The initial value
 * @returns A new signal
 */
function signal<T>(initialValue: T): Signal<T> {
    return new Signal(initialValue);
}

/**
 * Create a computed signal that derives its value from other signals
 * @param computeFn - Function that computes the derived value
 * @returns A new computed signal
 */
function computed<T>(computeFn: ComputeFn<T>): ComputedSignal<T> {
    return new ComputedSignal(computeFn);
}

/**
 * Create an effect that runs when its dependencies change
 * @param effectFn - Function to run when dependencies change
 * @param options - Options for the effect
 * @returns A new effect
 */
function effect(effectFn: EffectFn, options?: EffectOptions): Effect {
    return new Effect(effectFn, options);
}

// Global batching state
let isBatching = false;
let batchedSignals = new Set<Signal<any>>();

/**
 * Batch multiple signal updates to avoid multiple notifications
 * @param updateFn - Function that updates signals
 */
function batch(updateFn: () => void): void {
    if (isBatching) {
        // Already batching, just run the function
        updateFn();
        return;
    }

    isBatching = true;
    batchedSignals.clear();

    try {
        updateFn();
    } finally {
        isBatching = false;
        
        // Notify all batched signals at once
        const signalsToNotify = Array.from(batchedSignals);
        batchedSignals.clear();
        
        signalsToNotify.forEach(signal => {
            signal.computedSignals.forEach(computed => computed.markStale());
        });
    }
}

/**
 * Untrack - run code without creating dependencies
 * @param fn - Function to run without tracking
 * @returns Result of the function
 */
function untrack<T>(fn: () => T): T {
    const previousComputation = currentComputation;
    currentComputation = null;

    try {
        return fn();
    } finally {
        currentComputation = previousComputation;
    }
}

/**
 * Utility: Check if a value is a signal
 * @param value - Value to check
 * @returns True if value is a signal
 */
function isSignal(value: any): value is Signal<any> {
    return value instanceof Signal;
}

// Export the public API
export {
    signal,
    computed,
    effect,
    batch,
    untrack,
    isSignal,
    Signal,
    ComputedSignal,
    Effect
};

// Export types for external use
export type {
    SubscriberCallback,
    ComputeFn,
    EffectFn,
    UnsubscribeFn,
    ErrorHandler,
    EffectOptions,
    Computation,
    Staleable
};
