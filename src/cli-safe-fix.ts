import { Command } from 'commander';
import chalk from 'chalk';
import { glob } from 'glob';
import path from 'path';
import { SafeFixer, SafeFixConfig } from './safety/safe-fixer.js';
import { logger } from './utils/logger.js';

export function createSafeFixCommand(): Command {
  const fix = new Command('fix')
    .description('Safely fix issues in your codebase (BETA)')
    .argument('[path]', 'Path to analyze', '.')
    .option('--dry-run', 'Show what would be fixed without making changes', false)
    .option('--no-git-check', 'Skip git clean working tree check')
    .option('--no-backup', 'Skip creating file backups (not recommended)')
    .option('--no-validation', 'Skip running tests/lint after fixes')
    .option('--auto-confirm', 'Skip confirmation prompts', false)
    .option('--max-files <number>', 'Maximum files to process per run', '10')
    .option('--include <patterns>', 'Glob patterns to include', '**/*.{js,jsx,ts,tsx}')
    .option('--exclude <patterns>', 'Glob patterns to exclude', '**/node_modules/**,**/dist/**,**/build/**')
    .action(async (targetPath: string, options) => {
      try {
        console.log(chalk.bold('\n🧹 Vibesweep Safe Fix (BETA)\n'));
        console.log(chalk.yellow('⚠️  This feature is in beta. Always review changes before committing.\n'));

        const projectRoot = path.resolve(targetPath);
        
        // Find files to process
        const includePatterns = options.include.split(',');
        const excludePatterns = options.exclude.split(',');
        
        logger.info('Scanning for files...');
        
        const files: string[] = [];
        for (const pattern of includePatterns) {
          const matches = await glob(pattern, {
            cwd: projectRoot,
            ignore: excludePatterns,
            absolute: true
          });
          files.push(...matches);
        }

        logger.info(`Found ${files.length} files to analyze`);

        if (files.length === 0) {
          logger.warn('No files found matching the specified patterns');
          return;
        }

        // Configure safe fixer
        const config: SafeFixConfig = {
          projectRoot,
          dryRun: options.dryRun,
          autoConfirm: options.autoConfirm,
          maxFilesPerRun: parseInt(options.maxFiles, 10),
          requireGitClean: options.gitCheck,
          requireBackup: options.backup,
          validation: options.validation ? {
            runTests: true,
            runTypeCheck: true,
            runLinter: true
          } : {
            runTests: false,
            runTypeCheck: false,
            runLinter: false
          },
          fixTypes: {
            consoleLogs: true,
            debuggerStatements: false, // Coming soon
            deadCode: false // Coming soon
          }
        };

        // Show current configuration
        console.log(chalk.dim('Configuration:'));
        console.log(chalk.dim(`  • Dry run: ${config.dryRun}`));
        console.log(chalk.dim(`  • Git check: ${config.requireGitClean}`));
        console.log(chalk.dim(`  • Backup: ${config.requireBackup}`));
        console.log(chalk.dim(`  • Validation: ${options.validation}`));
        console.log(chalk.dim(`  • Max files: ${config.maxFilesPerRun}`));
        console.log(chalk.dim(`  • Fix types: console.log removal\n`));

        // Run safe fixes
        const fixer = new SafeFixer(config);
        const result = await fixer.runSafeFixes(files);

        // Show results
        if (result.success) {
          if (result.filesModified > 0) {
            console.log(chalk.green(`\n✅ Successfully applied ${result.changesApplied} fixes to ${result.filesModified} files!`));
            
            if (result.backupId) {
              console.log(chalk.dim(`\nBackup ID: ${result.backupId}`));
            }
          } else {
            console.log(chalk.green('\n✅ No fixes needed - your code is already clean!'));
          }
        } else {
          console.log(chalk.red('\n❌ Fix operation failed:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  • ${error}`));
          });
        }

        // Show next steps
        if (!config.dryRun && result.filesModified > 0) {
          console.log(chalk.bold('\n📋 Next steps:'));
          console.log('  1. Review the changes with: git diff');
          console.log('  2. Run your tests to ensure everything works');
          console.log('  3. Commit the changes when satisfied');
        }

      } catch (error: any) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
      }
    });

  return fix;
}