import {useContext, useState, useEffect} from "react";
import get from "lodash/get";
import {SignalsFormContext} from "../contexts/SignalsFormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FieldState, FormState} from "../store/types";

export interface UseControlApi {
    schema: JSONSchema | null;
    value: any;
    context: any;
    validator: any;
    onChange: (val: any) => void;
    fieldState?: FieldState;
}

export const useSignalsControl = (schemaKey: string): UseControlApi => {
    const formStore = useContext(SignalsFormContext);
    if (!formStore) {
        throw Error("useSignalsControl must be used within a SignalsFormProvider");
    }
    
    // Use React state to trigger re-renders when the store changes
    const [store, setStore] = useState<FormState>(formStore.getState());
    
    useEffect(() => {
        const unsubscribe = formStore.subscribe((newState: FormState) => {
            setStore(newState);
        });
        return unsubscribe;
    }, [formStore]);
    
    return {
        schema: getSchemaFromPath(store.schema, schemaKey, "."),
        value: get(store.data, schemaKey.split(".")),
        context: formStore.context,
        validator: formStore.validator,
        onChange: (val: any) => {formStore.setState(schemaKey, val)},
        fieldState: get(store.fieldState, schemaKey),
    };
}
