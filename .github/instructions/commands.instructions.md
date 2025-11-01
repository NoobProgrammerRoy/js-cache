---
applyTo: '**/*.ts'
---

Instructions for working with command implementations and tests in the codebase:

# Command Implementation & Testing Guidelines

1. **Command Structure**: Each command should be implemented as a function that takes the necessary arguments and returns a response. Follow the existing command structure for consistency.

2. **Error Handling**: Use the `RespError` class for error handling. Ensure that all commands validate their input and return appropriate error messages when the input is invalid.

3. **Testing**: Write unit tests for each command implementation. Tests should cover:
   - Valid inputs
   - Invalid inputs
   - Edge cases

4. **Code Style**: Follow the project's coding style guidelines. This includes naming conventions, file organization, and commenting practices.

5. **Implementation Steps**:
   - Write unit tests in the `test/commands` directory, using the existing test framework. Follow TDD approach by writing tests before implementing the command.
   - Each command should have it's own test file named `<command>.test.ts`.
   - For implementation, define the function signature based on the command's requirements.
   - Implement the command logic, ensuring it adheres to Redis semantics.
   - Configure persistence if necessary (e.g., for commands that modify data).
   - Run all tests to ensure your implementation does not break existing functionality.
