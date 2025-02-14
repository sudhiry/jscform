import {JSONSchema} from "../utils/types";
import {Ajv, AsyncSchema} from "ajv";
import {BehaviorSubject} from "rxjs";
import {cloneDeep, set} from "lodash";
import retrieveSchema from "../utils/retrieveSchema";
import {parseAjvErrors} from "../utils/errorResolver/parseAjvErrors";
import {FormState, FormStoreApi, FormStoreInput, StoreListener} from "./types";

let cachedState: { data: any, schema: JSONSchema, context?: any, validator?: Ajv } | null = null;

export const createFormStore = ({
        schema,
        context,
        data,
        validator
    }: FormStoreInput): FormStoreApi => {

    const state = new BehaviorSubject<FormState>({schema, data, context, validator});

    const rootSchema = cloneDeep(schema);

    const subscribe = (listener: StoreListener) => {
        const subscription = state.subscribe(listener);
        return () => subscription.unsubscribe();
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
            const validate = validator!.compile(schema as unknown as AsyncSchema);
            isValid = !!await validate(data);
            if (!isValid) {
                console.log("validate.errors >>>> ", validate.errors);
                // errors = toNestErrors(parseAjvErrors(validate.errors));
                errors = parseAjvErrors(validate.errors);
            }
        } catch (e: unknown) {
            isValid = false;
            console.log("validate.errors >>>> ", (e as any).errors);
            // errors = toNestErrors(parseAjvErrors((e as any).errors))
            errors = parseAjvErrors((e as any).errors);
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
            ]) ;  
            const newState = {
                schema: newSchema,
                data: newData,
                validator: validator,
                context: currentContext,
                fieldState: result.errors && Object.keys(result.errors).reduce((acc, key) => ({...acc,[key]: { error: result.errors[key]}}), {}),
            } as FormState;
            state.next(newState);
        } catch (error) {
            console.error("Form state update error:", error);
            // Fallback to previous state on error
            state.next(state.value);
        }
    };

    return {
        subscribe,
        getState,
        getInitialState,
        setState,
        context,
        validator,
    };
};
