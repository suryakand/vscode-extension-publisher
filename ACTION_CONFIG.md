# VS Code Extension Publisher Action Configuration

## Required package.json Scripts

To use this action effectively, your VS Code extension's `package.json` should include the following scripts:

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node out/test/runTest.js",
    "package": "npx @vscode/vsce package",
    "publish": "npx @vscode/vsce publish"
  }
}
```

## Required Dependencies

### Development Dependencies

```json
{
  "devDependencies": {
    "@vscode/vsce": "^3.6.0",
    "@typescript-eslint/eslint-plugin": "^5.45.0",
    "@typescript-eslint/parser": "^5.45.0",
    "eslint": "^8.28.0",
    "typescript": "^4.9.4"
  }
}
```

## Action Customization

### Custom Scripts

You can override the default scripts by providing custom inputs:

```yaml
- name: Publish Extension
  uses: your-org/vscode-extension-publisher@v1
  with:
    vsce-pat: ${{ secrets.VSCE_PAT }}
    # Custom scripts
    lint-script: 'npm run custom-lint'
    test-script: 'npm run custom-test'
    compile-script: 'npm run custom-compile'
    package-script: 'npx vsce package --out dist/'
    publish-script: 'npx vsce publish --packagePath dist/*.vsix'
```

### Skip Steps

You can skip certain steps if they're not applicable to your project:

```yaml
- name: Publish Extension
  uses: your-org/vscode-extension-publisher@v1
  with:
    vsce-pat: ${{ secrets.VSCE_PAT }}
    skip-tests: 'true'     # Skip if no tests
    skip-lint: 'true'      # Skip if no linting
```

### Package Managers

The action supports different package managers:

```yaml
# For Yarn
- name: Publish Extension (Yarn)
  uses: your-org/vscode-extension-publisher@v1
  with:
    vsce-pat: ${{ secrets.VSCE_PAT }}
    package-manager: 'yarn'
    lint-script: 'yarn lint'
    test-script: 'yarn test'
    compile-script: 'yarn compile'
    package-script: 'yarn package'
    publish-script: 'yarn publish:vscode'

# For pnpm
- name: Publish Extension (pnpm)
  uses: your-org/vscode-extension-publisher@v1
  with:
    vsce-pat: ${{ secrets.VSCE_PAT }}
    package-manager: 'pnpm'
    lint-script: 'pnpm lint'
    test-script: 'pnpm test'
    compile-script: 'pnpm compile'
    package-script: 'pnpm package'
    publish-script: 'pnpm publish:vscode'
```

## Environment Variables

The action respects the following environment variables:

- `VSCE_PAT`: Visual Studio Code Marketplace Personal Access Token (set via inputs)
- `GITHUB_TOKEN`: GitHub token for creating releases and pushing tags

## Repository Secrets Required

1. `VSCE_PAT`: Your VS Code Marketplace Personal Access Token
2. `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Workflow Permissions

Ensure your workflow has the necessary permissions:

```yaml
permissions:
  contents: write      # For pushing tags and creating releases
  pull-requests: read  # For reading PR information
```

## Troubleshooting

### Common Issues

1. **Missing Scripts**: Ensure all required scripts exist in package.json
2. **Permission Errors**: Check workflow permissions and repository secrets
3. **Version Conflicts**: The action will fail if the version already exists in the marketplace
4. **Authentication**: Verify your VSCE_PAT is valid and has marketplace permissions

### Debug Mode

Enable debug logging:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
```
