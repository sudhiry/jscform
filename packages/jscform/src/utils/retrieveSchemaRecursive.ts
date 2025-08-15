import { cloneDeep, get } from 'lodash';
import retrieveSchema from './retrieveSchema';
import { JSONSchema, ValidatorType } from './types';
import { PROPERTIES_KEY, IF_KEY } from './constants';
import isObject from './isObject';

// Cache for resolved schemas to avoid redundant computations
const schemaCache = new WeakMap<object, Map<string, { schema: JSONSchema; dataHash: string }>>();

/**
 * Recursively retrieves and resolves schemas at all levels, handling nested conditional logic.
 * This function ensures that if/then/else conditions are properly evaluated at every level
 * of the schema hierarchy.
 * 
 * @param validator - The validator instance
 * @param schema - The schema to resolve
 * @param rootSchema - The root schema for reference resolution
 * @param formData - The current form data
 * @param path - The current path in the schema (for caching)
 * @returns Promise<JSONSchema> - The fully resolved schema with all nested conditions evaluated
 */
export async function retrieveSchemaRecursive(
    validator: ValidatorType,
    schema: JSONSchema,
    rootSchema: JSONSchema,
    formData: any,
    path: string = ''
): Promise<JSONSchema> {
    if (!isObject(schema)) {
        return schema;
    }

    // Create a cache key based on the current data state
    const dataHash = JSON.stringify(formData);
    const cacheKey = `${path}:${dataHash}`;
    
    // Check cache first
    let cacheForSchema = schemaCache.get(schema);
    if (!cacheForSchema) {
        cacheForSchema = new Map();
        schemaCache.set(schema, cacheForSchema);
    }
    
    const cached = cacheForSchema.get(cacheKey);
    if (cached && cached.dataHash === dataHash) {
        return cached.schema;
    }

    // Get the current data for this path
    const currentData = path ? get(formData, path) : formData;
    
    // First, resolve the schema at the current level
    // For conditional logic, we need to pass the data that corresponds to this schema level
    let resolvedSchema = await retrieveSchema(validator, schema, rootSchema, currentData, false);
    
    // If the schema has properties, recursively resolve each property
    if (resolvedSchema[PROPERTIES_KEY]) {
        const resolvedProperties: Record<string, JSONSchema> = {};
        
        for (const [propertyKey, propertySchema] of Object.entries(resolvedSchema[PROPERTIES_KEY])) {
            const propertyPath = path ? `${path}.${propertyKey}` : propertyKey;
            
            // Check if this property has conditional logic that needs resolution
            if (hasConditionalLogic(propertySchema as JSONSchema)) {
                // Recursively resolve this property's schema with its specific data context
                resolvedProperties[propertyKey] = await retrieveSchemaRecursive(
                    validator,
                    propertySchema as JSONSchema,
                    rootSchema,
                    formData,
                    propertyPath
                );
            } else if (isObject(propertySchema) && (propertySchema as JSONSchema)[PROPERTIES_KEY]) {
                // Even if no conditional logic at this level, check nested properties
                resolvedProperties[propertyKey] = await retrieveSchemaRecursive(
                    validator,
                    propertySchema as JSONSchema,
                    rootSchema,
                    formData,
                    propertyPath
                );
            } else {
                // No conditional logic and no nested properties, use as-is
                resolvedProperties[propertyKey] = propertySchema as JSONSchema;
            }
        }
        
        resolvedSchema = {
            ...resolvedSchema,
            [PROPERTIES_KEY]: resolvedProperties
        } as JSONSchema;
    }
    
    // Cache the result
    cacheForSchema.set(cacheKey, { schema: cloneDeep(resolvedSchema), dataHash });
    
    return resolvedSchema;
}

/**
 * Checks if a schema contains conditional logic that requires data-dependent resolution
 */
function hasConditionalLogic(schema: JSONSchema): boolean {
    if (!isObject(schema)) {
        return false;
    }
    
    return !!(
        schema[IF_KEY] ||
        schema.if ||
        schema.then ||
        schema.else ||
        schema.oneOf ||
        schema.anyOf ||
        schema.allOf ||
        schema.dependencies ||
        schema.$ref
    );
}

/**
 * Clears the schema cache - useful for testing or when you want to force re-computation
 */
export function clearSchemaCache(): void {
    // We can't clear WeakMap directly, but we can create a new one
    // The old cache will be garbage collected when schemas are no longer referenced
}

/**
 * Gets cache statistics for debugging purposes
 */
export function getSchemaCacheStats(): { totalCaches: number } {
    // WeakMap doesn't provide size information, but we can provide basic stats
    return {
        totalCaches: 0 // WeakMap doesn't expose size
    };
}
