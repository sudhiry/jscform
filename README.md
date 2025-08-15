# JSCForm - JSON Schema Form Builder

A powerful, lightweight React library for generating dynamic forms from JSON Schema definitions. Built with modern React patterns, TypeScript, and a custom signals-based state management system for optimal performance.

## ✨ Features

- **🚀 Schema-Driven**: Generate complete forms from JSON Schema definitions
- **⚡ Lightweight**: Custom signals library (no RxJS dependency) for minimal bundle size
- **🎨 UI Agnostic**: Works with any UI component library (Material-UI, Ant Design, Shadcn/ui, etc.)
- **📝 TypeScript First**: Full type safety and IntelliSense support
- **✅ Built-in Validation**: Powered by AJV (Another JSON Schema Validator)
- **🔄 Reactive**: Real-time form updates with efficient re-rendering
- **🧩 Extensible**: Plugin-based component registry system
- **🎯 Modern React**: Hooks, Context, and React Server Components support

## 🚀 Quick Start

### Installation

```bash
npm install @repo/jscform
# or
pnpm add @repo/jscform
# or
yarn add @repo/jscform
```

### Basic Usage

```tsx
import React from 'react';
import { Form, createRegistry, ajv } from '@repo/jscform';

// 1. Register your UI components
createRegistry({
  Input: ({ schema, data, onChange, error }) => (
    <div>
      <label>{schema.title}</label>
      <input
        type="text"
        value={data || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{ borderColor: error ? 'red' : 'initial' }}
      />
      {error && <span style={{ color: 'red' }}>{error}</span>}
    </div>
  ),
  Checkbox: ({ schema, data, onChange }) => (
    <label>
      <input
        type="checkbox"
        checked={data || false}
        onChange={(e) => onChange(e.target.checked)}
      />
      {schema.title}
    </label>
  ),
});

// 2. Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    firstName: {
      title: 'First Name',
      type: 'string',
      minLength: 2,
      'ui:widget': { widget: 'Input' }
    },
    lastName: {
      title: 'Last Name',
      type: 'string',
      minLength: 2,
      'ui:widget': { widget: 'Input' }
    },
    subscribe: {
      title: 'Subscribe to newsletter',
      type: 'boolean',
      'ui:widget': { widget: 'Checkbox' }
    }
  },
  required: ['firstName', 'lastName']
};

// 3. Use the Form component
function MyForm() {
  const handleSubmit = (formData) => {
    console.log('Form submitted:', formData);
  };

  return (
    <Form
      schema={schema}
      validator={ajv}
      onSubmit={handleSubmit}
      data={{}} // Initial form data
    />
  );
}
```

## 🏗️ Architecture

JSCForm uses a modern, signals-based architecture for optimal performance:

```
┌─────────────────────────────────────┐
│           Form Component            │
├─────────────────────────────────────┤
│         FormProvider/Context        │
├─────────────────────────────────────┤
│       Custom Signals Store         │
├─────────────────────────────────────┤
│     Schema Utils & Validation       │
├─────────────────────────────────────┤
│       Component Registry            │
└─────────────────────────────────────┘
```

### Why Custom Signals?

We migrated from RxJS to a custom signals implementation for several key benefits:

- **📦 Smaller Bundle**: ~90% reduction in state management overhead
- **⚡ Better Performance**: Targeted updates with minimal re-renders  
- **🎯 Simpler API**: Easier to understand and debug
- **🔧 Tailored**: Optimized specifically for form state management

## 📚 API Reference

### Form Component

```tsx
interface FormProps {
  schema: JSONSchema;           // JSON Schema definition
  validator: Ajv;              // AJV validator instance
  onSubmit: (data: any) => void; // Form submission handler
  data?: any;                  // Initial form data
  onChange?: (data: any) => void; // Real-time data changes
}

<Form {...props} />
```

### Component Registry

```tsx
// Register components globally
createRegistry({
  Input: InputComponent,
  Select: SelectComponent,
  Checkbox: CheckboxComponent,
  // Layout components
  Col1Layout: SingleColumnLayout,
  Col2Layout: TwoColumnLayout,
  Col3Layout: ThreeColumnLayout,
});
```

### Component Interface

```tsx
interface ComponentProps {
  schema: JSONSchema;          // Field schema
  data: any;                  // Current field value
  onChange: (value: any) => void; // Value change handler
  error?: string;             // Validation error message
  path?: string;              // Field path in form data
}
```

### Hooks

```tsx
// Access form control within components
const { data, onChange, error } = useControl();

// Access schema utilities
const { getSchemaType, resolveSchema } = useSchema();
```

## 🎨 UI Library Integration

### Shadcn/ui Example

```tsx
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

createRegistry({
  Input: ({ schema, data, onChange, error }) => (
    <div className="space-y-2">
      <Label>{schema.title}</Label>
      <Input
        value={data || ''}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'border-red-500' : ''}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  ),
  Checkbox: ({ schema, data, onChange }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={data || false}
        onCheckedChange={onChange}
      />
      <Label>{schema.title}</Label>
    </div>
  ),
});
```

### Material-UI Example

```tsx
import { TextField, FormControlLabel, Checkbox } from '@mui/material';

createRegistry({
  Input: ({ schema, data, onChange, error }) => (
    <TextField
      label={schema.title}
      value={data || ''}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      fullWidth
      margin="normal"
    />
  ),
  Checkbox: ({ schema, data, onChange }) => (
    <FormControlLabel
      control={
        <Checkbox
          checked={data || false}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
      label={schema.title}
    />
  ),
});
```

## 🔧 Advanced Features

### Conditional Fields

```json
{
  "type": "object",
  "properties": {
    "hasAddress": {
      "title": "Do you have an address?",
      "type": "boolean",
      "ui:widget": { "widget": "Checkbox" }
    }
  },
  "if": {
    "properties": { "hasAddress": { "const": true } }
  },
  "then": {
    "properties": {
      "address": {
        "title": "Address",
        "type": "string",
        "ui:widget": { "widget": "Input" }
      }
    },
    "required": ["address"]
  }
}
```

### Nested Objects

```json
{
  "type": "object",
  "properties": {
    "person": {
      "type": "object",
      "ui:widget": { "widget": "Col2Layout" },
      "properties": {
        "name": {
          "title": "Full Name",
          "type": "string",
          "ui:widget": { "widget": "Input" }
        },
        "email": {
          "title": "Email",
          "type": "string",
          "format": "email",
          "ui:widget": { "widget": "Input" }
        }
      }
    }
  }
}
```

### Custom Validation Messages

```json
{
  "properties": {
    "username": {
      "title": "Username",
      "type": "string",
      "minLength": 3,
      "maxLength": 20,
      "ui:widget": { "widget": "Input" },
      "errorMessage": {
        "required": "Username is required",
        "minLength": "Username must be at least 3 characters",
        "maxLength": "Username cannot exceed 20 characters"
      }
    }
  }
}
```

### Layout Components

```tsx
// Create layout components for form organization
createRegistry({
  Col2Layout: ({ children }) => (
    <div className="grid grid-cols-2 gap-4">
      {children}
    </div>
  ),
  Col3Layout: ({ children }) => (
    <div className="grid grid-cols-3 gap-4">
      {children}
    </div>
  ),
  Section: ({ schema, children }) => (
    <fieldset className="border p-4 rounded">
      <legend className="font-semibold">{schema.title}</legend>
      {children}
    </fieldset>
  ),
});
```

## 🧪 Development

### Prerequisites

- Node.js 16+
- PNPM 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/sudhiry/jscform.git
cd jscform

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build the library
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
jscform/
├── packages/
│   └── jscform/           # Core library
│       ├── src/
│       │   ├── Form.tsx           # Main Form component
│       │   ├── createRegistry.ts  # Component registry
│       │   ├── signals/           # Custom signals library
│       │   ├── hooks/             # React hooks
│       │   ├── utils/             # Utility functions
│       │   └── contexts/          # React contexts
│       └── package.json
├── apps/
│   └── playground/        # Development playground
└── package.json
```

## 🎯 Examples

Check out the `/apps/playground` directory for comprehensive examples:

- **Basic Form**: Simple contact form with validation
- **Complex Form**: Nested objects and conditional fields
- **UI Integration**: Examples with different UI libraries
- **Custom Components**: Building custom form components

## 📈 Performance

JSCForm is optimized for performance:

- **Bundle Size**: Core library < 50KB minified
- **Rendering**: Selective updates using custom signals
- **Memory**: Efficient state management with minimal overhead
- **Validation**: Compiled AJV schemas for fast validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [AJV](https://ajv.js.org/) for JSON Schema validation
- [React](https://reactjs.org/) for the component framework
- [JSON Schema](https://json-schema.org/) for the specification
- The open source community for inspiration and feedback

---

**Built with ❤️ by [Sudhir Yelikar](https://github.com/sudhiry)**

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/sudhiry/jscform).
