import React from "react";
import { Form } from "../Form";
import { useFormState, useFormData, useFormValidation } from "../hooks/useFormState";
import { useSignalEffect } from "../signals/react-signals";
import { ajv } from "../defaultAjv";

// Example schema
const exampleSchema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Name",
      "ui:widget": { widget: "Input" }
    },
    email: {
      type: "string",
      format: "email", 
      title: "Email",
      "ui:widget": { widget: "Input" }
    },
    age: {
      type: "number",
      minimum: 0,
      maximum: 120,
      title: "Age",
      "ui:widget": { widget: "Input" }
    }
  },
  required: ["name", "email"]
} as any;

const initialData = {
  name: "",
  email: "",
  age: 0
};

/**
 * Example component demonstrating signals-optimized form usage
 */
export function SignalsFormExample() {
  return (
    <div className="signals-form-example">
      <h2>Signals-Optimized Form Example</h2>
      
      <Form
        schema={exampleSchema}
        data={initialData}
        validator={ajv}
        onValidationChange={(isValid, errors) => {
          console.log("Validation changed:", { isValid, errors });
        }}
        onChange={(data) => {
          console.log("Form data changed:", data);
        }}
      />
      
      <FormContent />
    </div>
  );
}

/**
 * Form content component that uses signals hooks
 */
function FormContent() {
  // Use signals hooks to access form state reactively
  const formState = useFormState();
  const formData = useFormData();
  const validation = useFormValidation();

  // Use signal effects for side effects
  useSignalEffect(() => {
    console.log("Form data changed:", formData);
  }, []);

  useSignalEffect(() => {
    if (validation.hasErrors) {
      console.log("Validation errors:", validation.errors);
    }
  }, []);

  return (
    <div className="form-content">
      <div className="form-fields">
        {/* Form fields will be rendered by DynamicUIComponent */}
      </div>
      
      <div className="form-info">
        <h3>Form State (Live Updates via Signals)</h3>
        
        <div className="state-section">
          <h4>Current Data:</h4>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
        
        <div className="state-section">
          <h4>Validation Status:</h4>
          <div>
            <strong>Valid:</strong> {validation.isValid ? "✅" : "❌"}
          </div>
          {validation.hasErrors && (
            <div>
              <strong>Errors:</strong>
              <pre>{JSON.stringify(validation.errors, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="state-section">
          <h4>Schema Info:</h4>
          <div>
            <strong>Required Fields:</strong> {formState.schema.required?.join(", ") || "None"}
          </div>
          <div>
            <strong>Total Properties:</strong> {Object.keys(formState.schema.properties || {}).length}
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS styles (would typically be in a separate file)
const styles = `
.signals-form-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-fields {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-info {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.state-section {
  margin-bottom: 20px;
}

.state-section h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.state-section pre {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 12px;
  overflow-x: auto;
}
`;

// Inject styles (in a real app, you'd use CSS modules or styled-components)
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
