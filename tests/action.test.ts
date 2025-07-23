import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'yaml';

describe('VS Code Extension Publisher Action', () => {
  const actionPath = path.resolve(__dirname, '../action.yml');
  let actionConfig: any;
  
  beforeAll(() => {
    // Verify action.yml exists and parse it
    expect(fs.existsSync(actionPath)).toBe(true);
    const actionContent = fs.readFileSync(actionPath, 'utf8');
    actionConfig = yaml.parse(actionContent);
  });

  describe('Basic Action Validation', () => {
    test('should have valid action.yml structure', () => {
      expect(actionConfig).toHaveProperty('name');
      expect(actionConfig).toHaveProperty('description');
      expect(actionConfig).toHaveProperty('inputs');
      expect(actionConfig).toHaveProperty('outputs');
      expect(actionConfig).toHaveProperty('runs');
      expect(actionConfig.runs.using).toBe('composite');
    });

    test('should have required inputs defined', () => {
      expect(actionConfig.inputs).toHaveProperty('vsce-pat');
      expect(actionConfig.inputs['vsce-pat'].required).toBe(true);
    });

    test('should have expected outputs defined', () => {
      const expectedOutputs = ['version', 'vsix-path', 'release-url'];
      expectedOutputs.forEach(output => {
        expect(actionConfig.outputs).toHaveProperty(output);
        expect(actionConfig.outputs[output]).toHaveProperty('description');
        expect(actionConfig.outputs[output]).toHaveProperty('value');
      });
    });

    test('should have proper branding configuration', () => {
      expect(actionConfig.branding).toHaveProperty('icon');
      expect(actionConfig.branding).toHaveProperty('color');
      expect(actionConfig.branding.icon).toBe('package');
      expect(actionConfig.branding.color).toBe('blue');
    });
  });

  describe('Input Configuration Validation', () => {
    test('should have all expected optional inputs with defaults', () => {
      const expectedInputsWithDefaults = {
        'node-version': '18',
        'package-manager': 'npm',
        'pre-publish-script': '',
        'lint-script': 'npm run lint',
        'test-script': 'npm run test',
        'compile-script': 'npm run compile',
        'package-script': 'npm run package',
        'publish-script': 'npm run publish',
        'skip-tests': 'false',
        'skip-lint': 'false',
        'version-bump-type': 'auto',
        'create-github-release': 'true',
        'upload-vsix-artifact': 'true',
        'vsix-retention-days': '30',
        'working-directory': '.'
      };

      Object.entries(expectedInputsWithDefaults).forEach(([input, expectedDefault]) => {
        expect(actionConfig.inputs).toHaveProperty(input);
        expect(actionConfig.inputs[input].required).toBe(false);
        expect(actionConfig.inputs[input].default).toBe(expectedDefault);
      });
    });

    test('should have proper input descriptions', () => {
      Object.keys(actionConfig.inputs).forEach(input => {
        expect(actionConfig.inputs[input]).toHaveProperty('description');
        expect(actionConfig.inputs[input].description).toBeTruthy();
        expect(typeof actionConfig.inputs[input].description).toBe('string');
      });
    });
  });

  describe('Composite Action Steps Validation', () => {
    test('should have all required steps', () => {
      const expectedSteps = [
        'Setup Node.js',
        'Install dependencies',
        'Run pre-publish script',
        'Lint code',
        'Compile TypeScript',
        'Run tests',
        'Determine version bump type',
        'Version bump',
        'Get new version',
        'Package extension',
        'Upload VSIX artifact',
        'Verify VSCE token',
        'Publish to VS Code Marketplace',
        'Configure Git for tagging',
        'Commit version bump and create tag',
        'Create GitHub Release'
      ];

      const stepNames = actionConfig.runs.steps.map((step: any) => step.name);
      
      expectedSteps.forEach(expectedStep => {
        expect(stepNames).toContain(expectedStep);
      });
    });

    test('should have proper conditional steps', () => {
      const conditionalSteps = actionConfig.runs.steps.filter((step: any) => step.if);
      
      // Verify that conditional steps exist
      expect(conditionalSteps.length).toBeGreaterThan(0);
      
      // Check specific conditional steps
      const prePublishStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Run pre-publish script'
      );
      expect(prePublishStep.if).toBe("inputs.pre-publish-script != ''");

      const lintStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Lint code'
      );
      expect(lintStep.if).toBe("inputs.skip-lint != 'true'");

      const testStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Run tests'
      );
      expect(testStep.if).toBe("inputs.skip-tests != 'true'");
    });

    test('should use proper shell for all steps', () => {
      actionConfig.runs.steps.forEach((step: any) => {
        if (step.shell) {
          expect(step.shell).toBe('bash');
        }
      });
    });

    test('should have proper working directory configuration', () => {
      const stepsWithWorkingDir = actionConfig.runs.steps.filter((step: any) => 
        step['working-directory']
      );
      
      stepsWithWorkingDir.forEach((step: any) => {
        expect(step['working-directory']).toBe('${{ inputs.working-directory }}');
      });
    });
  });

  describe('Version Detection Logic Validation', () => {
    test('should have version bump detection step', () => {
      const versionDetectionStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Determine version bump type'
      );

      expect(versionDetectionStep).toBeDefined();
      expect(versionDetectionStep.id).toBe('version-type');
      expect(versionDetectionStep.if).toBe("inputs.version-bump-type == 'auto'");
    });

    test('should have version bump step with proper logic', () => {
      const versionBumpStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Version bump'
      );

      expect(versionBumpStep).toBeDefined();
      expect(versionBumpStep.run).toContain('if [ "${{ inputs.version-bump-type }}" = "auto" ]');
      expect(versionBumpStep.run).toContain('npm version $VERSION_TYPE --no-git-tag-version');
      expect(versionBumpStep.run).toContain('yarn version --$VERSION_TYPE --no-git-tag-version');
      expect(versionBumpStep.run).toContain('pnpm version $VERSION_TYPE --no-git-tag-version');
    });
  });

  describe('Package Manager Support Validation', () => {
    test('should support multiple package managers in dependency installation', () => {
      const installStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Install dependencies'
      );

      expect(installStep.run).toContain('npm ci');
      expect(installStep.run).toContain('yarn install --frozen-lockfile');
      expect(installStep.run).toContain('pnpm install --frozen-lockfile');
      expect(installStep.run).toContain('Unsupported package manager');
    });

    test('should have proper Node.js setup with caching', () => {
      const nodeSetupStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Setup Node.js'
      );

      expect(nodeSetupStep.uses).toBe('actions/setup-node@v4');
      expect(nodeSetupStep.with['node-version']).toBe('${{ inputs.node-version }}');
      expect(nodeSetupStep.with.cache).toBe('${{ inputs.package-manager }}');
    });
  });

  describe('Output Generation Validation', () => {
    test('should have proper output step configurations', () => {
      const getVersionStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Get new version'
      );
      expect(getVersionStep.id).toBe('get-version');

      const packageStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Package extension'
      );
      expect(packageStep.id).toBe('package');

      const releaseStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Create GitHub Release'
      );
      expect(releaseStep.id).toBe('create-release');
    });

    test('should have proper output references', () => {
      expect(actionConfig.outputs.version.value).toBe('${{ steps.get-version.outputs.version }}');
      expect(actionConfig.outputs['vsix-path'].value).toBe('${{ steps.package.outputs.vsix-path }}');
      expect(actionConfig.outputs['release-url'].value).toBe('${{ steps.create-release.outputs.html_url }}');
    });
  });

  describe('Error Handling and Validation', () => {
    test('should have VSCE token verification', () => {
      const verifyTokenStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Verify VSCE token'
      );

      expect(verifyTokenStep).toBeDefined();
      expect(verifyTokenStep.run).toContain('if [ -z "${{ inputs.vsce-pat }}" ]');
      expect(verifyTokenStep.run).toContain('exit 1');
    });

    test('should have continue-on-error for optional steps', () => {
      const lintStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Lint code'
      );
      expect(lintStep['continue-on-error']).toBe(true);

      const testStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Run tests'
      );
      expect(testStep['continue-on-error']).toBe(true);
    });
  });

  describe('GitHub Integration Validation', () => {
    test('should have proper artifact upload configuration', () => {
      const uploadStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Upload VSIX artifact'
      );

      expect(uploadStep.uses).toBe('actions/upload-artifact@v4');
      expect(uploadStep.if).toBe("inputs.upload-vsix-artifact == 'true'");
      expect(uploadStep.with.name).toBe('extension-vsix-${{ steps.get-version.outputs.version }}');
      expect(uploadStep.with.path).toBe('${{ inputs.working-directory }}/*.vsix');
    });

    test('should have proper GitHub release configuration', () => {
      const releaseStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Create GitHub Release'
      );

      expect(releaseStep.uses).toBe('actions/create-release@v1');
      expect(releaseStep.if).toBe("inputs.create-github-release == 'true'");
      expect(releaseStep.env.GITHUB_TOKEN).toBe('${{ github.token }}');
    });

    test('should have proper git configuration and tagging', () => {
      const gitConfigStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Configure Git for tagging'
      );

      expect(gitConfigStep.run).toContain('git config --local user.email "action@github.com"');
      expect(gitConfigStep.run).toContain('git config --local user.name "GitHub Action"');

      const tagStep = actionConfig.runs.steps.find((step: any) => 
        step.name === 'Commit version bump and create tag'
      );

      expect(tagStep.run).toContain('git add package.json');
      expect(tagStep.run).toContain('git commit -m "chore: bump version');
      expect(tagStep.run).toContain('git tag "v${{ steps.get-version.outputs.version }}"');
      expect(tagStep.run).toContain('git push origin HEAD');
    });
  });
});
