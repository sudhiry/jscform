import {useContext} from "react";
import {useComputed} from "@preact/signals-react";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";

export const useSchema = (schemaKey: string): JSONSchema | null => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useSchema must be used within a FormProvider");
    }
    const { state } = formStore;

    // Use computed value for derived schema to optimize re-renders
    const schema = useComputed(() =>
        getSchemaFromPath(state.value.schema, schemaKey, ".")
    );
    return schema.value;
}
