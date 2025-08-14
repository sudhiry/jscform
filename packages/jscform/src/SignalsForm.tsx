import React from "react";
import {JSONSchema} from "./utils/types";
import {SignalsFormProvider} from "./contexts/SignalsFormContext";
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
        <SignalsFormProvider
            schema={schema}
            data={data}
            context={context}
            validator={validator}
        >
            <form onSubmit={handleSubmit}>
                {children || <DynamicUIComponent schemaKey="" />}
            </form>
        </SignalsFormProvider>
    );
}
