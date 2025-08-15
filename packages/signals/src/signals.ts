/**
 * Simple Signals Core Library
 * A minimal reactive programming library for JavaScript
 */

// Type definitions
type SubscriberCallback<T = any> = (value: T) => void;
type ComputeFn<T = any> = () => T;
type EffectFn = () => void;
type UnsubscribeFn = () => void;
export type ErrorHandler = (error: Error) => void;

interface EffectOptions {
    immediate?: boolean;
    onError?: ErrorHandler;
}

export interface Computation {
    addDependency(signal: Signal<any>): void;
}

export interface Staleable {
    markStale(): void;
}

// Global state for dependency tracking
// Exported so other modules (like async-signal) can access it.
export let currentComputation: Computation | null = null;
let nextSignalId = 0;

// Exported a setter function to allow modification from other modules.
export function setCurrentComputation(computation: Computation | null) {
    currentComputation = computation;
}

// Global batching state
let isBatching = false;
let batchedSignals = new Set<Signal<any>>();

/**
 * Base Signal class - represents a reactive value
 */
export class Signal<T = any> {
    public readonly id: number;
    protected _value: T;
    public readonly subscribers: Set<SubscriberCallback<T>>;
    public readonly dependents: Set<Staleable>; // Renamed from computedSignals for clarity

    constructor(initialValue: T) {
        this.id = nextSignalId++;
        this._value = initialValue;
        this.subscribers = new Set();
        this.dependents = new Set();
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
        // Notify direct subscribers first
        this.subscribers.forEach(callback => {
            try {
                callback(this._value);
            } catch (error) {
                console.error('Error in signal subscriber:', error);
            }
        });

        // If batching, defer dependent notifications
        if (isBatching) {
            batchedSignals.add(this);
        } else {
            // Notify dependents (computed signals and effects) that they are stale
            this.dependents.forEach(dep => dep.markStale());
        }
    }

    subscribe(callback: SubscriberCallback<T>): UnsubscribeFn {
        this.subscribers.add(callback);
        // Return unsubscribe function
        return () => this.subscribers.delete(callback);
    }

    watch(callback: SubscriberCallback<T>): UnsubscribeFn {
        callback(this._value);
        return this.subscribe(callback);
    }

    toString(): string {
        return `Signal(${this._value})`;
    }
}

/**
 * Computed Signal class - represents a derived reactive value
 */
class ComputedSignal<T = any> extends Signal<T> implements Computation, Staleable {
    private readonly computeFn: ComputeFn<T>;
    private readonly dependencies: Set<Signal<any>>;
    private isStale: boolean;
    private isComputing: boolean;

    constructor(computeFn: ComputeFn<T>) {
        // Initialize with a placeholder value. The real value is computed on first access.
        super(undefined as any);
        this.computeFn = computeFn;
        this.dependencies = new Set();
        this.isStale = true;
        this.isComputing = false;
    }

    get value(): T {
        if (this.isComputing) {
            throw new Error('Circular dependency detected in computed signal');
        }

        // Recompute the value only if it's stale.
        if (this.isStale) {
            this.recompute();
        }

        // Register this computed signal as a dependency for other computations
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
            // Propagate stale notification to its own dependents
            this.dependents.forEach(dep => dep.markStale());
            // Notify direct subscribers that the value is now stale and needs re-reading
            // this.recompute();
        }
    }

    private recompute(): void {
        const oldValue = this._value;
        this.isComputing = true;

        const previousComputation = currentComputation;
        setCurrentComputation(this);

        // ensuring a clean slate for the compute function to re-track everything.
        this.clearDependencies();

        try {
            const newValue = this.computeFn();

            this.isStale = false;

            if (oldValue !== newValue) {
                this._value = newValue;
                this.notify();
            }
        } catch (error) {
            console.error('Error recomputing computed signal:', error);
            throw error;
        } finally {
            setCurrentComputation(previousComputation);
            this.isComputing = false;
        }
    }

    dispose(): void {
        this.clearDependencies();
        this.subscribers.clear();
    }

    toString(): string {
        return `ComputedSignal(${this.value})`;
    }
}

/**
 * Effect class - runs side effects when dependencies change
 */
class Effect implements Computation, Staleable {
    private readonly effectFn: EffectFn;
    private readonly dependencies: Set<Signal<any>>;
    private isRunning: boolean;
    private isDisposed: boolean;
    private isStale: boolean; // Add isStale flag
    private readonly onError: ErrorHandler;

    constructor(effectFn: EffectFn, options: EffectOptions = {}) {
        this.effectFn = effectFn;
        this.dependencies = new Set();
        this.isRunning = false;
        this.isDisposed = false;
        this.isStale = false; // Initialize isStale
        this.onError = options.onError || ((error: Error) => console.error('Effect error:', error));

        if (options.immediate !== false) {
            this.run();
        }
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
        if (!this.isDisposed && !this.isStale) {
            this.isStale = true;
            queueMicrotask(() => this.run());
        }
    }

    run(): void {
        if (this.isRunning || this.isDisposed) return;

        this.isRunning = true;
        this.isStale = false; // Reset stale flag before running
        this.clearDependencies();

        const previousComputation = currentComputation;
        setCurrentComputation(this);

        try {
            this.effectFn();
        } catch (error) {
            this.onError(error as Error);
        } finally {
            setCurrentComputation(previousComputation);
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

export function signal<T>(initialValue: T): Signal<T> {
    return new Signal(initialValue);
}

export function computed<T>(computeFn: ComputeFn<T>): ComputedSignal<T> {
    return new ComputedSignal(computeFn);
}

export function effect(effectFn: EffectFn, options?: EffectOptions): Effect {
    return new Effect(effectFn, options);
}

export function batch(updateFn: () => void): void {
    if (isBatching) {
        // If already in a batch, just run the function
        updateFn();
        return;
    }

    isBatching = true;
    batchedSignals.clear();

    try {
        updateFn();
    } finally {
        isBatching = false;

        // Make a copy of the signals to notify, in case new ones are added during notification
        const signalsToNotify = Array.from(batchedSignals);
        batchedSignals.clear();

        // Trigger the stale-marking process for all dependents of changed signals
        signalsToNotify.forEach(signal => {
            signal.dependents.forEach(dep => dep.markStale());
        });
    }
}

export function untrack<T>(fn: () => T): T {
    const previousComputation = currentComputation;
    setCurrentComputation(null);
    try {
        return fn();
    } finally {
        setCurrentComputation(previousComputation);
    }
}

export function isSignal(value: any): value is Signal<any> {
    return value instanceof Signal;
}
