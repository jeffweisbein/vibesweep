import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { execSync } from 'child_process';
import { GitSafety } from './git-safety.js';
import { BackupSystem, BackupHandle } from './backup-system.js';
import { ChangePreview, Change, ChangeSet } from './change-preview.js';
import { ValidationSuite, ValidationConfig } from './validation-suite.js';
import { ConsoleLogFixer } from '../fixers/console-log-fixer.js';
import { logger } from '../utils/logger.js';
import { SafeFixConfigLoader, SafeFixUserConfig, FixTypeConfig } from '../config/safe-fix-config.js';

export interface SafeFixConfig {
  projectRoot: string;
  dryRun: boolean;
  autoConfirm: boolean;
  maxFilesPerRun: number;
  requireGitClean: boolean;
  requireBackup: boolean;
  validation: ValidationConfig;
  fixTypes: {
    consoleLogs: boolean;
    debuggerStatements: boolean;
    deadCode: boolean;
  };
}

export interface SafeFixResult {
  success: boolean;
  filesModified: number;
  changesApplied: number;
  backupId?: string;
  errors: string[];
}

export class SafeFixer {
  private config: SafeFixConfig;
  private userConfig!: Required<SafeFixUserConfig>; // Will be initialized in initialize()
  private gitSafety: GitSafety;
  private backupSystem: BackupSystem;
  private changePreview: ChangePreview;
  private validationSuite: ValidationSuite;

  constructor(config: SafeFixConfig) {
    this.config = config;
    this.gitSafety = new GitSafety(config.projectRoot);
    this.backupSystem = new BackupSystem();
    this.changePreview = new ChangePreview();
    this.validationSuite = new ValidationSuite(config.projectRoot, config.validation);
  }

  async initialize(): Promise<void> {
    // Load user configuration
    const loadedConfig = await SafeFixConfigLoader.load(this.config.projectRoot);
    this.userConfig = SafeFixConfigLoader.merge(loadedConfig);
  }

  async runSafeFixes(targetFiles: string[]): Promise<SafeFixResult> {
    const result: SafeFixResult = {
      success: false,
      filesModified: 0,
      changesApplied: 0,
      errors: []
    };

    try {
      // Initialize and load configuration
      await this.initialize();
      // Phase 1: Pre-flight checks
      await this.performPreFlightChecks();

      // Phase 2: Collect all fixes
      const spinner = ora('Analyzing files for safe fixes...').start();
      const changeSet = await this.collectFixes(targetFiles);
      spinner.succeed(`Found ${changeSet.summary.totalChanges} potential fixes in ${changeSet.summary.totalFiles} files`);

      if (changeSet.changes.length === 0) {
        logger.info('No fixes needed - your code is clean! 🎉');
        result.success = true;
        return result;
      }

      // Phase 3: Show preview and get confirmation
      const decision = await this.changePreview.showInteractive(changeSet);
      
      if (decision === 'reject' || decision === 'skip') {
        logger.info('Operation cancelled by user');
        result.success = true;
        return result;
      }

      let finalChangeSet = changeSet;
      if (decision === 'partial') {
        finalChangeSet = await this.changePreview.selectChanges(changeSet);
      }

      if (finalChangeSet.changes.length === 0) {
        logger.info('No changes selected');
        result.success = true;
        return result;
      }

      // Phase 4: Create backup
      let backup: BackupHandle | undefined;
      if (this.config.requireBackup && !this.config.dryRun) {
        const filesToBackup = [...new Set(finalChangeSet.changes.map(c => c.file))];
        backup = await this.backupSystem.createBackup(filesToBackup);
        result.backupId = backup.id;
      }

      // Phase 5: Apply fixes
      if (this.config.dryRun) {
        logger.info(chalk.yellow('\n🔍 DRY RUN MODE - No files will be modified\n'));
        this.showDryRunSummary(finalChangeSet);
      } else {
        await this.applyFixes(finalChangeSet);
        result.filesModified = finalChangeSet.summary.totalFiles;
        result.changesApplied = finalChangeSet.changes.length;
      }

      // Phase 6: Run validation
      if (!this.config.dryRun && this.config.validation) {
        const validationSpinner = ora('Running validation suite...').start();
        const validationResult = await this.validationSuite.run();
        
        if (!validationResult.success) {
          validationSpinner.fail('Validation failed!');
          console.log(this.validationSuite.formatResults(validationResult));
          
          // Rollback if validation fails
          if (backup) {
            const rollbackSpinner = ora('Rolling back changes...').start();
            await this.backupSystem.restore(backup);
            rollbackSpinner.succeed('Changes rolled back successfully');
            result.errors.push('Validation failed - changes rolled back');
            return result;
          }
        } else {
          validationSpinner.succeed('All validation checks passed!');
        }
      }

      // Phase 7: Cleanup and commit
      if (!this.config.dryRun && backup) {
        await this.backupSystem.cleanup(backup);
      }

      result.success = true;
      
      if (!this.config.dryRun && this.gitSafety.isGitRepository()) {
        const commitResponse = await prompts({
          type: 'confirm',
          name: 'commit',
          message: 'Would you like to commit these changes?',
          initial: true
        });

        if (commitResponse.commit) {
          await this.commitChanges(finalChangeSet);
        }
      }

    } catch (error: any) {
      result.errors.push(error.message);
      logger.error(`Fix operation failed: ${error.message}`);
    }

    return result;
  }

  private async performPreFlightChecks(): Promise<void> {
    logger.info('Performing pre-flight checks...');

    // Check git status
    if (this.config.requireGitClean && this.gitSafety.isGitRepository()) {
      this.gitSafety.requireCleanWorkingTree();
      logger.success('✓ Git working tree is clean');
      
      // Create backup branch
      const backupBranch = this.gitSafety.createBackupBranch();
      logger.success(`✓ Created backup branch: ${backupBranch}`);
    }

    // Initialize backup system
    await this.backupSystem.initialize();
    logger.success('✓ Backup system initialized');

    // Run initial validation to ensure we start from a good state
    if (this.config.validation) {
      const validationResult = await this.validationSuite.run();
      if (!validationResult.success && !this.config.autoConfirm) {
        console.log(this.validationSuite.formatResults(validationResult));
        
        const continueResponse = await prompts({
          type: 'confirm',
          name: 'continue',
          message: 'Validation checks are failing. Continue anyway?',
          initial: false
        });

        if (!continueResponse.continue) {
          throw new Error('Aborted due to failing validation checks');
        }
      }
    }
  }

  private async collectFixes(files: string[]): Promise<ChangeSet> {
    const allChanges: Change[] = [];

    // Filter out whitelisted files
    const filteredFiles = files.filter(file => 
      !SafeFixConfigLoader.shouldSkipFile(file, this.userConfig.whitelist)
    );

    // Limit files per run
    const filesToProcess = filteredFiles.slice(0, this.config.maxFilesPerRun);

    // Collect console.log fixes
    const categories = this.userConfig.fixes.categories as Record<string, FixTypeConfig>;
    if (this.config.fixTypes.consoleLogs && categories['console-logs'].enabled) {
      const fixer = new ConsoleLogFixer(this.userConfig.whitelist);
      
      for (const file of filesToProcess) {
        // Skip non-JS/TS files
        if (!/\.[jt]sx?$/.test(file)) continue;
        
        const fixes = await fixer.findConsoleLogStatements(file);
        if (fixes.length > 0) {
          const changes = await fixer.removeConsoleLogs(file, fixes);
          allChanges.push(...changes);
        }
      }
    }

    // TODO: Add more fix types (debugger statements, etc.)

    return {
      changes: allChanges,
      summary: this.calculateSummary(allChanges)
    };
  }

  private calculateSummary(changes: Change[]) {
    const files = new Set(changes.map(c => c.file));
    const changesByType: Record<string, number> = {};
    
    for (const change of changes) {
      const type = this.getChangeType(change);
      changesByType[type] = (changesByType[type] || 0) + 1;
    }
    
    return {
      totalFiles: files.size,
      totalChanges: changes.length,
      changesByType
    };
  }

  private getChangeType(change: Change): string {
    if (change.description.includes('console.')) return 'console.log';
    if (change.description.includes('debugger')) return 'debugger';
    return 'other';
  }

  private showDryRunSummary(changeSet: ChangeSet): void {
    console.log(chalk.bold('\nChanges that would be made:\n'));
    
    const fileGroups = new Map<string, Change[]>();
    for (const change of changeSet.changes) {
      if (!fileGroups.has(change.file)) {
        fileGroups.set(change.file, []);
      }
      fileGroups.get(change.file)!.push(change);
    }

    for (const [file, changes] of fileGroups) {
      console.log(chalk.cyan(file));
      for (const change of changes) {
        console.log(`  Line ${change.line}: ${change.description}`);
      }
      console.log();
    }
  }

  private async applyFixes(changeSet: ChangeSet): Promise<void> {
    const fileGroups = new Map<string, Change[]>();
    
    // Group changes by file
    for (const change of changeSet.changes) {
      if (!fileGroups.has(change.file)) {
        fileGroups.set(change.file, []);
      }
      fileGroups.get(change.file)!.push(change);
    }

    // Apply changes to each file
    for (const [filePath, changes] of fileGroups) {
      await this.applyChangesToFile(filePath, changes);
    }

    logger.success(`✓ Applied ${changeSet.changes.length} fixes to ${fileGroups.size} files`);
  }

  private async applyChangesToFile(filePath: string, changes: Change[]): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Sort changes by line number in reverse order
    const sortedChanges = [...changes].sort((a, b) => b.line - a.line);
    
    for (const change of sortedChanges) {
      const lineIndex = change.line - 1;
      
      switch (change.type) {
        case 'remove':
          lines.splice(lineIndex, 1);
          break;
        case 'replace':
          if (change.newContent !== undefined) {
            lines[lineIndex] = change.newContent;
          }
          break;
        case 'add':
          if (change.newContent !== undefined) {
            lines.splice(lineIndex + 1, 0, change.newContent);
          }
          break;
      }
    }
    
    const newContent = lines.join('\n');
    await fs.writeFile(filePath, newContent, 'utf-8');
  }

  private async commitChanges(changeSet: ChangeSet): Promise<void> {
    const { summary } = changeSet;
    let message = 'Remove development artifacts\n\n';
    
    if (summary.changesByType['console.log']) {
      message += `- Remove ${summary.changesByType['console.log']} console.log statements\n`;
    }
    if (summary.changesByType['debugger']) {
      message += `- Remove ${summary.changesByType['debugger']} debugger statements\n`;
    }
    
    message += '\n🤖 Fixed by Vibesweep';

    try {
      execSync('git add -A', { cwd: this.config.projectRoot });
      execSync(`git commit -m "${message}"`, { cwd: this.config.projectRoot });
      logger.success('✓ Changes committed successfully');
    } catch (error) {
      logger.error('Failed to commit changes - you can commit manually');
    }
  }
}