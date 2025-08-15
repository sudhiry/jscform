import {JSONSchema} from "../utils/types";
import {Ajv} from "ajv";
import { Signal } from "@preact/signals-react";

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
    fieldState?: Record<string, FieldState>;
}

export type StoreListener = (state: FormState) => void

export interface FormStoreApi {
    state: Signal<FormState>;
    getState: () => FormState;
    getInitialState: () => FormState;
    setState: (key: string, value: any) => void;
    context?: any;
    validator?: Ajv;
}
