import {useContext} from "react";
import { useComputed } from "@preact/signals-react";
import {FormContext} from "../contexts/FormContext";
import {FormState} from "../store/types";

/**
 * Hook to access the complete form state using signals
 */
export function useFormState(): FormState {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useFormState must be used within a FormProvider");
    }

    return formStore.state.value;
}

/**
 * Hook to access only form data using signals
 */
export function useFormData(): any {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useFormData must be used within a FormProvider");
    }

    const { state } = formStore;
    const data = useComputed(() => state.value.data);
    return data.value;
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

    const { state } = formStore;

    const validation = useComputed(() => {
        const fieldState = state.value.fieldState || {};
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
    });
    return validation.value;
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
