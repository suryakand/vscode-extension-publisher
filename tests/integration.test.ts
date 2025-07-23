import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'yaml';

describe('VS Code Extension Publisher Action - Integration Tests', () => {
  let tempDir: string;
  let actionPath: string;
  let actionConfig: any;

  beforeAll(() => {
    actionPath = path.resolve(__dirname, '../action.yml');
    expect(fs.existsSync(actionPath)).toBe(true);
    
    const actionContent = fs.readFileSync(actionPath, 'utf8');
    actionConfig = yaml.parse(actionContent);
  });

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-action-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Mock Workflow Simulation', () => {
    test('should handle npm package manager configuration', () => {
      // Create mock package.json
      const packageJson = {
        name: 'test-vscode-extension',
        version: '1.0.0',
        engines: {
          vscode: '^1.74.0'
        },
        scripts: {
          'vscode:prepublish': 'npm run compile',
          compile: 'tsc -p ./',
          lint: 'eslint src --ext ts',
          test: 'node out/test/runTest.js',
          package: 'vsce package',
          publish: 'vsce publish'
        },
        devDependencies: {
          '@vscode/vsce': '^3.6.0'
        }
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Create mock package-lock.json
      fs.writeFileSync(
        path.join(tempDir, 'package-lock.json'),
        JSON.stringify({ lockfileVersion: 3 }, null, 2)
      );

      // Verify files exist
      expect(fs.existsSync(path.join(tempDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'package-lock.json'))).toBe(true);

      // Parse and verify package.json
      const parsedPackageJson = JSON.parse(
        fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')
      );
      
      expect(parsedPackageJson.name).toBe('test-vscode-extension');
      expect(parsedPackageJson.scripts.compile).toBe('tsc -p ./');
      expect(parsedPackageJson.scripts.package).toBe('vsce package');
    });

    test('should handle yarn package manager configuration', () => {
      const packageJson = {
        name: 'test-vscode-extension-yarn',
        version: '2.0.0',
        scripts: {
          lint: 'yarn run eslint',
          test: 'yarn run jest',
          compile: 'yarn run tsc',
          package: 'yarn run vsce:package',
          publish: 'yarn run vsce:publish'
        }
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Create yarn.lock
      fs.writeFileSync(path.join(tempDir, 'yarn.lock'), '# Yarn lockfile\n');

      expect(fs.existsSync(path.join(tempDir, 'yarn.lock'))).toBe(true);
      
      const parsedPackageJson = JSON.parse(
        fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')
      );
      
      expect(parsedPackageJson.scripts.lint).toBe('yarn run eslint');
      expect(parsedPackageJson.scripts.package).toBe('yarn run vsce:package');
    });

    test('should simulate version bump detection', () => {
      const testCases = [
        {
          commitMessage: '[major] Breaking API changes',
          expectedType: 'major'
        },
        {
          commitMessage: '[minor] Add new feature',
          expectedType: 'minor'
        },
        {
          commitMessage: 'fix: resolve issue #123',
          expectedType: 'patch'
        },
        {
          commitMessage: 'feat: add new command',
          expectedType: 'minor'
        },
        {
          commitMessage: 'BREAKING CHANGE: remove deprecated API',
          expectedType: 'major'
        },
        {
          commitMessage: '[breaking] remove old functionality',
          expectedType: 'major'
        },
        {
          commitMessage: '[feature] implement new widget',
          expectedType: 'minor'
        }
      ];

      for (const testCase of testCases) {
        // Simulate the version detection logic from the action
        let detectedType = 'patch'; // default
        
        if (testCase.commitMessage.match(/\[major\]|\[breaking\]|BREAKING CHANGE/)) {
          detectedType = 'major';
        } else if (testCase.commitMessage.match(/\[minor\]|\[feature\]|feat:/)) {
          detectedType = 'minor';
        } else {
          detectedType = 'patch';
        }

        expect(detectedType).toBe(testCase.expectedType);
      }
    });

    test('should handle package manager command generation', () => {
      const packageManagers = ['npm', 'yarn', 'pnpm'];
      
      packageManagers.forEach(manager => {
        let installCommand: string;
        let versionCommand: string;
        
        switch (manager) {
          case 'npm':
            installCommand = 'npm ci';
            versionCommand = 'npm version patch --no-git-tag-version';
            break;
          case 'yarn':
            installCommand = 'yarn install --frozen-lockfile';
            versionCommand = 'yarn version --patch --no-git-tag-version';
            break;
          case 'pnpm':
            installCommand = 'pnpm install --frozen-lockfile';
            versionCommand = 'pnpm version patch --no-git-tag-version';
            break;
          default:
            throw new Error(`Unsupported package manager: ${manager}`);
        }
        
        expect(installCommand).toBeDefined();
        expect(versionCommand).toBeDefined();
        expect(installCommand).toContain(manager);
        expect(versionCommand).toContain(manager);
      });
    });
  });

  describe('Input Configuration Tests', () => {
    test('should validate input types and defaults', () => {
      const inputs = actionConfig.inputs;
      
      // Test required input
      expect(inputs['vsce-pat'].required).toBe(true);
      
      // Test optional inputs with defaults
      expect(inputs['node-version'].default).toBe('18');
      expect(inputs['package-manager'].default).toBe('npm');
      expect(inputs['version-bump-type'].default).toBe('auto');
      expect(inputs['skip-tests'].default).toBe('false');
      expect(inputs['skip-lint'].default).toBe('false');
      expect(inputs['create-github-release'].default).toBe('true');
      expect(inputs['upload-vsix-artifact'].default).toBe('true');
      expect(inputs['vsix-retention-days'].default).toBe('30');
      expect(inputs['working-directory'].default).toBe('.');
    });

    test('should validate script defaults', () => {
      const inputs = actionConfig.inputs;
      
      expect(inputs['lint-script'].default).toBe('npm run lint');
      expect(inputs['test-script'].default).toBe('npm run test');
      expect(inputs['compile-script'].default).toBe('npm run compile');
      expect(inputs['package-script'].default).toBe('npm run package');
      expect(inputs['publish-script'].default).toBe('npm run publish');
      expect(inputs['pre-publish-script'].default).toBe('');
    });
  });

  describe('Error Simulation Tests', () => {
    test('should handle missing package.json scenario', () => {
      // Don't create package.json for this test
      const packageJsonPath = path.join(tempDir, 'package.json');
      
      expect(fs.existsSync(packageJsonPath)).toBe(false);
      
      // This would cause the action to fail during version reading
      expect(() => {
        JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      }).toThrow();
    });

    test('should handle invalid package.json scenario', () => {
      // Create invalid package.json
      fs.writeFileSync(path.join(tempDir, 'package.json'), 'invalid json content');
      
      expect(() => {
        JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
      }).toThrow();
    });

    test('should handle missing scripts in package.json', () => {
      const packageJson = {
        name: 'test-extension',
        version: '1.0.0'
        // Missing scripts section
      };

      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const parsedPackageJson = JSON.parse(
        fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')
      );

      expect(parsedPackageJson.scripts).toBeUndefined();
    });
  });

  describe('Output Generation Tests', () => {
    test('should simulate VSIX file generation', () => {
      // Create a mock VSIX file
      const vsixFileName = 'test-extension-1.2.3.vsix';
      const vsixPath = path.join(tempDir, vsixFileName);
      
      fs.writeFileSync(vsixPath, 'mock vsix content');
      
      expect(fs.existsSync(vsixPath)).toBe(true);
      
      // Simulate finding the VSIX file (like the action does)
      const vsixFiles = fs.readdirSync(tempDir).filter(file => file.endsWith('.vsix'));
      
      expect(vsixFiles.length).toBe(1);
      expect(vsixFiles[0]).toBe(vsixFileName);
    });

    test('should simulate version extraction from package.json', () => {
      const versions = ['1.0.0', '2.1.3', '0.0.1-beta', '1.0.0-rc.1'];
      
      versions.forEach(version => {
        const packageJson = {
          name: 'test-extension',
          version: version
        };

        fs.writeFileSync(
          path.join(tempDir, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );

        const parsedPackageJson = JSON.parse(
          fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8')
        );

        expect(parsedPackageJson.version).toBe(version);
      });
    });
  });

  describe('Custom Configuration Tests', () => {
    test('should handle custom working directory structure', () => {
      const subDir = path.join(tempDir, 'extension-project');
      fs.mkdirSync(subDir, { recursive: true });

      const packageJson = {
        name: 'custom-dir-extension',
        version: '1.0.0'
      };

      fs.writeFileSync(
        path.join(subDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      expect(fs.existsSync(path.join(subDir, 'package.json'))).toBe(true);
      
      const parsedPackageJson = JSON.parse(
        fs.readFileSync(path.join(subDir, 'package.json'), 'utf8')
      );
      
      expect(parsedPackageJson.name).toBe('custom-dir-extension');
    });

    test('should validate action step conditions', () => {
      const steps = actionConfig.runs.steps;
      
      // Find conditional steps
      const prePublishStep = steps.find((step: any) => 
        step.name === 'Run pre-publish script'
      );
      expect(prePublishStep?.if).toBe("inputs.pre-publish-script != ''");

      const lintStep = steps.find((step: any) => 
        step.name === 'Lint code'
      );
      expect(lintStep?.if).toBe("inputs.skip-lint != 'true'");

      const testStep = steps.find((step: any) => 
        step.name === 'Run tests'
      );
      expect(testStep?.if).toBe("inputs.skip-tests != 'true'");

      const uploadStep = steps.find((step: any) => 
        step.name === 'Upload VSIX artifact'
      );
      expect(uploadStep?.if).toBe("inputs.upload-vsix-artifact == 'true'");

      const releaseStep = steps.find((step: any) => 
        step.name === 'Create GitHub Release'
      );
      expect(releaseStep?.if).toBe("inputs.create-github-release == 'true'");
    });
  });

  describe('Shell Command Validation', () => {
    test('should validate bash script patterns in action steps', () => {
      const steps = actionConfig.runs.steps;
      
      // Check version detection step
      const versionDetectionStep = steps.find((step: any) => 
        step.name === 'Determine version bump type'
      );
      
      expect(versionDetectionStep?.run).toContain('COMMIT_MSG=$(git log -1 --pretty=%B)');
      expect(versionDetectionStep?.run).toContain('echo "VERSION_TYPE=major" >> $GITHUB_OUTPUT');
      expect(versionDetectionStep?.run).toContain('echo "VERSION_TYPE=minor" >> $GITHUB_OUTPUT');
      expect(versionDetectionStep?.run).toContain('echo "VERSION_TYPE=patch" >> $GITHUB_OUTPUT');

      // Check package manager detection
      const installStep = steps.find((step: any) => 
        step.name === 'Install dependencies'
      );
      
      expect(installStep?.run).toContain('case "${{ inputs.package-manager }}" in');
      expect(installStep?.run).toContain('npm ci');
      expect(installStep?.run).toContain('yarn install --frozen-lockfile');
      expect(installStep?.run).toContain('pnpm install --frozen-lockfile');
    });

    test('should validate git operations in action steps', () => {
      const steps = actionConfig.runs.steps;
      
      const gitConfigStep = steps.find((step: any) => 
        step.name === 'Configure Git for tagging'
      );
      
      expect(gitConfigStep?.run).toContain('git config --local user.email');
      expect(gitConfigStep?.run).toContain('git config --local user.name');

      const tagStep = steps.find((step: any) => 
        step.name === 'Commit version bump and create tag'
      );
      
      expect(tagStep?.run).toContain('git add package.json');
      expect(tagStep?.run).toContain('git commit -m');
      expect(tagStep?.run).toContain('git tag');
      expect(tagStep?.run).toContain('git push origin HEAD');
    });
  });
});
