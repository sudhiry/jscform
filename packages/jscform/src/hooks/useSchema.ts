import {useContext} from "react";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {useSignal, useComputed} from "@repo/signals";

export const useSchema = (schemaKey: string): JSONSchema | null => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useSchema must be used within a FormProvider");
    }

    // Use signals to automatically subscribe to store changes
    const store = useSignal(formStore.state);

    // Use computed value for derived schema to optimize re-renders
    return useComputed(() => 
        getSchemaFromPath(store.schema, schemaKey, "."), 
        [store.schema, schemaKey]
    );
}
