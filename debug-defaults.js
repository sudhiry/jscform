const { ajv } = require('./packages/jscform/dist/index.cjs.js');
const testSchema = require('./apps/playground/src/app/forms/basic-form/test.json');

async function testDefaults() {
    try {
        console.log('Testing default computation...');
        console.log('Schema:', JSON.stringify(testSchema, null, 2));
        
        // Import the getDefaultFormState function
        const { getDefaultFormState } = require('./packages/jscform/dist/index.cjs.js');
        
        // Test with empty data
        const defaults1 = await getDefaultFormState(ajv, testSchema, {}, testSchema);
        console.log('First pass defaults:', JSON.stringify(defaults1, null, 2));
        
        // Test with first pass data
        const defaults2 = await getDefaultFormState(ajv, testSchema, defaults1, testSchema);
        console.log('Second pass defaults:', JSON.stringify(defaults2, null, 2));
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testDefaults();
