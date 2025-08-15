import {JSONSchema} from "../utils/types";
import {AsyncSchema} from "ajv";
import {cloneDeep, set} from "lodash";
import retrieveSchema from "../utils/retrieveSchema";
import {parseAjvErrors} from "../utils/errorResolver/parseAjvErrors";
import {FormState, FormStoreApi, FormStoreInput, StoreListener} from "./types";
import getDefaultFormState from "../utils/getDefaultFormState";
import {signal, computed, batch} from "../signals/signals";

export const createFormStore = ({
        schema,
        context,
        data,
        validator
    }: FormStoreInput): FormStoreApi => {

    // Core state signals
    const dataSignal = signal(data);
    const schemaSignal = signal(schema);
    const contextSignal = signal(context);
    const validatorSignal = signal(validator);
    const fieldStateSignal = signal<Record<string, any>>({});

    const rootSchema = cloneDeep(schema);

    // Computed signal for the complete form state
    const state = computed<FormState>(() => ({
        schema: schemaSignal.value,
        data: dataSignal.value,
        context: contextSignal.value,
        validator: validatorSignal.value,
        fieldState: fieldStateSignal.value,
    }));

    const subscribe = (listener: StoreListener) => {
        return state.subscribe((newState: FormState) => {
            listener(newState);
        });
    };

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
                retrieveSchema(validator, rootSchema, rootSchema, newData, false)
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

    // Initialize with default values
    (async () => {
        try {
            const defaultValue = await getDefaultFormState(validator, rootSchema, data, rootSchema);
            setState("", defaultValue);
        } catch (e) {
            console.error("Form default state update error", e);
        }
    })();

    return {
        state,
        subscribe,
        getState,
        getInitialState,
        setState,
        context,
        validator,
    };
};
