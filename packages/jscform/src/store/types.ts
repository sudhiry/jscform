import {JSONSchema} from "../utils/types";
import {Ajv} from "ajv";

export interface FormStoreInput {
    schema: JSONSchema;
    data: any;
    validator: Ajv;
    context?: any;
}

export interface FieldError {
    message: string;
    type: string;
}

export interface FieldState {
    error?: FieldError;
}

export interface FormState {
    schema: JSONSchema;
    data: any;
    validator?: Ajv;
    context?: any;
    fieldState?: Map<string, FieldState>;
}

export type StoreListener = (state: any) => void

export interface FormStoreApi {
    subscribe: (listener: StoreListener) => () => void;
    getState: () => { schema: JSONSchema; data: any, fieldState?: Map<string, FieldState> };
    getInitialState: () => { schema: JSONSchema; data: any, fieldState?: Map<string, FieldState> };
    setState: (key: string, value: any) => void;
    context?: any;
    validator?: Ajv;
}