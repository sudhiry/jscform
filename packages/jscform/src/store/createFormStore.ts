import {JSONSchema} from "../utils/types";
import {Ajv, AsyncSchema} from "ajv";
import {cloneDeep, set} from "lodash";
import retrieveSchema from "../utils/retrieveSchema";
import {parseAjvErrors} from "../utils/errorResolver/parseAjvErrors";
import {FormState, FormStoreApi, FormStoreInput, StoreListener} from "./types";
import getDefaultFormState from "../utils/getDefaultFormState";
import {signal} from "../signals/signals";

let cachedState: { data: any, schema: JSONSchema, context?: any, validator?: Ajv } | null = null;

export const createFormStore = ({
        schema,
        context,
        data,
        validator
    }: FormStoreInput): FormStoreApi => {

    const state = signal<FormState>({schema, data, context, validator});

    const rootSchema = cloneDeep(schema);

    const subscribe = (listener: StoreListener) => {
        return state.subscribe((newState: FormState) => {
            listener(newState);
        });
    };

    const getInitialState = () => {
        if (cachedState !== state.value) {
            cachedState = state.value
        }
        return cachedState;
    };

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
        const {data: currentData, context: currentContext} = state.value;
        const newData = set(cloneDeep(currentData), key, value);
        try {
            const [result, newSchema] = await Promise.all([
                validate(rootSchema, newData),
                retrieveSchema(validator, rootSchema, rootSchema, newData, false)
            ]);
            const newState = {
                schema: newSchema,
                data: newData,
                validator: validator,
                context: currentContext,
                fieldState: result.errors && Object.keys(result.errors).reduce((acc, key) => ({
                    ...acc,
                    [key]: {error: result.errors[key]}
                }), {}),
            } as FormState;
            state.value = newState;
        } catch (error) {
            console.error("Form state update error:", error);
            // Fallback to previous state on error - no change needed since we don't update on error
        }
    };

    (async () => {
        const defaultValue = await getDefaultFormState(validator, rootSchema, data, rootSchema);
        setState("", defaultValue);
    })().catch((e) => {
        console.error("Form default state update error", e);
    });

    return {
        subscribe,
        getState,
        getInitialState,
        setState,
        context,
        validator,
    };
};
