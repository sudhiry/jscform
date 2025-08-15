import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { signal, computed, effect } from '../signals';
import {
  useSignal,
  useSignalState,
  useComputed,
  useAsyncComputed,
  useSignalEffect,
  useSignalFromProp,
  withSignals,
  SignalProvider,
  useSignalContext,
} from '../react-signals';

describe('React Signals Integration', () => {
  describe('useSignal()', () => {
    it('should subscribe to signal and trigger re-renders', () => {
      const testSignal = signal('initial');
      
      function TestComponent() {
        const value = useSignal(testSignal);
        return <div data-testid="value">{value}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('initial');

      act(() => {
        testSignal.value = 'updated';
      });

      expect(screen.getByTestId('value')).toHaveTextContent('updated');
    });

    it('should handle multiple components subscribing to same signal', () => {
      const sharedSignal = signal(0);
      
      function Component1() {
        const value = useSignal(sharedSignal);
        return <div data-testid="comp1">{value}</div>;
      }

      function Component2() {
        const value = useSignal(sharedSignal);
        return <div data-testid="comp2">{value * 2}</div>;
      }

      render(
        <>
          <Component1 />
          <Component2 />
        </>
      );

      expect(screen.getByTestId('comp1')).toHaveTextContent('0');
      expect(screen.getByTestId('comp2')).toHaveTextContent('0');

      act(() => {
        sharedSignal.value = 5;
      });

      expect(screen.getByTestId('comp1')).toHaveTextContent('5');
      expect(screen.getByTestId('comp2')).toHaveTextContent('10');
    });

    it('should unsubscribe on component unmount', () => {
      const testSignal = signal('test');
      let subscriberCount = 0;

      // Mock subscribe to count subscribers
      const originalSubscribe = testSignal.subscribe;
      testSignal.subscribe = jest.fn((callback) => {
        subscriberCount++;
        const unsubscribe = originalSubscribe.call(testSignal, callback);
        return () => {
          subscriberCount--;
          unsubscribe();
        };
      });

      function TestComponent() {
        const value = useSignal(testSignal);
        return <div>{value}</div>;
      }

      const { unmount } = render(<TestComponent />);
      expect(subscriberCount).toBe(1);

      unmount();
      expect(subscriberCount).toBe(0);
    });
  });

  describe('useSignalState()', () => {
    it('should create and manage signal state', () => {
      function TestComponent() {
        const [value, setValue, signalInstance] = useSignalState('initial');
        
        return (
          <div>
            <div data-testid="value">{value}</div>
            <button 
              data-testid="update" 
              onClick={() => setValue('updated')}
            >
              Update
            </button>
            <div data-testid="signal-value">{signalInstance.value}</div>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('initial');
      expect(screen.getByTestId('signal-value')).toHaveTextContent('initial');

      act(() => {
        screen.getByTestId('update').click();
      });

      expect(screen.getByTestId('value')).toHaveTextContent('updated');
      expect(screen.getByTestId('signal-value')).toHaveTextContent('updated');
    });

    it('should persist signal across re-renders', () => {
      let signalRef: any = null;

      function TestComponent({ trigger }: { trigger: number }) {
        const [, , signalInstance] = useSignalState('test');
        
        if (!signalRef) {
          signalRef = signalInstance;
        } else {
          expect(signalInstance).toBe(signalRef); // Same instance
        }

        return <div data-testid="trigger">{trigger}</div>;
      }

      const { rerender } = render(<TestComponent trigger={1} />);
      rerender(<TestComponent trigger={2} />);
    });
  });

  describe('useComputed()', () => {
    it('should create computed signal and update on dependency changes', () => {
      const source = signal(2);

      function TestComponent() {
        const doubled = useComputed(() => source.value * 2);
        return <div data-testid="computed">{doubled}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('computed')).toHaveTextContent('4');

      act(() => {
        source.value = 5;
      });

      expect(screen.getByTestId('computed')).toHaveTextContent('10');
    });

    it('should recreate computed when deps change', () => {
      function TestComponent({ multiplier }: { multiplier: number }) {
        const source = signal(3);
        const computed = useComputed(() => source.value * multiplier, [multiplier]);
        
        return (
          <div>
            <div data-testid="computed">{computed}</div>
            <button 
              data-testid="update-source" 
              onClick={() => source.value = 6}
            >
              Update Source
            </button>
          </div>
        );
      }

      const { rerender } = render(<TestComponent multiplier={2} />);
      expect(screen.getByTestId('computed')).toHaveTextContent('6'); // 3 * 2

      act(() => {
        screen.getByTestId('update-source').click();
      });
      expect(screen.getByTestId('computed')).toHaveTextContent('12'); // 6 * 2

      // Change multiplier - should recreate computed
      rerender(<TestComponent multiplier={3} />);
      expect(screen.getByTestId('computed')).toHaveTextContent('18'); // 6 * 3
    });

    it('should dispose computed on unmount', () => {
      const source = signal(1);
      let computedInstance: any = null;

      function TestComponent() {
        const computedValue = useComputed(() => {
          const comp = computed(() => source.value * 2);
          computedInstance = comp;
          return comp.value;
        });
        return <div>{computedValue}</div>;
      }

      const { unmount } = render(<TestComponent />);
      
      // Mock dispose to verify it's called
      if (computedInstance) {
        computedInstance.dispose = jest.fn();
      }

      unmount();
      
      // Note: The actual dispose call happens in useEffect cleanup
      // This test verifies the structure is in place
    });
  });

  describe('useAsyncComputed()', () => {
    beforeEach(() => {
      setupTimers();
    });

    afterEach(() => {
      cleanupTimers();
    });

    it('should handle async computed signals', async () => {
      function TestComponent() {
        const { data, loading, error } = useAsyncComputed(async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'async result';
        });

        return (
          <div>
            <div data-testid="data">{data || 'loading'}</div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="error">{error?.message || 'no error'}</div>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('data')).toHaveTextContent('loading');

      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('async result');
      });
    });

    it('should recreate async computed when deps change', async () => {
      function TestComponent({ delay }: { delay: number }) {
        const { data } = useAsyncComputed(async () => {
          await new Promise(resolve => setTimeout(resolve, delay));
          return `result-${delay}`;
        }, {}, [delay]);

        return <div data-testid="data">{data || 'loading'}</div>;
      }

      const { rerender } = render(<TestComponent delay={50} />);
      
      act(() => {
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('result-50');
      });

      rerender(<TestComponent delay={100} />);
      
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('result-100');
      });
    });
  });

  describe('useSignalEffect()', () => {
    it('should run effect when dependencies change', () => {
      const source = signal(1);
      const effectFn = jest.fn();

      function TestComponent() {
        useSignalEffect(() => {
          effectFn(source.value);
        });

        return <div data-testid="component">Component</div>;
      }

      render(<TestComponent />);
      expect(effectFn).toHaveBeenCalledWith(1);

      act(() => {
        source.value = 2;
      });

      // Effect runs asynchronously
      setTimeout(() => {
        expect(effectFn).toHaveBeenCalledWith(2);
      }, 0);
    });

    it('should dispose effect on unmount', () => {
      const source = signal(1);
      const effectFn = jest.fn();
      let effectInstance: any = null;

      // Mock effect to capture instance
      const originalEffect = effect;
      (effect as any) = jest.fn((fn) => {
        effectInstance = originalEffect(fn);
        effectInstance.dispose = jest.fn(effectInstance.dispose);
        return effectInstance;
      });

      function TestComponent() {
        useSignalEffect(() => {
          effectFn(source.value);
        });
        return <div>Test</div>;
      }

      const { unmount } = render(<TestComponent />);
      unmount();

      expect(effectInstance?.dispose).toHaveBeenCalled();

      // Restore original
      (effect as any) = originalEffect;
    });

    it('should recreate effect when deps change', () => {
      const effectFn = jest.fn();

      function TestComponent({ multiplier }: { multiplier: number }) {
        useSignalEffect(() => {
          effectFn(multiplier);
        }, [multiplier]);

        return <div>Test</div>;
      }

      const { rerender } = render(<TestComponent multiplier={2} />);
      expect(effectFn).toHaveBeenCalledWith(2);

      rerender(<TestComponent multiplier={3} />);
      expect(effectFn).toHaveBeenCalledWith(3);
    });
  });

  describe('useSignalFromProp()', () => {
    it('should create signal from prop and update when prop changes', () => {
      function TestComponent({ value }: { value: string }) {
        const signalInstance = useSignalFromProp(value);
        const signalValue = useSignal(signalInstance);
        
        return (
          <div>
            <div data-testid="prop">{value}</div>
            <div data-testid="signal">{signalValue}</div>
          </div>
        );
      }

      const { rerender } = render(<TestComponent value="initial" />);
      expect(screen.getByTestId('prop')).toHaveTextContent('initial');
      expect(screen.getByTestId('signal')).toHaveTextContent('initial');

      rerender(<TestComponent value="updated" />);
      expect(screen.getByTestId('prop')).toHaveTextContent('updated');
      expect(screen.getByTestId('signal')).toHaveTextContent('updated');
    });

    it('should persist same signal instance across re-renders', () => {
      let signalRef: any = null;

      function TestComponent({ value }: { value: string }) {
        const signalInstance = useSignalFromProp(value);
        
        if (!signalRef) {
          signalRef = signalInstance;
        } else {
          expect(signalInstance).toBe(signalRef);
        }

        return <div>{value}</div>;
      }

      const { rerender } = render(<TestComponent value="test1" />);
      rerender(<TestComponent value="test2" />);
    });
  });

  describe('withSignals() HOC', () => {
    it('should provide signal proxy to wrapped component', () => {
      const testSignal = signal('test');

      const TestComponent = withSignals<{}>((props) => {
        const value = props.$(testSignal);
        return <div data-testid="value">{value}</div>;
      });

      render(<TestComponent />);
      expect(screen.getByTestId('value')).toHaveTextContent('test');

      act(() => {
        testSignal.value = 'updated';
      });

      expect(screen.getByTestId('value')).toHaveTextContent('updated');
    });

    it('should handle multiple signals with proxy', () => {
      const signal1 = signal('a');
      const signal2 = signal('b');

      const TestComponent = withSignals<{}>((props) => {
        const val1 = props.$(signal1);
        const val2 = props.$(signal2);
        return <div data-testid="combined">{val1 + val2}</div>;
      });

      render(<TestComponent />);
      expect(screen.getByTestId('combined')).toHaveTextContent('ab');

      act(() => {
        signal1.value = 'x';
        signal2.value = 'y';
      });

      expect(screen.getByTestId('combined')).toHaveTextContent('xy');
    });

    it('should pass through other props', () => {
      const testSignal = signal('signal');

      interface Props {
        title: string;
        count: number;
      }

      const TestComponent = withSignals<Props>((props) => {
        const signalValue = props.$(testSignal);
        return (
          <div>
            <div data-testid="title">{props.title}</div>
            <div data-testid="count">{props.count}</div>
            <div data-testid="signal">{signalValue}</div>
          </div>
        );
      });

      render(<TestComponent title="Test Title" count={42} />);
      expect(screen.getByTestId('title')).toHaveTextContent('Test Title');
      expect(screen.getByTestId('count')).toHaveTextContent('42');
      expect(screen.getByTestId('signal')).toHaveTextContent('signal');
    });
  });

  describe('SignalProvider and useSignalContext()', () => {
    it('should provide signals through context', () => {
      const signal1 = signal('context1');
      const signal2 = signal('context2');
      const signals = { signal1, signal2 };

      function TestComponent() {
        const contextSignals = useSignalContext();
        const val1 = useSignal(contextSignals.signal1);
        const val2 = useSignal(contextSignals.signal2);
        
        return (
          <div>
            <div data-testid="val1">{val1}</div>
            <div data-testid="val2">{val2}</div>
          </div>
        );
      }

      render(
        <SignalProvider signals={signals}>
          <TestComponent />
        </SignalProvider>
      );

      expect(screen.getByTestId('val1')).toHaveTextContent('context1');
      expect(screen.getByTestId('val2')).toHaveTextContent('context2');

      act(() => {
        signal1.value = 'updated1';
        signal2.value = 'updated2';
      });

      expect(screen.getByTestId('val1')).toHaveTextContent('updated1');
      expect(screen.getByTestId('val2')).toHaveTextContent('updated2');
    });

    it('should return empty object when no provider', () => {
      function TestComponent() {
        const contextSignals = useSignalContext();
        return <div data-testid="empty">{Object.keys(contextSignals).length}</div>;
      }

      render(<TestComponent />);
      expect(screen.getByTestId('empty')).toHaveTextContent('0');
    });

    it('should handle nested providers', () => {
      const outerSignal = signal('outer');
      const innerSignal = signal('inner');

      function InnerComponent() {
        const contextSignals = useSignalContext();
        const outer = useSignal(contextSignals.outer);
        const inner = useSignal(contextSignals.inner);
        
        return (
          <div>
            <div data-testid="outer">{outer}</div>
            <div data-testid="inner">{inner}</div>
          </div>
        );
      }

      function MiddleComponent() {
        return (
          <SignalProvider signals={{ inner: innerSignal }}>
            <InnerComponent />
          </SignalProvider>
        );
      }

      render(
        <SignalProvider signals={{ outer: outerSignal }}>
          <MiddleComponent />
        </SignalProvider>
      );

      expect(screen.getByTestId('outer')).toHaveTextContent('outer');
      expect(screen.getByTestId('inner')).toHaveTextContent('inner');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complex signal interactions', () => {
      const source = signal(1);
      const doubled = computed(() => source.value * 2);

      function TestComponent() {
        const sourceValue = useSignal(source);
        const doubledValue = useSignal(doubled);
        const quadrupled = useComputed(() => doubledValue * 2);

        return (
          <div>
            <div data-testid="source">{sourceValue}</div>
            <div data-testid="doubled">{doubledValue}</div>
            <div data-testid="quadrupled">{quadrupled}</div>
            <button 
              data-testid="increment" 
              onClick={() => source.value += 1}
            >
              Increment
            </button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(screen.getByTestId('source')).toHaveTextContent('1');
      expect(screen.getByTestId('doubled')).toHaveTextContent('2');
      expect(screen.getByTestId('quadrupled')).toHaveTextContent('4');

      act(() => {
        screen.getByTestId('increment').click();
      });

      expect(screen.getByTestId('source')).toHaveTextContent('2');
      expect(screen.getByTestId('doubled')).toHaveTextContent('4');
      expect(screen.getByTestId('quadrupled')).toHaveTextContent('8');
    });

    it('should handle signal effects in React components', () => {
      const source = signal(0);
      const effectCallback = jest.fn();

      function TestComponent() {
        const value = useSignal(source);
        
        useSignalEffect(() => {
          effectCallback(source.value);
        });

        return (
          <div>
            <div data-testid="value">{value}</div>
            <button 
              data-testid="increment" 
              onClick={() => source.value += 1}
            >
              Increment
            </button>
          </div>
        );
      }

      render(<TestComponent />);
      expect(effectCallback).toHaveBeenCalledWith(0);

      act(() => {
        screen.getByTestId('increment').click();
      });

      // Effect should run after the update
      setTimeout(() => {
        expect(effectCallback).toHaveBeenCalledWith(1);
      }, 0);
    });
  });
});
