/**
 * React Integration for Simple Signals Library
 * Hooks and utilities to use signals with React
 */

import React, { useState, useEffect, useRef, useCallback, ReactNode, ComponentType } from 'react';
import { signal, computed, effect, Signal, ComputedSignal, Effect } from './signals';
import { asyncComputed, AsyncComputed, AsyncComputedOptions } from './async-signals';


/**
 * Hook to subscribe to a signal and trigger re-renders
 */
function useSignal<T>(signalInstance: Signal<T>): T {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = signalInstance.subscribe(() => {
      forceUpdate({}); // Force re-render when signal changes
    });
    
    return unsubscribe;
  }, [signalInstance]);
  
  return signalInstance.value;
}

/**
 * Hook to create a signal that persists across re-renders
 */
function useSignalState<T>(initialValue: T): [T, (newValue: T) => void, Signal<T>] {
  const signalRef = useRef<Signal<T> | null>(null);
  
  if (!signalRef.current) {
    signalRef.current = signal(initialValue);
  }
  
  const value = useSignal(signalRef.current);
  const setValue = useCallback((newValue: T) => {
    if (signalRef.current) {
      signalRef.current.value = newValue;
    }
  }, []);
  
  return [value, setValue, signalRef.current];
}

/**
 * Hook to create a computed signal
 */
function useComputed<T>(computeFn: () => T, deps: React.DependencyList = []): T {
  const computedRef = useRef<ComputedSignal<T> | null>(null);
  
  // Create computed signal on first render or when deps change
  const depsKey = JSON.stringify(deps);
  const prevDepsRef = useRef(depsKey);
  
  if (!computedRef.current || prevDepsRef.current !== depsKey) {
    computedRef.current?.dispose?.();
    computedRef.current = computed(computeFn);
    prevDepsRef.current = depsKey;
  }
  
  const value = useSignal(computedRef.current);
  
  useEffect(() => {
    return () => {
      computedRef.current?.dispose?.();
    };
  }, []);
  
  return value;
}

/**
 * Hook to create an async computed signal
 */
function useAsyncComputed<T>(
  asyncComputeFn: (signal: AbortSignal) => Promise<T>, 
  options: AsyncComputedOptions<T> = {}, 
  deps: React.DependencyList = []
): {
  data: T;
  loading: boolean;
  error: Error | null;
} {
  const asyncComputedRef = useRef<AsyncComputed<T> | null>(null);
  
  const depsKey = JSON.stringify(deps);
  const prevDepsRef = useRef(depsKey);
  
  if (!asyncComputedRef.current || prevDepsRef.current !== depsKey) {
    asyncComputedRef.current?.dispose?.();
    asyncComputedRef.current = asyncComputed(asyncComputeFn, options);
    prevDepsRef.current = depsKey;
  }
  
  const value = useSignal(asyncComputedRef.current);
  
  useEffect(() => {
    return () => {
      asyncComputedRef.current?.dispose?.();
    };
  }, []);
  
  return {
    data: value,
    loading: false, // AsyncComputed doesn't expose loading state directly
    error: null     // AsyncComputed doesn't expose error state directly
  };
}

/**
 * Hook to run effects based on signals
 */
function useSignalEffect(effectFn: () => void, deps: React.DependencyList = []): void {
  const effectRef = useRef<Effect | null>(null);
  
  useEffect(() => {
    effectRef.current?.dispose?.();
    effectRef.current = effect(effectFn);
    
    return () => {
      effectRef.current?.dispose?.();
    };
  }, deps);
}

/**
 * Hook to create signals from props (useful for derived state)
 */
function useSignalFromProp<T>(propValue: T): Signal<T> {
  const signalRef = useRef<Signal<T> | null>(null);
  
  if (!signalRef.current) {
    signalRef.current = signal(propValue);
  }
  
  // Update signal when prop changes
  useEffect(() => {
    if (signalRef.current) {
      signalRef.current.value = propValue;
    }
  }, [propValue]);
  
  return signalRef.current;
}

// 🎯 HIGHER-ORDER COMPONENTS AND UTILITIES

/**
 * Signal proxy function type
 */
type SignalProxy = <T>(signalInstance: Signal<T>) => T;

/**
 * Props with signal proxy
 */
type PropsWithSignalProxy<P = {}> = P & {
  $: SignalProxy;
};

/**
 * HOC to automatically subscribe components to signals
 */
function withSignals<P extends object>(
  Component: ComponentType<PropsWithSignalProxy<P>>
): ComponentType<P> {
  return function SignalComponent(props: P) {
    const [, forceUpdate] = useState({});
    const subscribedSignals = useRef(new Set<Signal<any>>());
    
    // Proxy to track signal access
    const signalProxy = useCallback(<T,>(signalInstance: Signal<T>): T => {
      if (!subscribedSignals.current.has(signalInstance)) {
        subscribedSignals.current.add(signalInstance);
        signalInstance.subscribe(() => forceUpdate({}));
      }
      return signalInstance.value;
    }, []);
    
    useEffect(() => {
      return () => {
        // Cleanup is handled by signal's internal unsubscribe
        subscribedSignals.current.clear();
      };
    }, []);
    
    return React.createElement(Component, { ...props, $: signalProxy } as PropsWithSignalProxy<P>);
  };
}

/**
 * Signal context type
 */
type SignalContextType = Record<string, Signal<any>>;

/**
 * Provider for global signals
 */
const SignalContext = React.createContext<SignalContextType>({});

interface SignalProviderProps {
  signals: SignalContextType;
  children: ReactNode;
}

function SignalProvider({ signals, children }: SignalProviderProps): React.ReactElement {
  return React.createElement(
    SignalContext.Provider,
    { value: signals },
    children
  );
}

function useSignalContext(): SignalContextType {
  return React.useContext(SignalContext);
}

export {
  useSignal,
  useSignalState,
  useComputed,
  useAsyncComputed,
  useSignalEffect,
  useSignalFromProp,
  withSignals,
  SignalProvider,
  useSignalContext,
};

// Export types for external use
export type {
  SignalProxy,
  PropsWithSignalProxy,
  SignalContextType,
  SignalProviderProps,
};
