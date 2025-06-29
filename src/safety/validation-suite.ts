import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface ValidationConfig {
  runTests: boolean;
  runTypeCheck: boolean;
  runLinter: boolean;
  testCommand?: string;
  typeCheckCommand?: string;
  lintCommand?: string;
  customCommands?: string[];
  timeout?: number; // milliseconds
}

export interface ValidationResult {
  success: boolean;
  passed: string[];
  failed: Array<{
    check: string;
    error: string;
    output?: string;
  }>;
  duration: number;
}

export class ValidationSuite {
  private projectRoot: string;
  private config: ValidationConfig;

  constructor(projectRoot: string, config: ValidationConfig) {
    this.projectRoot = projectRoot;
    this.config = {
      timeout: 60000, // 1 minute default
      ...config
    };
  }

  async detectCommands(): Promise<void> {
    // Try to auto-detect commands from package.json
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const scripts = packageJson.scripts || {};

      if (!this.config.testCommand) {
        this.config.testCommand = scripts.test || 'npm test';
      }

      if (!this.config.typeCheckCommand) {
        // Common type check commands
        if (scripts['type-check']) {
          this.config.typeCheckCommand = 'npm run type-check';
        } else if (scripts.typecheck) {
          this.config.typeCheckCommand = 'npm run typecheck';
        } else if (scripts.tsc) {
          this.config.typeCheckCommand = 'npm run tsc';
        } else if (packageJson.devDependencies?.typescript) {
          this.config.typeCheckCommand = 'npx tsc --noEmit';
        }
      }

      if (!this.config.lintCommand) {
        this.config.lintCommand = scripts.lint || 'npm run lint';
      }
    } catch (error) {
      logger.debug('Could not auto-detect commands from package.json');
    }
  }

  async run(): Promise<ValidationResult> {
    const startTime = Date.now();
    const passed: string[] = [];
    const failed: Array<{ check: string; error: string; output?: string }> = [];

    await this.detectCommands();

    // Run tests
    if (this.config.runTests && this.config.testCommand) {
      const result = await this.runCommand('Tests', this.config.testCommand);
      if (result.success) {
        passed.push('Tests');
      } else {
        failed.push(result);
      }
    }

    // Run type check
    if (this.config.runTypeCheck && this.config.typeCheckCommand) {
      const result = await this.runCommand('Type Check', this.config.typeCheckCommand);
      if (result.success) {
        passed.push('Type Check');
      } else {
        failed.push(result);
      }
    }

    // Run linter
    if (this.config.runLinter && this.config.lintCommand) {
      const result = await this.runCommand('Linter', this.config.lintCommand);
      if (result.success) {
        passed.push('Linter');
      } else {
        failed.push(result);
      }
    }

    // Run custom commands
    if (this.config.customCommands) {
      for (const command of this.config.customCommands) {
        const result = await this.runCommand(`Custom: ${command}`, command);
        if (result.success) {
          passed.push(`Custom: ${command}`);
        } else {
          failed.push(result);
        }
      }
    }

    const duration = Date.now() - startTime;

    return {
      success: failed.length === 0,
      passed,
      failed,
      duration
    };
  }

  private async runCommand(
    checkName: string,
    command: string
  ): Promise<{ success: boolean; check: string; error: string; output?: string }> {
    logger.info(`Running ${checkName}...`);

    try {
      const output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        timeout: this.config.timeout,
        stdio: 'pipe'
      });

      logger.success(`✓ ${checkName} passed`);
      return { success: true, check: checkName, error: '', output };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const output = error.stdout || error.output?.toString() || '';
      
      logger.error(`✗ ${checkName} failed`);
      
      return {
        success: false,
        check: checkName,
        error: errorMessage,
        output: output.slice(0, 1000) // Limit output length
      };
    }
  }

  formatResults(results: ValidationResult): string {
    let output = '\nValidation Results:\n';
    output += '═'.repeat(50) + '\n';

    if (results.passed.length > 0) {
      output += '\n✓ Passed:\n';
      results.passed.forEach(check => {
        output += `  • ${check}\n`;
      });
    }

    if (results.failed.length > 0) {
      output += '\n✗ Failed:\n';
      results.failed.forEach(({ check, error }) => {
        output += `  • ${check}: ${error.split('\n')[0]}\n`;
      });
    }

    output += `\nTotal time: ${(results.duration / 1000).toFixed(2)}s\n`;
    output += results.success ? '\n✅ All checks passed!\n' : '\n❌ Some checks failed!\n';

    return output;
  }
}