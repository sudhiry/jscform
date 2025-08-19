import {useContext, useMemo} from "react";
import get from "lodash/get";
import {useComputed} from "@preact/signals-react";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FieldState, FormStoreApi} from "../store/types";
import {Signal} from "@preact/signals-react";

export interface UseControlApi {
    schema: Signal<JSONSchema | null | undefined>;
    value: Signal<any>;
    context: any;
    validator: any;
    onChange: (val: any) => void;
    fieldState?: Signal<FieldState | undefined>;
}

export const useControl = (schemaKey: string): UseControlApi => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw new Error("useControl must be used within a FormProvider");
    }

    const { state, setState, context, validator } = formStore as FormStoreApi;

    const value = useComputed(() => get(state.value.data, schemaKey.split(".")));
    const schema = useComputed(() => getSchemaFromPath(state.value.schema, schemaKey, "."));
    const fieldState = useComputed(() => get(state.value.fieldState, schemaKey));

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
};
