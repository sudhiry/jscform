import React from "react";
import {JSONSchema} from "./utils/types";
import {FormContext, FormProvider} from "./contexts/FormContext";
import type {Ajv} from "ajv";
import {DynamicUIComponent} from "./components/DynamicUIComponent";
import {ajv} from "./defaultAjv";
import {useSignalEffect} from "@preact/signals-react";

export interface FormProps {
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
export function Form({
                         schema,
                         data,
                         context,
                         validator = ajv,
                         onSubmit,
                         onChange,
                         onValidationChange
                     }: FormProps) {
    return (
        <FormProvider data={data} schema={schema} context={context} validator={validator}>
            <FormContent
                onSubmit={onSubmit}
                onChange={onChange}
                onValidationChange={onValidationChange}
            />
        </FormProvider>
    );
}

interface FormContentProps {
    onSubmit?: (data: Record<string, any>) => void;
    onChange?: (data: Record<string, any>) => void;
    onValidationChange?: (isValid: boolean, errors?: any) => void;
}

function FormContent({onChange, onValidationChange}: FormContentProps) {
    const formStore = React.useContext(FormContext);
    if (!formStore) {
        throw new Error("FormContent must be used within a FormProvider");
    }
    const {state} = formStore;


    // Use signal effects to react to form state changes
    useSignalEffect(() => {
        // This effect will run whenever form data changes
        if (onChange) {
            onChange(state.value.data);
        }
    });

    useSignalEffect(() => {
        // This effect will run whenever validation state changes
        if (onValidationChange) {
            const isValid = Object.keys(state.value.fieldState ?? {}).length === 0;
            onValidationChange(isValid, state.value.fieldState);
        }
    });

    return <DynamicUIComponent/>;
}

Form.displayName = 'Form';
