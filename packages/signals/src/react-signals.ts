/**
 * React Integration for Simple Signals Library (Corrected)
 * Hooks and utilities to use signals with React
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useSyncExternalStore,
    ReactNode,
    createContext,
    useContext,
    createElement
} from 'react';
import {
    signal,
    effect,
    Signal
} from './signals';
import {
    asyncComputed
} from './async-signals';
import type {
    AsyncComputedOptions,
    AsyncComputeFn
} from './async-signals';


/**
 * Hook to subscribe to a signal and trigger re-renders.
 * This is the most efficient way to bind a signal to a React component.
 */
export function useSignal<T>(signalInstance: Signal<T>): T {
    const subscribe = useCallback(
        (callback: () => void) => {
            return signalInstance.subscribe(callback);
        }, [signalInstance]
    );

    const getSnapshot = useCallback(() => {
        return signalInstance.value;
    }, [signalInstance]);

    return useSyncExternalStore(subscribe, getSnapshot);
}

/**
 * Hook to create a signal that persists across re-renders.
 * Returns the signal's value, a setter function, and the signal instance itself.
 */
export function useSignalState<T>(initialValue: T): [T, (newValue: T) => void, Signal<T>] {
    const signalInstance = useMemo(() => signal(initialValue), []);

    const value = useSignal(signalInstance);

    const setValue = useCallback((newValue: T) => {
        signalInstance.value = newValue;
    }, [signalInstance]);

    return [value, setValue, signalInstance];
}

/**
 * Hook to run an effect that tracks signal dependencies, and re-runs when they change.
 */
export function useSignalEffect(effectFn: () => void, deps: React.DependencyList): void {
    useEffect(() => {
        const eff = effect(effectFn);
        return () => {
            eff.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}

/**
 * FIX: This hook is re-implemented to be more idiomatic for React.
 * It uses useState and useSignalEffect to create a derived value that correctly
 * triggers re-renders when its underlying signal dependencies change.
 */
export function useComputed<T>(computeFn: () => T, deps: React.DependencyList): T {
    // Initialize state with the first computed value.
    const [value, setValue] = useState(computeFn);

    // Use an effect to listen to signal changes and update the React state.
    useSignalEffect(() => {
        setValue(computeFn());
    }, deps);

    return value;
}

/**
 * Hook to create an async computed signal that manages loading and error states.
 */
export function useAsyncComputed<T>(
    asyncComputeFn: AsyncComputeFn<T>,
    deps: React.DependencyList,
    options: AsyncComputedOptions<T> = {}
): {
    data: T | undefined;
    loading: boolean;
    error: Error | null;
} {
    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const memoizedOptions = useMemo(() => ({
        ...options,
        onError: (err: Error) => {
            setError(err);
            options.onError?.(err);
        },
    }), [options]);

    const asyncComputedInstance = useMemo(() => {
        setIsLoading(true);
        setError(null);
        return asyncComputed(asyncComputeFn, memoizedOptions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        const unsubscribe = asyncComputedInstance.subscribe(() => {
            setIsLoading(false);
        });
        return () => {
            unsubscribe();
            asyncComputedInstance.dispose();
        };
    }, [asyncComputedInstance]);

    const data = useSignal(asyncComputedInstance);

    return {
        data,
        loading: isLoading,
        error,
    };
}

/**
 * Hook to create a signal from a prop. The signal's value will automatically
 * update when the prop value changes.
 */
export function useSignalFromProp<T>(propValue: T): Signal<T> {
    const signalInstance = useMemo(() => signal(propValue), []);

    useEffect(() => {
        signalInstance.value = propValue;
    }, [propValue, signalInstance]);

    return signalInstance;
}

/**
 * Signal context type
 */
export type SignalContextType = Record<string, Signal<any>>;

/**
 * Provider for global signals
 */
export const SignalContext = createContext<SignalContextType>({});

export interface SignalProviderProps {
    signals: SignalContextType;
    children: ReactNode;
}

export function SignalProvider({signals, children}: SignalProviderProps) {
    return createElement(
        SignalContext.Provider,
        {value: signals},
        children
    );
}

export function useSignalContext(): SignalContextType {
    return useContext(SignalContext);
}
