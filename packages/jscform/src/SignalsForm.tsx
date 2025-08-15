import React from "react";
import {JSONSchema} from "./utils/types";
import {FormProvider} from "./contexts/FormContext";
import {DynamicUIComponent} from "./components/DynamicUIComponent";
import {Ajv} from "ajv";

export interface SignalsFormProps {
    schema: JSONSchema;
    data?: any;
    context?: any;
    validator: Ajv;
    onSubmit?: (data: any) => void;
    children?: React.ReactNode;
}

export function SignalsForm({
    schema,
    data = {},
    context,
    validator,
    onSubmit,
    children
}: SignalsFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(data);
        }
    };

    return (
        <FormProvider
            schema={schema}
            data={data}
            context={context}
            validator={validator}
        >
            <form onSubmit={handleSubmit}>
                {children || <DynamicUIComponent schemaKey="" />}
            </form>
        </FormProvider>
    );
}
