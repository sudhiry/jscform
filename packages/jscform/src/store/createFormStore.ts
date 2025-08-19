import {signal, computed, batch} from "@preact/signals-react";
import {JSONSchema} from "../utils/types";
import {AsyncSchema} from "ajv";
import {cloneDeep, set} from "lodash";
import {parseAjvErrors} from "../utils/errorResolver/parseAjvErrors";
import {FormState, FormStoreApi, FormStoreInput} from "./types";
import retrieveSchema from "../utils/retrieveSchema";

export const createFormStore = ({
        schema,
        context,
        data,
        validator
    }: FormStoreInput): FormStoreApi => {

    const rootSchema = cloneDeep(schema);
    const dataSignal = signal(cloneDeep(data));
    const schemaSignal = signal(cloneDeep(schema));
    const contextSignal = signal(context);
    const fieldStateSignal = signal<Record<string, any>>({});

    // // Computed signal for the complete form state
    const state = computed<FormState>(() => ({
        schema: schemaSignal.value,
        data: dataSignal.value,
        context: contextSignal.value,
        fieldState: fieldStateSignal.value,
    }));

    const validate = async (schema: JSONSchema, data: any): Promise<{ isValid: boolean; errors: any }> => {
        let isValid = true;
        let errors: any;
        try {
            const validateSchema = validator!.compile(schema as unknown as AsyncSchema);
            isValid = !!await validateSchema(data);
            if (!isValid) {
                errors = parseAjvErrors(validateSchema.errors, schema);
            }
        } catch (e: unknown) {
            isValid = false;
            errors = parseAjvErrors((e as any).errors, schema);
        }
        return {isValid, errors};
    }

    const setState = async (key: string, value: any) => {
        const currentData = dataSignal.value;
        const newData = set(cloneDeep(currentData), key, value);

        const [result, newSchema] = await Promise.all([
            validate(rootSchema, newData),
            retrieveSchema(validator, rootSchema, rootSchema, newData)
        ]);

        // Use batch to update multiple signals atomically
        batch(() => {
            dataSignal.value = newData;
            schemaSignal.value = newSchema;
            if (result.errors) {
                fieldStateSignal.value = Object.keys(result.errors).reduce((acc, key) => ({
                    ...acc,
                    [key]: {error: result.errors[key]}
                }), {});
            } else {
                fieldStateSignal.value = {};
            }
        });
    };

    return {
        state,
        setState,
        context,
        validator,
    };
};
