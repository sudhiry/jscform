import React from 'react';
import '@testing-library/jest-dom';
import {render, screen, act} from '@testing-library/react';
import {signal} from '../signals';
import {
    useSignal,
    useSignalState,
    useComputed,
    useAsyncComputed,
    useSignalEffect,
    useSignalFromProp,
    SignalProvider,
    useSignalContext,
} from '../react-signals';

// A robust helper to flush all pending promises and timers
const flushPromises = () => new Promise(jest.requireActual('timers').setImmediate);

describe('React Signals Integration', () => {
    // Use modern fake timers for better async control
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('useSignal()', () => {
        it('should subscribe to a signal and trigger re-renders', () => {
            const testSignal = signal('initial');

            function TestComponent() {
                const value = useSignal(testSignal);
                return <div data-testid="value">{value}</div>;
            }

            render(<TestComponent/>);
            expect(screen.getByTestId('value')).toHaveTextContent('initial');

            act(() => {
                testSignal.value = 'updated';
            });

            expect(screen.getByTestId('value')).toHaveTextContent('updated');
        });

        it('should unsubscribe on component unmount', () => {
            const testSignal = signal('test');
            // The use of useSyncExternalStore handles this automatically.
            // A simple way to verify is to ensure no warnings are thrown.
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
            });

            function TestComponent() {
                useSignal(testSignal);
                return null;
            }

            const {unmount} = render(<TestComponent/>);
            unmount();

            act(() => {
                testSignal.value = 'updated';
            });

            expect(consoleErrorSpy).not.toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe('useSignalState()', () => {
        it('should create and manage signal state', () => {
            function TestComponent() {
                const [value, setValue] = useSignalState('initial');
                return (
                    <div>
                        <div data-testid="value">{value}</div>
                        <button onClick={() => setValue('updated')}>Update</button>
                    </div>
                );
            }

            render(<TestComponent/>);
            expect(screen.getByTestId('value')).toHaveTextContent('initial');

            act(() => {
                screen.getByText('Update').click();
            });

            expect(screen.getByTestId('value')).toHaveTextContent('updated');
        });
    });

    describe('useComputed()', () => {
        it('should create a computed signal and update on dependency changes', () => {
            const source = signal(2);

            function TestComponent() {
                const doubled = useComputed(() => source.value * 2, []);
                console.log(">>>> ", doubled);
                return <div data-testid="computed">{doubled}</div>;
            }

            render(<TestComponent/>);
            expect(screen.getByTestId('computed')).toHaveTextContent('4');

            act(() => {
                source.value = 5;
            });

            expect(screen.getByTestId('computed')).toHaveTextContent('10');
        });
    });

    describe('useAsyncComputed()', () => {
        it('should handle loading, data, and error states correctly', async () => {
            function TestComponent() {
                const {data, loading, error} = useAsyncComputed<string>(
                    () => new Promise(resolve => setTimeout(() => resolve('async result'), 100)),
                    []
                );

                if (loading) return <div>Loading...</div>;
                if (error) return <div>Error: {error.message}</div>;
                return <div data-testid="data">{data}</div>;
            }

            render(<TestComponent/>);
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await act(async () => {
                await jest.advanceTimersByTimeAsync(100);
            });

            expect(screen.getByTestId('data')).toHaveTextContent('async result');
        });

        it('should recreate the async computed when dependencies change', async () => {
            function TestComponent({id}: { id: number }) {
                const {data, loading} = useAsyncComputed<string>(
                    () => new Promise(resolve => setTimeout(() => resolve(`Result: ${id}`), 50)),
                    [id] // The dependency that causes the hook to re-run
                );

                if (loading) return <div>Loading...</div>;
                return <div data-testid="data">{data}</div>;
            }

            const {rerender} = render(<TestComponent id={1}/>);
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await act(async () => {
                await jest.advanceTimersByTimeAsync(50);
            });
            expect(screen.getByTestId('data')).toHaveTextContent('Result: 1');

            rerender(<TestComponent id={2}/>);
            expect(screen.getByText('Loading...')).toBeInTheDocument();

            await act(async () => {
                await jest.advanceTimersByTimeAsync(50);
            });
            expect(screen.getByTestId('data')).toHaveTextContent('Result: 2');
        });
    });

    describe('useSignalEffect()', () => {
        it('should run an effect and re-run when signal dependencies change', async () => {
            const source = signal(1);
            const effectFn = jest.fn();

            function TestComponent() {
                useSignalEffect(() => {
                    effectFn(source.value);
                },[]);
                return null;
            }

            render(<TestComponent/>);
            // The effect runs once on mount
            expect(effectFn).toHaveBeenCalledWith(1);
            expect(effectFn).toHaveBeenCalledTimes(1);

            act(() => {
                source.value = 2;
            });

            // The effect is queued as a microtask
            await flushPromises();
            expect(effectFn).toHaveBeenCalledWith(2);
            expect(effectFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('useSignalFromProp()', () => {
        it('should create a signal from a prop and update when the prop changes', () => {
            function TestComponent({value}: { value: string }) {
                const signalInstance = useSignalFromProp(value);
                const signalValue = useSignal(signalInstance);
                return <div data-testid="signal">{signalValue}</div>;
            }

            const {rerender} = render(<TestComponent value="initial"/>);
            expect(screen.getByTestId('signal')).toHaveTextContent('initial');

            rerender(<TestComponent value="updated"/>);
            expect(screen.getByTestId('signal')).toHaveTextContent('updated');
        });
    });

    describe('SignalProvider and useSignalContext()', () => {
        it('should provide signals through context', () => {
            const signal1 = signal('context1');
            const signals = {signal1};

            function TestComponent() {
                const contextSignals = useSignalContext();
                const val1 = useSignal(contextSignals.signal1);
                return <div data-testid="val1">{val1}</div>;
            }

            render(
                <SignalProvider signals={signals}>
                    <TestComponent/>
                </SignalProvider>
            );

            expect(screen.getByTestId('val1')).toHaveTextContent('context1');

            act(() => {
                signal1.value = 'updated1';
            });

            expect(screen.getByTestId('val1')).toHaveTextContent('updated1');
        });
    });
});
