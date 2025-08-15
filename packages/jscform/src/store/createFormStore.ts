import { signal, computed, batch } from "@preact/signals-react";
import {JSONSchema} from "../utils/types";
import {AsyncSchema} from "ajv";
import {cloneDeep, set} from "lodash";
import {retrieveSchemaRecursive} from "../utils/retrieveSchemaRecursive";
import {parseAjvErrors} from "../utils/errorResolver/parseAjvErrors";
import {FormState, FormStoreApi, FormStoreInput} from "./types";
import getDefaultFormState from "../utils/getDefaultFormState";

export const createFormStore = ({
        schema,
        context,
        data,
        validator
    }: FormStoreInput): FormStoreApi => {

    const rootSchema = cloneDeep(schema);

    // Initialize data with defaults computed synchronously if possible
    let initialData = data;
    let initialSchema = schema;
    let initialFieldState: Record<string, any> = {};

    // Core state signals - will be initialized after computing defaults
    const dataSignal = signal(initialData);
    const schemaSignal = signal(initialSchema);
    const contextSignal = signal(context);
    const validatorSignal = signal(validator);
    const fieldStateSignal = signal<Record<string, any>>(initialFieldState);

    // Computed signal for the complete form state
    const state = computed<FormState>(() => ({
        schema: schemaSignal.value,
        data: dataSignal.value,
        context: contextSignal.value,
        validator: validatorSignal.value,
        fieldState: fieldStateSignal.value,
    }));

    const getInitialState = () => state.value;
    const getState = () => state.value;

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

        try {
            const [result, newSchema] = await Promise.all([
                validate(rootSchema, newData),
                retrieveSchemaRecursive(validator, rootSchema, rootSchema, newData)
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
        } catch (error) {
            console.error("Form state update error:", error);
            // Fallback to previous state on error - no change needed since we don't update on error
        }
    };

    // Initialize with default values asynchronously but update signals immediately when ready
    const initializeDefaults = async () => {
        try {
            // Step 1: Compute basic defaults from the original schema
            let currentData = await getDefaultFormState(validator, rootSchema, data, rootSchema);

            // Step 2: Resolve schema recursively with the computed defaults to handle all nested conditional logic
            let resolvedSchema = await retrieveSchemaRecursive(validator, rootSchema, rootSchema, currentData);

            // Step 3: Re-compute defaults on the resolved schema to get conditional defaults
            const finalData = await getDefaultFormState(validator, resolvedSchema, currentData, rootSchema);

            // Step 4: Final recursive schema resolution with the complete data to ensure all levels are resolved
            const finalSchema = await retrieveSchemaRecursive(validator, rootSchema, rootSchema, finalData);

            // Validate the final data
            const validationResult = await validate(rootSchema, finalData);

            // Update all signals with computed defaults
            batch(() => {
                dataSignal.value = finalData;
                schemaSignal.value = finalSchema;
                if (validationResult.errors) {
                    fieldStateSignal.value = Object.keys(validationResult.errors).reduce((acc, key) => ({
                        ...acc,
                        [key]: {error: validationResult.errors[key]}
                    }), {});
                } else {
                    fieldStateSignal.value = {};
                }
            });
        } catch (e) {
            console.error("Form default state initialization error", e);
        }
    };

    // Start initialization immediately
    initializeDefaults();

    return {
        state,
        getState,
        getInitialState,
        setState,
        context,
        validator,
    };
};
