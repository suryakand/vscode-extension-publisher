# VS Code Extension Publisher Action Tests

This directory contains comprehensive unit tests for the VS Code Extension Publisher GitHub Action using Jest and TypeScript.

## Test Structure

```
tests/
├── package.json              # Test dependencies and scripts
├── tsconfig.json             # TypeScript configuration for tests
├── jest.config.js            # Jest configuration
├── setup.ts                  # Jest setup file
├── run-tests.sh              # Test runner script
├── action.test.ts            # Action YAML validation tests
├── integration.test.ts       # Integration and workflow simulation tests
└── README.md                 # This file
```

## Features Tested

### 1. Action Configuration Validation (`action.test.ts`)
- ✅ YAML structure validation
- ✅ Input/output schema validation
- ✅ Step configuration validation
- ✅ Conditional logic validation
- ✅ Package manager support validation
- ✅ Error handling validation
- ✅ GitHub integration validation

### 2. Workflow Simulation (`integration.test.ts`)
- ✅ Package manager workflow simulation (npm, yarn, pnpm)
- ✅ Version bump detection logic
- ✅ File system operations simulation
- ✅ Error scenario handling
- ✅ Output generation validation
- ✅ Custom configuration testing

## Running Tests

### Quick Start

```bash
# Make the script executable (if not already)
chmod +x run-tests.sh

# Run all tests
./run-tests.sh
```

### Manual Test Execution

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Using Jest directly

```bash
# Run specific test file
npx jest action.test.ts

# Run with verbose output
npx jest --verbose

# Run and generate coverage report
npx jest --coverage
```

## Test Categories

### Unit Tests
- Action YAML parsing and validation
- Input/output configuration testing
- Step condition validation
- Script command validation

### Integration Tests
- Mock workflow execution
- File system simulation
- Package manager command testing
- Version detection logic
- Error handling scenarios

### Validation Tests
- Schema compliance
- Required field validation
- Default value verification
- Conditional step logic

## Test Coverage

The tests cover:

- **Action Definition**: 100% of action.yml structure
- **Input Validation**: All input parameters and defaults
- **Step Logic**: All composite action steps
- **Conditional Flows**: All conditional step execution
- **Error Handling**: Common failure scenarios
- **Package Managers**: npm, yarn, pnpm support
- **Version Detection**: Auto-detection from commit messages
- **File Operations**: package.json handling, VSIX generation
- **Git Operations**: Tagging and pushing logic

## Mock Testing Strategy

Since this is a composite GitHub Action that relies on external services and commands, the tests use:

1. **YAML Parsing**: Direct validation of action configuration
2. **Logic Simulation**: Recreating the bash script logic in JavaScript/TypeScript
3. **File System Mocking**: Creating temporary directories and files
4. **Command Simulation**: Testing command generation without execution
5. **Scenario Testing**: Various input combinations and edge cases

## Writing Additional Tests

### Adding New Test Cases

1. **Action Configuration Tests** (`action.test.ts`):
   ```typescript
   test('should validate new input parameter', () => {
     expect(actionConfig.inputs['new-input']).toHaveProperty('description');
     expect(actionConfig.inputs['new-input'].default).toBe('expected-default');
   });
   ```

2. **Integration Tests** (`integration.test.ts`):
   ```typescript
   test('should handle new scenario', () => {
     // Setup test scenario
     const testData = createTestScenario();
     
     // Execute logic
     const result = simulateActionLogic(testData);
     
     // Verify results
     expect(result).toBe(expectedOutcome);
   });
   ```

### Test Utilities

The test suite includes utilities for:
- Creating temporary directories
- Generating mock package.json files
- Simulating different package managers
- Testing version bump logic
- Validating action outputs

## Local Action Testing with Act

If you have [act](https://github.com/nektos/act) installed, you can test the actual action locally:

```bash
# Install act (macOS)
brew install act

# Test the action workflow
act -W ../.github/workflows/test-action.yml

# Test with specific inputs
act workflow_dispatch -W ../.github/workflows/test-action.yml \
  --input test-scenario=basic
```

## Continuous Integration

These tests can be integrated into a CI pipeline:

```yaml
name: Test Action
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: tests/package-lock.json
      
      - name: Install test dependencies
        run: cd tests && npm ci
      
      - name: Run tests
        run: cd tests && npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: tests/coverage
```

## Best Practices

1. **Keep tests isolated**: Each test should be independent
2. **Use descriptive names**: Test names should clearly describe what's being tested
3. **Test edge cases**: Include both happy path and error scenarios
4. **Mock external dependencies**: Don't rely on external services in tests
5. **Validate outputs**: Ensure all action outputs are tested
6. **Test documentation**: Keep tests updated with action changes

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors**: Check `tsconfig.json` configuration
2. **Jest configuration issues**: Verify `jest.config.js` settings
3. **Missing dependencies**: Run `npm install` in the tests directory
4. **Path resolution**: Ensure relative paths are correct

### Debug Mode

Enable verbose testing:

```bash
# Run with debug output
npm test -- --verbose --no-coverage

# Run specific test with detailed output
npx jest action.test.ts --verbose
```
