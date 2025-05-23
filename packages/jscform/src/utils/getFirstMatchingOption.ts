import getMatchingOption from './getMatchingOption';
import {FormContextType, JSONSchema, ValidatorType} from './types';

/** Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
 * Always returns the first option if there is nothing that matches.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param formData - The current formData, if any, used to figure out a match
 * @param options - The list of options to find a matching options from
 * @param rootSchema - The root schema, used to primarily to look up `$ref`s
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the first matched option or 0 if none is available
 */
export default async function getFirstMatchingOption(validator: ValidatorType, formData: FormContextType | undefined, options: JSONSchema[], rootSchema: JSONSchema, discriminatorField?: string): Promise<number> {
    return await getMatchingOption(validator, formData, options, rootSchema, discriminatorField);
}
