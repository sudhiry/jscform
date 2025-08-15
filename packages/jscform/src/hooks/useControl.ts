import {useContext, useMemo} from "react";
import get from "lodash/get";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FieldState} from "../store/types";
import {useSignal, useComputed} from "../signals/react-signals";

export interface UseControlApi {
    schema: JSONSchema | null;
    value: any;
    context: any;
    validator: any;
    onChange: (val: any) => void;
    fieldState?: FieldState;
}

export const useControl = (schemaKey: string): UseControlApi => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useControl must be used within a FormProvider");
    }

    // Use signals to automatically subscribe to store changes
    const store = useSignal(formStore.state);

    // Use computed values for derived state to optimize re-renders
    const schema = useComputed(() => 
        getSchemaFromPath(store.schema, schemaKey, "."), 
        [store.schema, schemaKey]
    );

    const value = useComputed(() => 
        get(store.data, schemaKey.split(".")), 
        [store.data, schemaKey]
    );

    const fieldState = useComputed(() => 
        get(store.fieldState, schemaKey), 
        [store.fieldState, schemaKey]
    );

    // Memoize onChange handler to prevent unnecessary re-renders
    const onChange = useMemo(() => 
        (val: any) => formStore.setState(schemaKey, val), 
        [formStore, schemaKey]
    );

    return {
        schema,
        value,
        context: formStore.context,
        validator: formStore.validator,
        onChange,
        fieldState,
    };
}
