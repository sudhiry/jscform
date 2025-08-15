import React, {createContext, useRef, useEffect} from "react";
import {JSONSchema} from "../utils/types";
import {createFormStore} from "../store/createFormStore";
import {Ajv} from "ajv";
import { FormStoreApi } from "../store/types";
import {effect} from "../signals/signals";

export const FormContext = createContext<FormStoreApi | undefined>(undefined);

export interface FormProviderProps {
    schema: JSONSchema;
    data: any;
    context?: any;
    validator: Ajv;
    children: React.ReactNode;
    onStateChange?: (state: any) => void;
    enableDevTools?: boolean;
}

export function FormProvider({
    schema, 
    data, 
    context, 
    validator, 
    children,
    onStateChange,
    enableDevTools = false
}: FormProviderProps) {
    const formStoreApi = useRef(createFormStore({schema, data, context, validator})).current;
    
    useEffect(() => {
        const effects: any[] = [];
        
        // Optional state change callback effect
        if (onStateChange) {
            const stateChangeEffect = effect(() => {
                const currentState = formStoreApi.state.value;
                onStateChange(currentState);
            });
            effects.push(stateChangeEffect);
        }
        
        // Optional dev tools integration
        if (enableDevTools && typeof window !== 'undefined') {
            const devToolsEffect = effect(() => {
                const currentState = formStoreApi.state.value;
                // Log state changes for debugging
                console.group('🔄 JSCForm State Change');
                console.log('Schema:', currentState.schema);
                console.log('Data:', currentState.data);
                console.log('Field State:', currentState.fieldState);
                console.groupEnd();
            });
            effects.push(devToolsEffect);
        }
        
        // Cleanup effects on unmount
        return () => {
            effects.forEach(effect => effect?.dispose?.());
        };
    }, [formStoreApi, onStateChange, enableDevTools]);
    
    return <FormContext.Provider value={formStoreApi}>{children}</FormContext.Provider>;
}

// Legacy alias for backward compatibility
export const SignalsFormProvider = FormProvider;
