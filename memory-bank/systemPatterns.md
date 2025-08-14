# System Patterns: JSCForm

## Architecture Overview
JSCForm follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│           Form Component            │
├─────────────────────────────────────┤
│         FormProvider/Context        │
├─────────────────────────────────────┤
│          Form Store (RxJS)          │
├─────────────────────────────────────┤
│     Schema Utils & Validation       │
├─────────────────────────────────────┤
│       Component Registry            │
└─────────────────────────────────────┘
```

## Core Design Patterns

### 1. Provider Pattern
- **FormProvider**: Wraps the entire form with React Context
- **FormContext**: Provides form state and actions to child components
- **Benefits**: Centralized state management, prop drilling avoidance

### 2. Store Pattern (RxJS-based)
- **FormStore**: Reactive state management using BehaviorSubject
- **State Structure**: `{schema, data, context, validator, fieldState}`
- **Benefits**: Reactive updates, async validation support, time-travel debugging potential

### 3. Registry Pattern
- **Component Registry**: Global registry for UI components
- **createRegistry()**: Function to register custom components
- **Dynamic Resolution**: Components resolved at render time based on schema
- **Benefits**: UI library agnostic, extensible component system

### 4. Schema-First Pattern
- **JSON Schema**: Single source of truth for form structure
- **Schema Resolution**: Dynamic schema processing with `retrieveSchema()`
- **Type Inference**: Schema drives TypeScript types and validation
- **Benefits**: Consistent validation, automatic form generation

### 5. Hook Pattern
- **useControl**: Custom hook for field-level control
- **useSchema**: Hook for schema-related operations
- **Context Integration**: Hooks connect to FormContext seamlessly
- **Benefits**: Reusable logic, clean component interfaces

## Component Architecture

### Core Components
```
Form (Entry Point)
├── FormProvider (Context)
│   ├── FormContext (State Distribution)
│   └── DynamicUIComponent (Renderer)
│       ├── Registry Lookup
│       └── Component Resolution
```

### Data Flow
```
Schema Input → Store Creation → State Management → Component Rendering
     ↓              ↓               ↓                    ↓
JSON Schema → FormStore → BehaviorSubject → Dynamic Components
     ↓              ↓               ↓                    ↓
Validation → AJV Compile → Error State → Error Display
```

## State Management Patterns

### Reactive State (RxJS)
```typescript
// State structure
interface FormState {
  schema: JSONSchema;
  data: any;
  context?: any;
  validator: Ajv;
  fieldState?: Record<string, FieldState>;
}

// Reactive updates
const state = new BehaviorSubject<FormState>(initialState);
```

### Immutable Updates
- **Deep Cloning**: Uses Lodash `cloneDeep()` for state immutability
- **Path-based Updates**: `set()` function for nested property updates
- **State Transitions**: Async validation triggers state transitions

### Error Handling
- **AJV Integration**: Validation errors parsed from AJV output
- **Error Resolution**: `parseAjvErrors()` converts AJV errors to form-friendly format
- **Field-level Errors**: Errors mapped to specific form fields

## Utility Patterns

### Schema Processing
- **Schema Retrieval**: `retrieveSchema()` resolves dynamic schemas
- **Default Values**: `getDefaultFormState()` generates initial form data
- **Type Detection**: `getSchemaType()` determines field types from schema
- **Schema Merging**: `mergeAllOf` resolver handles schema composition

### Validation Pipeline
```
User Input → Field Update → Schema Validation → Error Parsing → UI Update
```

### Component Resolution
```
Schema Type → Registry Lookup → Component Selection → Props Mapping → Render
```

## Design Principles

### 1. Separation of Concerns
- **Form Logic**: Separated from UI presentation
- **Validation**: Handled by dedicated validation layer
- **State Management**: Isolated in store layer
- **Component Rendering**: Dynamic based on schema

### 2. Extensibility
- **Component Registry**: Easy to add custom components
- **Schema Extensions**: Support for custom schema properties
- **Validation Customization**: Pluggable validator support
- **Context Injection**: Custom context for component communication

### 3. Performance
- **Selective Updates**: RxJS enables targeted re-renders
- **Schema Caching**: Processed schemas cached for reuse
- **Lazy Evaluation**: Components rendered only when needed
- **Async Validation**: Non-blocking validation processing

### 4. Type Safety
- **Schema Types**: JSON Schema mapped to TypeScript types
- **Component Props**: Strongly typed component interfaces
- **State Types**: Comprehensive type definitions for all state
- **Generic Support**: Generic types for custom component integration

## Integration Patterns

### Library Integration
```typescript
// Component registration
createRegistry({
  Input: CustomInput,
  Select: CustomSelect,
  Layout: CustomLayout,
});

// Form usage
<Form 
  schema={schema}
  data={data}
  validator={customValidator}
  onSubmit={handleSubmit}
/>
```

### Custom Component Pattern
```typescript
interface ComponentProps {
  schema: JSONSchema;
  data: any;
  onChange: (value: any) => void;
  error?: string;
}

const CustomInput: React.FC<ComponentProps> = ({ 
  schema, data, onChange, error 
}) => {
  // Component implementation
};
```

### Validation Extension
```typescript
// Custom AJV instance
const customAjv = new Ajv({
  allErrors: true,
  verbose: true,
  // Custom configuration
});

// Custom error formats
ajv.addFormat('custom-format', /pattern/);
```

## Critical Implementation Paths

### Form Initialization
1. Schema validation and processing
2. Default value generation
3. Store creation with initial state
4. Context provider setup
5. Component tree rendering

### Field Updates
1. User input capture
2. State update via `setState()`
3. Schema re-validation
4. Error state computation
5. UI re-render with new state

### Validation Cycle
1. Input change triggers validation
2. AJV compiles and validates schema
3. Errors parsed and formatted
4. Field state updated with errors
5. Error UI components updated

### Component Resolution
1. Schema type analysis
2. Registry lookup for component
3. Props preparation and mapping
4. Component instantiation
5. Event handler binding

This architecture provides a solid foundation for schema-driven form generation while maintaining flexibility and extensibility.
