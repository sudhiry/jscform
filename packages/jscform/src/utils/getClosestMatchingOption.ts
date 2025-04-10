import get from 'lodash/get';
import has from 'lodash/has';
import isNumber from 'lodash/isNumber';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import times from 'lodash/times';

import getFirstMatchingOption from './getFirstMatchingOption';
import retrieveSchema, {resolveAllReferences} from './retrieveSchema';
import {ONE_OF_KEY, REF_KEY, JUNK_OPTION_ID, ANY_OF_KEY} from './constants';
import guessType from './guessType';
import {GenericObjectType, JSONSchema, ValidatorType} from './types';
import getDiscriminatorFieldFromSchema from './getDiscriminatorFieldFromSchema';
import getOptionMatchingSimpleDiscriminator from './getOptionMatchingSimpleDiscriminator';
import pReduce from "p-reduce";

/** A junk option used to determine when the getFirstMatchingOption call really matches an option rather than returning
 * the first item
 */
export const JUNK_OPTION: any = {
    type: 'object',
    $id: JUNK_OPTION_ID,
    properties: {
        __not_really_there__: {
            type: 'number',
        },
    },
};

/** Recursive function that calculates the score of a `formData` against the given `schema`. The computation is fairly
 * simple. Initially the total score is 0. When `schema.properties` object exists, then all the `key/value` pairs within
 * the object are processed as follows after obtaining the formValue from `formData` using the `key`:
 * - If the `value` contains a `$ref`, `calculateIndexScore()` is called recursively with the formValue and the new
 *   schema that is the result of the ref in the schema being resolved and that sub-schema's resulting score is added to
 *   the total.
 * - If the `value` contains a `oneOf` and there is a formValue, then score based on the index returned from calling
 *   `getClosestMatchingOption()` of that oneOf.
 * - If the type of the `value` is 'object', `calculateIndexScore()` is called recursively with the formValue and the
 *   `value` itself as the sub-schema, and the score is added to the total.
 * - If the type of the `value` matches the guessed-type of the `formValue`, the score is incremented by 1, UNLESS the
 *   value has a `default` or `const`. In those case, if the `default` or `const` and the `formValue` match, the score
 *   is incremented by another 1 otherwise it is decremented by 1.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param rootSchema - The root JSON schema of the entire form
 * @param schema - The schema for which the score is being calculated
 * @param formData - The form data associated with the schema, used to calculate the score
 * @returns - The score a schema against the formData
 */
export async function calculateIndexScore(validator: ValidatorType, rootSchema: JSONSchema, schema?: JSONSchema, formData: any = {}): Promise<number> {
    let totalScore = 0;
    if (schema) {
        if (isObject(schema.properties)) {
            totalScore += await pReduce(Object.keys(schema.properties), async (score, propertyKey, key) => {
                const value = schema.properties[propertyKey];
                const formValue = get(formData, key);
                if (typeof value === 'boolean') {
                    return score;
                }
                if (has(value, REF_KEY)) {
                    const newSchema = await retrieveSchema(validator, value as JSONSchema, rootSchema, formValue);
                    return score + await calculateIndexScore(validator, rootSchema, newSchema, formValue || {});
                }
                if ((has(value, ONE_OF_KEY) || has(value, ANY_OF_KEY)) && formValue) {
                    const key = has(value, ONE_OF_KEY) ? ONE_OF_KEY : ANY_OF_KEY;
                    const discriminator = getDiscriminatorFieldFromSchema(value as JSONSchema);
                    return (score + await getClosestMatchingOption(validator, rootSchema, formValue, get(value, key) as JSONSchema[], -1, discriminator));
                }
                // @ts-ignore
                if (value.type === 'object') {
                    return score + await calculateIndexScore(validator, rootSchema, value as JSONSchema, formValue || {});
                }
                // @ts-ignore
                if (value.type === guessType(formValue)) {
                    // If the types match, then we bump the score by one
                    let newScore = score + 1;
                    // @ts-ignore
                    if (value.default) {
                        // If the schema contains a readonly default value score the value that matches the default higher and
                        // any non-matching value lower
                        // @ts-ignore
                        newScore += formValue === value.default ? 1 : -1;
                        // @ts-ignore
                    } else if (value.const) {
                        // If the schema contains a const value score the value that matches the default higher and
                        // any non-matching value lower
                        // @ts-ignore
                        newScore += formValue === value.const ? 1 : -1;
                    }
                    // TODO eventually, deal with enums/arrays
                    return newScore;
                }
                return score;
            }, 0);
        } else if (isString(schema.type) && schema.type === guessType(formData)) {
            totalScore += 1;
        }
    }
    return totalScore;
}

/** Determines which of the given `options` provided most closely matches the `formData`. Using
 * `getFirstMatchingOption()` to match two schemas that differ only by the readOnly, default or const value of a field
 * based on the `formData` and returns 0 when there is no match. Rather than passing in all the `options` at once to
 * this utility, instead an array of valid option indexes is created by iterating over the list of options, call
 * `getFirstMatchingOptions` with a list of one junk option and one good option, seeing if the good option is considered
 * matched.
 *
 * Once the list of valid indexes is created, if there is only one valid index, just return it. Otherwise, if there are
 * no valid indexes, then fill the valid indexes array with the indexes of all the options. Next, the index of the
 * option with the highest score is determined by iterating over the list of valid options, calling
 * `calculateIndexScore()` on each, comparing it against the current best score, and returning the index of the one that
 * eventually has the best score.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param rootSchema - The root JSON schema of the entire form
 * @param formData - The form data associated with the schema
 * @param options - The list of options that can be selected from
 * @param [selectedOption=-1] - The index of the currently selected option, defaulted to -1 if not specified
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the option that is the closest match to the `formData` or the `selectedOption` if no match
 */
export default async function getClosestMatchingOption(validator: ValidatorType, rootSchema: JSONSchema, formData: GenericObjectType | undefined, options: JSONSchema[], selectedOption = -1, discriminatorField?: string): Promise<number> {
    // First resolve any refs in the options
    const resolvedOptions = options.map((option) => {
        return resolveAllReferences(option, rootSchema, []);
    });
    const simpleDiscriminatorMatch = getOptionMatchingSimpleDiscriminator(formData, options, discriminatorField);
    if (isNumber(simpleDiscriminatorMatch)) {
        return simpleDiscriminatorMatch;
    }
    // Reduce the array of options down to a list of the indexes that are considered matching options
    const allValidIndexes = await pReduce(resolvedOptions, async (validList: number[], option, index: number) => {
        const testOptions: JSONSchema[] = [JUNK_OPTION, option];
        const match = await getFirstMatchingOption(validator, formData, testOptions, rootSchema, discriminatorField);
        // The match is the real option, so add its index to list of valid indexes
        if (match === 1) {
            validList.push(index);
        }
        return validList;
    }, [])
    // There is only one valid index, so return it!
    if (allValidIndexes.length === 1) {
        return allValidIndexes[0];
    }
    if (!allValidIndexes.length) {
        // No indexes were valid, so we'll score all the options, add all the indexes
        times(resolvedOptions.length, (i) => allValidIndexes.push(i));
    }
    type BestType = { bestIndex: number; bestScore: number };
    const scoreCount = new Set<number>();
    // Score all the options in the list of valid indexes and return the index with the best score
    const {bestIndex}: BestType = await pReduce(allValidIndexes, async (scoreData: BestType, index: number) => {
        const {bestScore} = scoreData;
        const option = resolvedOptions[index];
        const score = await calculateIndexScore(validator, rootSchema, option, formData);
        scoreCount.add(score);
        if (score > bestScore) {
            return {bestIndex: index, bestScore: score};
        }
        return scoreData;
    }, {bestIndex: selectedOption, bestScore: 0});
    // if all scores are the same go with selectedOption
    if (scoreCount.size === 1 && selectedOption >= 0) {
        return selectedOption;
    }
    return bestIndex;
}
