import { retrieveSchemaRecursive } from '../retrieveSchemaRecursive';
import { createTestValidator } from '../../__tests__/utils/testUtils';

describe('retrieveSchemaRecursive', () => {
  let validator: any;

  beforeEach(() => {
    validator = createTestValidator();
  });

  describe('basic schema resolution', () => {
    it('should return the same schema for simple schemas', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const result = await retrieveSchemaRecursive(validator, schema, schema, {});
      expect(result).toEqual(schema);
    });

    it('should handle empty data', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const result = await retrieveSchemaRecursive(validator, schema, schema, {});
      expect(result).toEqual(schema);
    });
  });

  describe('conditional schema resolution', () => {
    it('should resolve if/then/else conditions', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          hasAccount: { type: 'boolean' },
        },
        if: {
          properties: { hasAccount: { const: true } },
        },
        then: {
          properties: {
            username: { type: 'string' },
            password: { type: 'string' },
          },
        },
        else: {
          properties: {
            email: { type: 'string' },
          },
        },
      };

      // Test with hasAccount: true
      const resultTrue = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { hasAccount: true }
      );

      expect(resultTrue.properties).toHaveProperty('username');
      expect(resultTrue.properties).toHaveProperty('password');
      expect(resultTrue.properties).not.toHaveProperty('email');

      // Test with hasAccount: false
      const resultFalse = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { hasAccount: false }
      );

      expect(resultFalse.properties).toHaveProperty('email');
      expect(resultFalse.properties).not.toHaveProperty('username');
      expect(resultFalse.properties).not.toHaveProperty('password');
    });

    it('should handle nested conditional schemas', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          person: {
            type: 'object',
            properties: {
              hasJob: { type: 'boolean' },
            },
            if: {
              properties: { hasJob: { const: true } },
            },
            then: {
              properties: {
                company: { type: 'string' },
                salary: { type: 'number' },
              },
            },
          },
        },
      };

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { person: { hasJob: true } }
      );

      const personSchema = result.properties?.person;
      expect(personSchema.properties).toHaveProperty('company');
      expect(personSchema.properties).toHaveProperty('salary');
    });
  });

  describe('oneOf/anyOf resolution', () => {
    it('should resolve oneOf schemas', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          contact: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  type: { const: 'email' },
                  email: { type: 'string' },
                },
              },
              {
                type: 'object',
                properties: {
                  type: { const: 'phone' },
                  phone: { type: 'string' },
                },
              },
            ],
          },
        },
      };

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { contact: { type: 'email', email: 'test@example.com' } }
      );

      const contactSchema = result.properties?.contact;
      expect(contactSchema.properties).toHaveProperty('email');
      expect(contactSchema.properties).not.toHaveProperty('phone');
    });

    it('should handle anyOf schemas', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          features: {
            anyOf: [
              {
                type: 'object',
                properties: {
                  notifications: { type: 'boolean' },
                },
              },
              {
                type: 'object',
                properties: {
                  darkMode: { type: 'boolean' },
                },
              },
            ],
          },
        },
      };

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { features: { notifications: true, darkMode: false } }
      );

      const featuresSchema = result.properties?.features;
      expect(featuresSchema.properties).toHaveProperty('notifications');
      expect(featuresSchema.properties).toHaveProperty('darkMode');
    });
  });

  describe('allOf resolution', () => {
    it('should merge allOf schemas', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          user: {
            allOf: [
              {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              },
              {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                },
              },
            ],
          },
        },
      };

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { user: { name: 'John', age: 30 } }
      );

      const userSchema = result.properties?.user;
      expect(userSchema.properties).toHaveProperty('name');
      expect(userSchema.properties).toHaveProperty('age');
    });
  });

  describe('array schemas', () => {
    it('should handle array items with conditional logic', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
              },
              if: {
                properties: { type: { const: 'premium' } },
              },
              then: {
                properties: {
                  price: { type: 'number' },
                  features: { type: 'array' },
                },
              },
              else: {
                properties: {
                  price: { type: 'number' },
                },
              },
            },
          },
        },
      };

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        {
          items: [
            { type: 'premium', price: 100 },
            { type: 'basic', price: 50 },
          ],
        }
      );

      expect(result.properties?.items).toBeDefined();
      const itemsSchema = result.properties?.items;
      expect(itemsSchema.items).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid schemas gracefully', async () => {
      const invalidSchema = null as any;

      const result = await retrieveSchemaRecursive(
        validator,
        invalidSchema,
        invalidSchema,
        {}
      );

      expect(result).toBe(invalidSchema);
    });

    it('should handle circular references', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          self: {
            $ref: '#',
          },
        },
      };

      // Should not throw or cause infinite recursion
      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        { self: {} }
      );

      expect(result).toBeDefined();
    });

    it('should handle malformed data', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const malformedData = 'not an object';

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        malformedData
      );

      expect(result).toEqual(schema);
    });
  });

  describe('performance and caching', () => {
    it('should handle deep nesting efficiently', async () => {
      const createDeepSchema = (depth: number): any => {
        if (depth === 0) {
          return { type: 'string' };
        }
        return {
          type: 'object',
          properties: {
            nested: createDeepSchema(depth - 1),
          },
        };
      };

      const schema = createDeepSchema(10);
      const data = { nested: { nested: { nested: {} } } };

      const startTime = Date.now();
      const result = await retrieveSchemaRecursive(validator, schema, schema, data);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should cache results for identical inputs', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };

      const data = { name: 'test' };

      // First call
      const result1 = await retrieveSchemaRecursive(validator, schema, schema, data);
      
      // Second call with same inputs
      const result2 = await retrieveSchemaRecursive(validator, schema, schema, data);

      expect(result1).toEqual(result2);
    });
  });

  describe('complex real-world scenarios', () => {
    it('should handle multi-level conditional forms', async () => {
      const schema: any = {
        type: 'object',
        properties: {
          userType: { type: 'string', enum: ['individual', 'business'] },
        },
        if: {
          properties: { userType: { const: 'business' } },
        },
        then: {
          properties: {
            company: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                hasEmployees: { type: 'boolean' },
              },
              if: {
                properties: { hasEmployees: { const: true } },
              },
              then: {
                properties: {
                  employeeCount: { type: 'number' },
                  departments: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        else: {
          properties: {
            personal: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
              },
            },
          },
        },
      };

      const businessData = {
        userType: 'business',
        company: {
          name: 'Acme Corp',
          hasEmployees: true,
          employeeCount: 50,
        },
      };

      const result = await retrieveSchemaRecursive(
        validator,
        schema,
        schema,
        businessData
      );

      expect(result.properties).toHaveProperty('company');
      expect(result.properties).not.toHaveProperty('personal');

      const companySchema = result.properties?.company;
      expect(companySchema.properties).toHaveProperty('employeeCount');
      expect(companySchema.properties).toHaveProperty('departments');
    });
  });
});
