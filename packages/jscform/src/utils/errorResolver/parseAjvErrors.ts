import JSONPointer from "jsonpointer";
import {AjvError, FieldError, JSONSchema} from "../types";
import {set} from "lodash";
import { parseJsonTemplateString } from "../parseJsonTemplateString";

const reduceErrors = (errors: AjvError[], schema: JSONSchema) => {
    return errors.reduce<Record<string, FieldError>>((previous, error) => {
        const errorSchema = JSONPointer.get(schema, error.schemaPath);
        const path = error.instancePath.substring(1).replace(/\//g, '.');
        let message = errorSchema?.errorMessage?.[error.keyword] ||
        (errorSchema ? errorSchema[error.keyword]?.errorMessage : '');
        message = parseJsonTemplateString(message, error);
        previous[path] = {
          message,
          type: error.keyword,
        };
        return previous;
      }, {});
}


export const parseAjvErrors = (ajvErrors: AjvError[] | null | undefined, schema: JSONSchema) => {
    if(ajvErrors === null || ajvErrors === undefined) {
        return null;
    }
    const errors = ajvErrors
    .map((error) => {
      const segments = error.schemaPath.replace('#', '').split('/');
      segments.pop();
      if (error.keyword === 'required') {
        error.instancePath += '/' + error.params.missingProperty;
        segments.push('properties');
        segments.push(error.params.missingProperty);
        error.schemaPath = segments.join('/');
        return error;
      }
      error.schemaPath = segments.join('/');
      return error;
    })
    .filter(Boolean);
  const mappedErrors = reduceErrors(errors, schema);
  return toNestErrors(mappedErrors);
}

export const toNestErrors = (errors: Record<string, any> | null): any => {
    if(errors === null || errors === undefined) {
        return null;
    }
    const errorObj = {};

    for (const key in errors) {
        const error = errors[key];
        set(errorObj, key, error);
    }
    return errorObj;
};
