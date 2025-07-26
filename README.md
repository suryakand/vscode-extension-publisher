# VS Code Extension Publisher Action

A comprehensive, reusable GitHub Action for building, testing, and publishing VS Code extensions to the Visual Studio Code Marketplace.

![GitHub Action](images/vscode-extension-publishe-github-action.png)

## Features

- 🏗️ **Build & Test**: Automatically builds and tests your extension
- 📦 **Package**: Creates VSIX files for distribution
- 🚀 **Publish**: Publishes to VS Code Marketplace
- 🏷️ **Versioning**: Automatic or manual version bumping
- 📋 **Artifacts**: Uploads VSIX files as GitHub artifacts
- 🎯 **Releases**: Creates GitHub releases automatically
- ⚙️ **Flexible**: Supports multiple package managers and custom scripts

## Setup Requirements

### 1. VS Code Marketplace Personal Access Token

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Create a Personal Access Token with **Marketplace** scope
3. Add it as a repository secret named `VSCE_PAT`

### 3. Required Dependencies

Your extension should have `@vscode/vsce` as a dev dependency:

```bash
npm install --save-dev @vscode/vsce
```

### 2. GitHub Token Permissions

Ensure your workflow has the necessary permissions:

```yaml
permissions:
  contents: write
  pull-requests: read
```

## Quick Start

## Package Manager Support

The action supports multiple package managers:

- **npm** (default)
- **yarn**
- **pnpm**

## Required Scripts

Your `package.json` should include these scripts (or configure custom ones):

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "lint": "eslint src --ext ts",
    "test": "node out/test/runTest.js",
    "verify": "npx @vscode/vsce login",
    "package": "npx @vscode/vsce package",
    "publish": "npx @vscode/vsce publish"
  }
}
```

### Basic Usage

```yaml
name: Publish VS Code Extension

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Publish Extension
        uses: ./  # Replace with your action path or published action
        with:
          vsce-pat: ${{ secrets.VSCE_PAT }}
```

### Advanced Usage

```yaml
name: Publish VS Code Extension

on:
  push:
    branches: [main]
  pull_request:
    types: [closed]
    branches: [main]
  workflow_dispatch:
    inputs:
      version-bump:
        description: 'Version bump type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  publish:
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch' || (github.event_name == 'pull_request' && github.event.pull_request.merged == true)
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Publish Extension
        uses: ./  # Replace with your action path
        with:
          vsce-pat: ${{ secrets.VSCE_PAT }}
          node-version: '18'
          package-manager: 'npm'
          version-bump-type: ${{ github.event.inputs.version-bump || 'auto' }}
          skip-tests: 'false'
          skip-lint: 'false'
          create-github-release: 'true'
          upload-vsix-artifact: 'true'
```

## Inputs

### Required Inputs

| Input | Description |
|-------|-------------|
| `vsce-pat` | Visual Studio Code Marketplace Personal Access Token |

### Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `node-version` | Node.js version to use | `18` |
| `package-manager` | Package manager (npm, yarn, pnpm) | `npm` |
| `pre-publish-script` | Script to run before publishing | `` |
| `lint-script` | Script to run for linting | `npm run lint` |
| `test-script` | Script to run for testing | `npm run test` |
| `compile-script` | Script to run for compilation | `npm run compile` |
| `package-script` | Script to run for packaging | `npm run package` |
| `publish-script` | Script to run for publishing | `npm run publish` |
| `skip-tests` | Skip running tests | `false` |
| `skip-lint` | Skip running linting | `false` |
| `version-bump-type` | Version bump type (major, minor, patch, auto) | `auto` |
| `create-github-release` | Create a GitHub release | `true` |
| `upload-vsix-artifact` | Upload VSIX as artifact | `true` |
| `vsix-retention-days` | Days to retain VSIX artifact | `30` |
| `publish-to-marketplace` | Upload new extension to VS code Marketplace | `false` |
| `working-directory` | Working directory for the project | `.` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The version that was published |
| `vsix-path` | Path to the generated VSIX file |
| `release-url` | URL of the created GitHub release |

## Version Bump Strategy

The action supports automatic version detection based on commit messages:

- **Major**: `[major]`, `[breaking]`, or `BREAKING CHANGE` in commit message
- **Minor**: `[minor]`, `[feature]`, or `feat:` in commit message  
- **Patch**: Default for all other commits

You can also specify the version bump type manually using the `version-bump-type` input.

## Example Workflows

### Auto-publish on Main Branch

```yaml
name: Auto Publish

on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Publish Extension
        uses: your-org/vscode-extension-publisher@v1
        with:
          vsce-pat: ${{ secrets.VSCE_PAT }}
```

### Manual Release with Version Choice

```yaml
name: Manual Release

on:
  workflow_dispatch:
    inputs:
      version-type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Publish Extension
        uses: your-org/vscode-extension-publisher@v1
        with:
          vsce-pat: ${{ secrets.VSCE_PAT }}
          version-bump-type: ${{ github.event.inputs.version-type }}
```

### Multi-Environment Setup

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Test Extension
        uses: your-org/vscode-extension-publisher@v1
        with:
          vsce-pat: ${{ secrets.VSCE_PAT }}
          skip-tests: 'false'
          create-github-release: 'false'
          upload-vsix-artifact: 'true'

  publish:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Publish Extension
        uses: your-org/vscode-extension-publisher@v1
        with:
          vsce-pat: ${{ secrets.VSCE_PAT }}
          skip-tests: 'true'  # Already tested in previous job
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Ensure your `VSCE_PAT` secret is correctly set
2. **Permission Denied**: Check GitHub token permissions for writing to repository
3. **Package Not Found**: Verify your package.json scripts exist
4. **Version Conflict**: Ensure the version in package.json doesn't already exist

### Debug Mode

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with a sample VS Code extension
5. Submit a pull request

## License
Copyright (c) 2025. All rights reserved.
This source code is licensed under the MIT License - see [LICENSE](LICENSE.md) for details.

**Disclaimer:**  
- It is user's responsibility to review and use this software own their own risk
- Author of this software is not responsible for any loss or issue that may arise beause of this software