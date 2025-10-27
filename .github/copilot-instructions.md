# TypeScript Writing Tips

## Interfaces & Types

- Use `interface` for defining contracts (e.g., `IStore<K, V>`, `IAOF`)
- Use `type` for unions and complex type aliases (e.g., `type TRespType = string | number | ...`)
- Prefix interface names with `I` (e.g., `IStore`, `IAOF`)
- Prefix type aliases with `T` (e.g., `TRespType`)

## Generics

- Use generics for reusable classes that work with multiple types (e.g., `MapStore<K, V>`)
- Keep generic constraints meaningful and document their purpose

## Static Methods

- Use static methods for utility functions that don't require instance state (e.g., `RespParser.deserialize()`)
- Use `this` in static methods to reference the class itself

## Classes & Implementation

- Implement interfaces explicitly with `implements` keyword
- Use `private` for internal state (e.g., `private map = new Map<K, V>()`)
- Default to `export default` for single class exports per file

## Imports

- Import using `.js` extensions for ES modules (e.g., `import MapStore from './map.js'`)
- Use named imports for types and interfaces

## Module Configuration

- Target `esnext` for modern JavaScript features
- Use `module: nodenext` for Node.js compatibility
- Set `rootDir: "src"` to organize source files

## Error Handling

- Throw descriptive errors with specific context (e.g., `Invalid RESP format: missing CRLF`)
- Include expected vs actual values in error messages when comparing
- Use try-catch blocks for async operations with meaningful error logging
