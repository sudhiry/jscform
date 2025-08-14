# Active Context: JSCForm

## Current Work Focus
**RxJS to Signals Migration**: Successfully replaced RxJS-based state management with a custom signals library implementation to reduce bundle size and improve performance.

## Recent Changes
- **Replaced RxJS with Signals**: Migrated from BehaviorSubject to custom signals implementation
- **Created signals-based store**: `createSignalsFormStore.ts` replaces `createFormStore.ts`
- **Updated Form components**: Modified `Form.tsx` to use `SignalsFormProvider`
- **Created new hooks**: `useSignalsControl.ts` and updated `useControl.ts` and `useSchema.ts`
- **Updated contexts**: Created `SignalsFormContext.tsx` to replace `FormContext.tsx`
- **Removed RxJS dependency**: Eliminated `rxjs` from package.json dependencies
- **Updated exports**: Added signals-related exports to main index file

## Next Steps
1. **Test playground thoroughly**: Verify all form functionality works with signals
2. **Performance testing**: Compare performance before/after signals migration
3. **Documentation updates**: Update README and examples to reflect signals usage
4. **Bundle size analysis**: Measure reduction in bundle size after RxJS removal

## Active Decisions and Considerations

### Architecture Insights
- **RxJS-based State Management**: The project uses BehaviorSubject for reactive form state, which is sophisticated but may have learning curve implications
- **Component Registry Pattern**: Global registry system allows UI library flexibility but requires careful initialization
- **Schema-driven Approach**: Core value proposition relies heavily on JSON Schema standards compliance

### Development Patterns
- **Monorepo Structure**: Well-organized with clear separation between core library and playground
- **TypeScript-first**: Strong type safety throughout the codebase
- **Modern React**: Uses hooks, context, and supports React Server Components

### Key Technical Decisions
- **AJV for Validation**: Industry-standard JSON Schema validator provides robust validation
- **Lodash Integration**: Used for deep cloning and object manipulation utilities
- **Rollup for Bundling**: Multiple output formats (ESM, CJS, React Server) for broad compatibility

## Important Patterns and Preferences

### Code Organization
- Clear separation between core library (`packages/jscform`) and examples (`apps/playground`)
- Utility functions organized by functionality in `utils/` directory
- React patterns follow modern best practices (hooks, context, functional components)

### State Management Philosophy
- Reactive state updates using RxJS
- Immutable state updates with deep cloning
- Async validation with error handling
- Context-based state distribution

### Component Design
- Registry-based component system for UI flexibility
- Dynamic component rendering based on schema types
- Separation of concerns between form logic and UI presentation

## Learnings and Project Insights

### Strengths
- **Solid Architecture**: Well-thought-out separation of concerns
- **Modern Tooling**: Up-to-date dependencies and build tools
- **Type Safety**: Comprehensive TypeScript integration
- **Flexibility**: Component registry allows for UI library agnostic approach

### Areas for Attention
- **Documentation**: Limited README content suggests need for better developer onboarding
- **Examples**: Playground app provides basic example but could be expanded
- **Testing**: Jest setup exists but test coverage needs assessment
- **Performance**: RxJS and deep cloning patterns need performance validation

### Development Workflow
- Turborepo provides efficient monorepo management
- PNPM workspaces handle dependencies effectively
- Hot reload in playground enables rapid development iteration
- TypeScript compilation integrated into build process

## Context for Future Work
- The project appears to be in active development with a solid foundation
- Core functionality is implemented but may need refinement and expansion
- Documentation and examples could be enhanced for better developer experience
- Performance optimization and testing coverage are likely next priorities

## Memory Bank Status
- ✅ `projectbrief.md` - Complete
- ✅ `productContext.md` - Complete  
- ✅ `techContext.md` - Complete
- ✅ `activeContext.md` - Complete (this file)
- ✅ `systemPatterns.md` - Complete
- ✅ `progress.md` - Complete

**Status**: Memory bank initialization complete! All core files have been created and documented.

**Next Action**: Memory bank is fully initialized and ready for use. Future work can focus on development tasks with full project context available.
