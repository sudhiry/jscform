import {useContext} from "react";
import {useComputed} from "@preact/signals-react";
import {FormContext} from "../contexts/FormContext";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";

export const useSchema = (schemaKey: string) => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useSchema must be used within a FormProvider");
    }
    const {state} = formStore;

    return useComputed(() => {
        return getSchemaFromPath(state.value.schema, schemaKey, ".")
    });
}
