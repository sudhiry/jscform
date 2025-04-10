import Ajv from "ajv";

const ajv = new Ajv({
    $data: true,
    strict: false,
    allErrors: true,
    useDefaults: true,
});

export { ajv }
