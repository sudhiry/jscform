import Ajv from "ajv";
import ajvErrors from "ajv-errors";

const ajv = new Ajv({
    $data: true,
    strict: false,
    allErrors: true,
    useDefaults: true,
})

ajvErrors(ajv);

export { ajv }
