import {useContext} from "react";
import {FormContext} from "../contexts/FormContext";
import {useSignal, useComputed} from "../signals/react-signals";
import {FormState} from "../store/types";

/**
 * Hook to access the complete form state using signals
 */
export function useFormState(): FormState {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useFormState must be used within a FormProvider");
    }

    return useSignal(formStore.state);
}

/**
 * Hook to access only form data using signals
 */
export function useFormData(): any {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useFormData must be used within a FormProvider");
    }

    const state = useSignal(formStore.state);
    return useComputed(() => state.data, [state.data]);
}

/**
 * Hook to access form validation state using signals
 */
export function useFormValidation(): {
    isValid: boolean;
    errors: Record<string, any>;
    hasErrors: boolean;
} {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useFormValidation must be used within a FormProvider");
    }

    const state = useSignal(formStore.state);
    
    return useComputed(() => {
        const fieldState = state.fieldState || {};
        const errors = Object.keys(fieldState).reduce((acc, key) => {
            if (fieldState[key]?.error) {
                acc[key] = fieldState[key].error;
            }
            return acc;
        }, {} as Record<string, any>);
        
        const hasErrors = Object.keys(errors).length > 0;
        
        return {
            isValid: !hasErrors,
            errors,
            hasErrors
        };
    }, [state.fieldState]);
}

/**
 * Hook to get form actions using signals
 */
export function useFormActions() {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useFormActions must be used within a FormProvider");
    }

    return {
        setState: formStore.setState,
        getState: formStore.getState,
        context: formStore.context,
        validator: formStore.validator,
    };
}
