import isSelect from './isSelect';
import {JSONSchema, ValidatorType} from "./types";

/** Checks to see if the `schema` combination represents a multi-select
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which check for a multi-select flag is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema contains a multi-select, otherwise false
 */
export default async function isMultiSelect(validator: ValidatorType, schema: JSONSchema, rootSchema?: JSONSchema) {
    if (!schema.uniqueItems || !schema.items || typeof schema.items === 'boolean') {
        return false;
    }
    return await isSelect(validator, schema.items as JSONSchema, rootSchema);
}
