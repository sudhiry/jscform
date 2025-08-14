import React, {createContext, useRef} from "react";
import {JSONSchema} from "../utils/types";
import {createSignalsFormStore} from "../store/createSignalsFormStore";
import {Ajv} from "ajv";
import { FormStoreApi } from "../store/types";

export const SignalsFormContext = createContext<FormStoreApi | undefined>(undefined);

export interface SignalsFormProviderProps {
    schema: JSONSchema;
    data: any;
    context?: any;
    validator: Ajv;
    children: React.ReactNode;
}

export function SignalsFormProvider({schema, data, context, validator, children}: SignalsFormProviderProps) {
    const formStoreApi = useRef(createSignalsFormStore({schema, data, context, validator})).current;
    return <SignalsFormContext.Provider value={formStoreApi}>{children}</SignalsFormContext.Provider>
}
