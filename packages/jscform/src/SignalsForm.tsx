import React from "react";
import {JSONSchema} from "./utils/types";
import {FormProvider} from "./contexts/FormContext";
import type {Ajv} from "ajv";
import {DynamicUIComponent} from "./components/DynamicUIComponent";
import {ajv} from "./defaultAjv";
import {useSignalEffect} from "./signals/react-signals";

export interface SignalsFormProps {
    schema: JSONSchema;
    data: Record<string, any>;
    context?: Record<string, any>;
    onSubmit?: (data: Record<string, any>) => void;
    onChange?: (data: Record<string, any>) => void;
    onValidationChange?: (isValid: boolean, errors?: any) => void;
    validator?: Ajv;
}

/**
 * Enhanced Form component that leverages signals features for optimal performance
 */
export function SignalsForm({
    schema, 
    data, 
    context, 
    validator = ajv, 
    onSubmit,
    onChange,
    onValidationChange
}: SignalsFormProps) {
    return (
        <FormProvider data={data} schema={schema} context={context} validator={validator}>
            <SignalsFormContent 
                onSubmit={onSubmit}
                onChange={onChange}
                onValidationChange={onValidationChange}
            />
        </FormProvider>
    );
}

interface SignalsFormContentProps {
    onSubmit?: (data: Record<string, any>) => void;
    onChange?: (data: Record<string, any>) => void;
    onValidationChange?: (isValid: boolean, errors?: any) => void;
}

function SignalsFormContent({ onChange, onValidationChange }: SignalsFormContentProps) {
    // Use signal effects to react to form state changes
    useSignalEffect(() => {
        // This effect will run whenever form data changes
        if (onChange) {
            // Access form store and call onChange with current data
            // This would need access to the form store context
        }
    }, [onChange]);

    useSignalEffect(() => {
        // This effect will run whenever validation state changes
        if (onValidationChange) {
            // Access form store and call onValidationChange with validation state
            // This would need access to the form store context
        }
    }, [onValidationChange]);

    return <DynamicUIComponent />;
}

SignalsForm.displayName = 'SignalsForm';
