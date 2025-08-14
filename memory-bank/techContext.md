# Technical Context: JSCForm

## Technology Stack

### Core Technologies
- **React**: ^16.8.0 || ^17 || ^18 || ^19 (peer dependency)
- **TypeScript**: ^5.3.3 (full type safety)
- **RxJS**: ^7.8.1 (reactive state management)
- **AJV**: ^8.17.1 (JSON Schema validation)
- **Lodash**: ^4.17.21 (utility functions)

### Build & Development
- **Turborepo**: Monorepo management and build orchestration
- **Rollup**: Module bundling with multiple output formats
- **PNPM**: Package manager with workspace support
- **Jest**: Testing framework
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting

### Development Dependencies
- **@rollup/plugin-typescript**: TypeScript compilation
- **@rollup/plugin-terser**: Code minification
- **rollup-plugin-peer-deps-external**: Peer dependency handling

## Project Structure

### Monorepo Organization
```
jscform/
├── packages/
│   ├── jscform/           # Core library
│   ├── config-eslint/     # Shared ESLint configs
│   ├── config-typescript/ # Shared TypeScript configs
│   └── jest-presets/      # Shared Jest configurations
├── apps/
│   └── playground/        # Development and testing app
└── turbo.json            # Turborepo configuration
```

### Core Library Structure
```
packages/jscform/src/
├── Form.tsx              # Main Form component
├── createRegistry.ts     # Component registry system
├── defaultAjv.ts         # Default AJV configuration
├── index.tsx             # Public API exports
├── components/           # Internal components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── store/                # State management
├── utils/                # Utility functions
└── signals/              # Signal-based utilities
```

## Build Configuration

### Output Formats
- **ESM**: `dist/index.esm.mjs` (ES modules)
- **CJS**: `dist/index.cjs.js` (CommonJS)
- **Types**: `dist/index.d.ts` (TypeScript definitions)
- **React Server**: `dist/react-server.esm.mjs` (React Server Components)

### Bundle Strategy
- **Peer Dependencies**: React externalized to avoid duplication
- **Tree Shaking**: ESM build supports tree shaking
- **Minification**: Production builds are minified
- **Source Maps**: Available for debugging

## Development Setup

### Prerequisites
- Node.js (compatible with PNPM 10.1.0)
- PNPM package manager
- TypeScript knowledge

### Key Scripts
- `pnpm dev`: Start development mode with watch
- `pnpm build`: Build all packages
- `pnpm test`: Run test suites
- `pnpm lint`: Lint codebase
- `pnpm typecheck`: TypeScript type checking

### Playground App
- **Next.js**: React framework for testing
- **Tailwind CSS**: Styling framework
- **Shadcn/ui**: Component library for examples
- **Hot Reload**: Instant feedback during development

## Technical Constraints

### React Compatibility
- Minimum React 16.8 (hooks support required)
- React Server Components support
- Concurrent features compatible

### Browser Support
- Modern browsers (ES2018+)
- No IE support
- Tree shaking support required

### Bundle Size
- Lightweight core library
- Minimal runtime dependencies
- Optional features externalized

## Integration Patterns

### Installation
```bash
npm install @repo/jscform
# or
pnpm add @repo/jscform
```

### Basic Usage
```typescript
import { Form, createRegistry, ajv } from '@repo/jscform';

// Register UI components
createRegistry({
  Input: MyInputComponent,
  Checkbox: MyCheckboxComponent,
});

// Use in component
<Form 
  schema={jsonSchema}
  data={formData}
  validator={ajv}
  onSubmit={handleSubmit}
/>
```

### TypeScript Integration
- Full type safety for schemas
- Inferred types for form data
- Generic type support for custom components

## Performance Considerations

### State Management
- RxJS BehaviorSubject for efficient updates
- Selective re-rendering through React Context
- Async validation with debouncing

### Schema Processing
- Schema caching and memoization
- Lazy schema resolution
- Optimized validation cycles

### Bundle Optimization
- Code splitting support
- Tree shaking friendly exports
- Minimal runtime overhead
