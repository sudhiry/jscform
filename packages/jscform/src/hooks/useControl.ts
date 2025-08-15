import {useContext, useMemo} from "react";
import get from "lodash/get";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FieldState} from "../store/types";
import {useComputed} from "@preact/signals-react";

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

    const { state, setState, context, validator } = formStore;

    // Use computed values for derived state to optimize re-renders
    const schema = useComputed(() =>
        getSchemaFromPath(state.value.schema, schemaKey, ".")
    );

    const value = useComputed(() =>
        get(state.value.data, schemaKey.split("."))
    );

    const fieldState = useComputed(() =>
        get(state.value.fieldState, schemaKey)
    );

    // Memoize onChange handler to prevent unnecessary re-renders
    const onChange = useMemo(() =>
        (val: any) => setState(schemaKey, val),
        [setState, schemaKey]
    );

    return {
        schema: schema.value,
        value: value.value,
        context,
        validator,
        onChange,
        fieldState: fieldState.value,
    };
}
