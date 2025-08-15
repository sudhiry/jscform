import React, {createContext, useRef} from "react";
import {JSONSchema} from "../utils/types";
import {createFormStore} from "../store/createFormStore";
import {Ajv} from "ajv";
import { FormStoreApi } from "../store/types";

export const FormContext = createContext<FormStoreApi | undefined>(undefined);

export interface SignalsFormProviderProps {
    schema: JSONSchema;
    data: any;
    context?: any;
    validator: Ajv;
    children: React.ReactNode;
}

export function FormProvider({schema, data, context, validator, children}: SignalsFormProviderProps) {
    const formStoreApi = useRef(createFormStore({schema, data, context, validator})).current;
    return <FormContext.Provider value={formStoreApi}>{children}</FormContext.Provider>
}
