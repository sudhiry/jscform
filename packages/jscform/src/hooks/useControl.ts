import {useContext, useMemo, useState} from "react";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FieldState} from "../store/types";
import {useSignalEffect} from "@preact/signals-react";

export interface UseControlApi {
    schema: JSONSchema | null | undefined;
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

    const { state, setState, context, validator } = formStore;

    const [value, setValue] = useState(get(state.value.data, schemaKey.split(".")));
    const [schema, setSchema] = useState(getSchemaFromPath(state.value.schema, schemaKey, "."));
    const [fieldState, setFieldState] = useState(get(state.value.fieldState, schemaKey));

    useSignalEffect(() => {
        const newValue = get(state.value.data, schemaKey.split("."));
        if (!isEqual(newValue, value)) {
            setValue(newValue);
        }
    });

    useSignalEffect(() => {
        const newSchema = getSchemaFromPath(state.value.schema, schemaKey, ".");
        if (!isEqual(newSchema, schema)) {
            setSchema(newSchema);
        }
    });

    useSignalEffect(() => {
        const newFieldState = get(state.value.fieldState, schemaKey);
        if (!isEqual(newFieldState, fieldState)) {
            setFieldState(newFieldState);
        }
    });

    // Memoize onChange handler to prevent unnecessary re-renders
    const onChange = useMemo(() => (val: any) => setState(schemaKey, val), [setState, schemaKey]);

    return {
        schema,
        value,
        context,
        validator,
        onChange,
        fieldState,
    };
}
