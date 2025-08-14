# Project Brief: JSCForm

## Overview
JSCForm is a React-based JSON Schema form builder library that dynamically generates forms from JSON Schema definitions. It provides a flexible, component-based approach to form generation with validation support.

## Core Purpose
- Generate dynamic React forms from JSON Schema specifications
- Provide extensible component registry system for custom UI components
- Support form validation using AJV (Another JSON Schema Validator)
- Enable rapid form development without manual form coding

## Key Features
- **Dynamic Form Generation**: Automatically creates forms from JSON Schema
- **Component Registry**: Pluggable system for custom UI components
- **Validation**: Built-in AJV validation support
- **React Integration**: Native React components with hooks and context
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Monorepo Structure**: Organized as a Turborepo with packages and playground

## Target Users
- React developers needing dynamic form generation
- Applications requiring schema-driven forms
- Teams wanting consistent form UX across applications
- Developers building admin interfaces or configuration forms

## Success Criteria
- Easy integration into existing React applications
- Extensible component system for custom UI libraries
- Reliable validation and error handling
- Good developer experience with TypeScript support
- Performance suitable for complex forms

## Technical Scope
- Core library package (`@repo/jscform`)
- Playground application for testing and examples
- Support for modern React (16.8+, including React 19)
- JSON Schema validation with AJV
- Component registry system for UI customization
