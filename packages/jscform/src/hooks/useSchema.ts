import {useContext, useState, useEffect, useMemo} from "react";
import {FormContext} from "../contexts/FormContext";
import {JSONSchema} from "../utils/types";
import {getSchemaFromPath} from "../utils/getSchemaFromPath";
import {FormState} from "../store/types";

export const useSchema = (schemaKey: string): JSONSchema | null => {
    const formStore = useContext(FormContext);
    if (!formStore) {
        throw Error("useSchema must be used within a SignalsFormProvider");
    }

    // Use React state to trigger re-renders when the store changes
    const [store, setStore] = useState<FormState>(formStore.getState());

    useEffect(() => {
        const unsubscribe = formStore.subscribe((newState: FormState) => {
            setStore(newState);
        });
        return unsubscribe;
    }, [formStore]);

    return useMemo(() => getSchemaFromPath(store.schema, schemaKey, "."), [store.schema, schemaKey]);
}
