import {useContext} from "react";
import {useComputed} from "@preact/signals-react";
import {FormContext} from "../contexts/FormContext";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FormStoreApi} from "../store/types";

export const useSchema = (schemaKey: string) => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw new Error("useSchema must be used within a FormProvider");
    }
    const { state } = formStore as FormStoreApi;

    return useComputed(() => getSchemaFromPath(state.value.schema, schemaKey, "."));
};
