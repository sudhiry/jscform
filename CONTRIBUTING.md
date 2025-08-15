# Contributing to JSCForm

Thank you for your interest in contributing to JSCForm! This guide will help you get started with contributing to our JSON Schema form builder library.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- PNPM 8+
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/jscform.git
   cd jscform
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Development**
   ```bash
   # Start the playground in development mode
   pnpm dev
   
   # In another terminal, build the library in watch mode
   cd packages/jscform
   pnpm dev
   ```

4. **Verify Setup**
   - Open http://localhost:3000
   - Navigate to `/forms` to see examples
   - Make a small change to verify hot reload works

## 📁 Project Structure

```
jscform/
├── packages/
│   ├── jscform/              # Core library
│   │   ├── src/
│   │   │   ├── Form.tsx              # Main Form component
│   │   │   ├── createRegistry.ts     # Component registry
│   │   │   ├── signals/              # Custom signals library
│   │   │   ├── hooks/                # React hooks
│   │   │   ├── utils/                # Utility functions
│   │   │   └── contexts/             # React contexts
│   │   └── package.json
│   ├── config-eslint/        # Shared ESLint configs
│   ├── config-typescript/    # Shared TypeScript configs
│   └── jest-presets/         # Shared Jest configurations
├── apps/
│   └── playground/           # Development playground
│       └── src/app/forms/    # Form examples
└── memory-bank/              # Project documentation
```

## 🛠️ Development Workflow

### Making Changes

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make Your Changes**
   - Core library changes go in `packages/jscform/src/`
   - Add examples in `apps/playground/src/app/forms/`
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   # Run type checking
   pnpm typecheck
   
   # Run linting
   pnpm lint
   
   # Run tests
   pnpm test
   
   # Build the library
   pnpm build
   ```

4. **Test in Playground**
   - Create or update examples in the playground
   - Verify your changes work as expected
   - Test edge cases and error scenarios

### Code Standards

#### TypeScript
- Use strict TypeScript settings
- Provide comprehensive type definitions
- Avoid `any` types when possible
- Use generic types for reusable components

#### React Patterns
- Use functional components with hooks
- Follow React best practices
- Use proper dependency arrays in useEffect
- Implement proper error boundaries

#### Code Style
- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

#### Signals Library
- Use the custom signals library for reactive state
- Follow the established patterns in existing code
- Ensure efficient updates and minimal re-renders
- Document any new signal patterns

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests for specific package
cd packages/jscform
pnpm test
```

### Writing Tests
- Add unit tests for new utility functions
- Test React components with React Testing Library
- Include integration tests for complex workflows
- Test error scenarios and edge cases

### Test Structure
```typescript
// Example test structure
describe('ComponentName', () => {
  it('should handle basic functionality', () => {
    // Test implementation
  });

  it('should handle error cases', () => {
    // Error scenario tests
  });

  it('should integrate with other components', () => {
    // Integration tests
  });
});
```

## 📝 Documentation

### Code Documentation
- Add JSDoc comments to public APIs
- Document complex algorithms and business logic
- Include usage examples in comments
- Keep documentation up to date with code changes

### README Updates
- Update the main README for new features
- Add examples for new functionality
- Update API documentation sections
- Include migration guides for breaking changes

### Example Creation
- Create comprehensive examples in the playground
- Include both simple and complex use cases
- Add comments explaining key concepts
- Test examples thoroughly

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues to avoid duplicates
2. Test with the latest version
3. Reproduce the issue in the playground
4. Gather relevant information (browser, Node version, etc.)

### Bug Report Template
```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots/Code**
If applicable, add screenshots or code snippets.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js version: [e.g. 18.17.0]
- JSCForm version: [e.g. 0.1.0]
```

## ✨ Feature Requests

### Before Requesting
1. Check if the feature already exists
2. Consider if it fits the project's scope
3. Think about implementation complexity
4. Consider backward compatibility

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature you'd like to see.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
How you envision this feature working.

**Alternatives Considered**
Other approaches you've considered.

**Additional Context**
Any other context or screenshots about the feature.
```

## 🔄 Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation
3. Add/update examples if needed
4. Follow the code style guidelines
5. Write clear commit messages

### PR Template
```markdown
**Description**
Brief description of changes made.

**Type of Change**
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

**Testing**
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Tested in playground application
- [ ] Manual testing completed

**Checklist**
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process
1. Automated checks must pass (CI/CD)
2. Code review by maintainers
3. Address feedback and requested changes
4. Final approval and merge

## 🏗️ Architecture Guidelines

### Core Principles
1. **Schema-First**: JSON Schema drives everything
2. **Component Registry**: UI library agnostic approach
3. **Reactive State**: Efficient updates using custom signals
4. **Type Safety**: Comprehensive TypeScript support
5. **Performance**: Minimal re-renders and bundle size

### Adding New Features

#### New Component Types
1. Create the component in `packages/jscform/src/components/`
2. Add to the component registry system
3. Update TypeScript definitions
4. Add comprehensive tests
5. Create playground examples

#### New Utilities
1. Add to appropriate utility directory
2. Follow existing patterns and naming
3. Include comprehensive tests
4. Document with JSDoc comments
5. Export from main index file

#### Schema Extensions
1. Ensure JSON Schema compliance
2. Add validation logic
3. Update type definitions
4. Test with various scenarios
5. Document usage patterns

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

### Communication
- Use GitHub issues for bug reports and feature requests
- Join discussions in pull requests
- Ask questions in issues or discussions
- Share knowledge and help others

### Recognition
Contributors will be recognized in:
- README acknowledgments
- Release notes
- GitHub contributors list
- Special recognition for significant contributions

## 📚 Resources

### Learning Resources
- [JSON Schema Documentation](https://json-schema.org/)
- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [AJV Documentation](https://ajv.js.org/)

### Project Resources
- [Project README](README.md)
- [Memory Bank Documentation](memory-bank/)
- [Playground Examples](apps/playground/src/app/forms/)
- [GitHub Issues](https://github.com/sudhiry/jscform/issues)

## 🙋‍♀️ Getting Help

If you need help:
1. Check the documentation and examples
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Join community discussions

Thank you for contributing to JSCForm! Your contributions help make dynamic form generation better for everyone. 🎉
