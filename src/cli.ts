#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GarbageCollector } from './core/garbage-collector.js';
import { formatBytes, formatPercentage } from './utils/format.js';
import { checkLimits, getUpgradeMessage } from './core/premium-features.js';
import { TodoReporter } from './reports/todo-report.js';
import type { ProjectAnalysis } from './core/garbage-collector.js';
import { createSafeFixCommand } from './cli-safe-fix.js';

const program = new Command();

program
  .name('vibesweep')
  .description('Sweep away AI-generated code waste and vibe coding artifacts 🧹')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze a project for AI-generated waste')
  .argument('<path>', 'Path to the project directory')
  .option('-p, --pattern <pattern>', 'File pattern to analyze', '**/*.{js,ts,jsx,tsx,py}')
  .option('-o, --output <format>', 'Output format (text, json)', 'text')
  .option('--todos', 'Include TODO/FIXME report')
  .option('--fix', 'Apply safe fixes automatically')
  .action(async (path, options) => {
    const spinner = ora('Analyzing project for AI-generated waste...').start();
    
    try {
      const gc = new GarbageCollector();
      const apiKey = process.env.VIBESWEEP_API_KEY;
      
      // Quick file count check
      const { glob } = await import('glob');
      const files = await glob(options.pattern || '**/*.{js,ts,jsx,tsx,py}', {
        cwd: path,
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
      });
      
      const limits = checkLimits(files.length, apiKey);
      if (!limits.allowed) {
        spinner.fail('File limit exceeded');
        console.log('\n' + limits.message);
        process.exit(1);
      }
      
      const analysis = await gc.analyzeProject(path, options.pattern, options.todos);
      
      spinner.succeed('Analysis complete!');
      
      if (options.output === 'json') {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        displayResults(analysis);
      }
      
      // Apply fixes if requested
      if (options.fix) {
        console.log('\n' + chalk.yellow('Applying safe fixes...'));
        const { SafeFixer } = await import('./safety/safe-fixer.js');
        const fixConfig = {
          projectRoot: path,
          dryRun: false,
          autoConfirm: true,
          maxFilesPerRun: 100,
          requireGitClean: false,
          requireBackup: true,
          validation: {
            runTests: false,
            runTypeCheck: false,
            runLinter: false
          },
          fixTypes: {
            consoleLogs: true,
            debuggerStatements: true,
            deadCode: true
          }
        };
        
        const fixer = new SafeFixer(fixConfig);
        const fixedFiles = analysis.topOffenders
          .filter(a => a.wasteScore > 10)
          .map(a => a.filePath);
          
        if (fixedFiles.length > 0) {
          const result = await fixer.runSafeFixes(fixedFiles);
          if (result.success) {
            console.log(chalk.green(`\n✅ Applied ${result.changesApplied} fixes to ${result.filesModified} files!`));
          } else {
            console.log(chalk.red('\n❌ Fix operation failed:'));
            result.errors.forEach(error => {
              console.log(chalk.red(`  • ${error}`));
            });
          }
        } else {
          console.log(chalk.green('\n✅ No files need fixing!'));
        }
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

type Analysis = ProjectAnalysis;

function displayResults(analysis: Analysis) {
  const output = [
    '',
    chalk.bold.cyan('🧹 Vibesweep Analysis Report'),
    chalk.gray('─'.repeat(50)),
    '',
    chalk.bold('📊 Overview:'),
    `  Total files analyzed: ${chalk.yellow(analysis.totalFiles)}`,
    `  Total size: ${chalk.yellow(formatBytes(analysis.totalSize))}`,
    `  Total waste: ${chalk.red(formatBytes(analysis.totalWaste))}`,
    `  Waste percentage: ${chalk.red(formatPercentage(analysis.wastePercentage))}`,
    '',
    chalk.bold('📈 Summary:'),
    `  Files with dead code: ${chalk.yellow(analysis.summary.deadCodeFiles)}`,
    `  Files with duplications: ${chalk.yellow(analysis.summary.duplicatedFiles)}`,
    `  AI-generated files: ${chalk.yellow(analysis.summary.aiGeneratedFiles)}`,
    '',
    chalk.bold('💰 Potential Savings:'),
    `  Lines of code: ${chalk.green(analysis.summary.estimatedSavings.lines.toLocaleString())}`,
    `  Disk space: ${chalk.green(formatBytes(analysis.summary.estimatedSavings.kilobytes * 1024))}`,
  ];

  if (analysis.topOffenders.length > 0) {
    output.push('', chalk.bold('🚨 Top Waste Offenders:'));
    
    analysis.topOffenders.slice(0, 5).forEach((file, index) => {
      output.push(
        '',
        `  ${index + 1}. ${chalk.yellow(file.filePath)}`,
        `     Waste Score: ${chalk.red(file.wasteScore + '%')}`,
        `     Dead Code: ${formatPercentage(file.deadCode.ratio * 100)}`,
        `     Duplication: ${formatPercentage(file.duplication.ratio * 100)}`,
        `     AI Score: ${file.aiPatterns.score}/100`
      );
      
      if (file.aiPatterns.patterns.length > 0) {
        output.push(`     Patterns: ${file.aiPatterns.patterns[0]}`);
      }
    });
  }
  
  output.push(
    '',
    chalk.gray('─'.repeat(50)),
    chalk.dim('Generated by Vibesweep v0.1.0')
  );
  
  console.log(output.join('\n'));
  
  // Show TODO report if requested
  if (analysis.todos && analysis.todos.length > 0) {
    const todoReporter = new TodoReporter();
    console.log(todoReporter.generateReport(analysis.todos));
  }
}

program
  .command('clean')
  .description('Interactively remove detected waste')
  .argument('<path>', 'Path to clean')
  .option('--dry-run', 'Show what would be removed without removing')
  .option('--force', 'Remove all waste without prompting')
  .option('--types <types>', 'Comma-separated types to clean (console,comments,dead-code,duplicates)', 'console,comments,dead-code')
  .action(async (path, options) => {
    const spinner = ora('Scanning for cleanable issues...').start();
    
    try {
      const gc = new GarbageCollector();
      const analysis = await gc.analyzeProject(path);
      
      spinner.succeed('Scan complete!');
      
      // Find files with waste
      const wastefulFiles = analysis.topOffenders.filter(f => f.wasteScore > 10);
      
      if (wastefulFiles.length === 0) {
        console.log(chalk.green('\n✨ No significant waste found!'));
        return;
      }
      
      console.log(chalk.bold(`\n🧹 Found ${wastefulFiles.length} files with cleanable issues:\n`));
      
      const { SafeFixer } = await import('./safety/safe-fixer.js');
      const { default: prompts } = await import('prompts');
      
      const typesToFix = options.types.split(',');
      const fixConfig = {
        projectRoot: path,
        dryRun: options.dryRun,
        autoConfirm: options.force,
        maxFilesPerRun: 1000,
        requireGitClean: false,
        requireBackup: !options.dryRun,
        validation: {
          runTests: false,
          runTypeCheck: false,
          runLinter: false
        },
        fixTypes: {
          consoleLogs: typesToFix.includes('console'),
          debuggerStatements: typesToFix.includes('debug'),
          deadCode: typesToFix.includes('dead-code')
        }
      };
      
      if (!options.force && !options.dryRun) {
        // Show preview of what will be cleaned
        let totalIssues = 0;
        wastefulFiles.forEach(file => {
          const issues = [];
          if (file.deadCode.unusedVariables.length > 0) {
            issues.push(`${file.deadCode.unusedVariables.length} unused variables`);
            totalIssues += file.deadCode.unusedVariables.length;
          }
          if (file.deadCode.unusedFunctions.length > 0) {
            issues.push(`${file.deadCode.unusedFunctions.length} unused functions`);
            totalIssues += file.deadCode.unusedFunctions.length;
          }
          if (file.duplication.duplicateBlocks > 0) {
            issues.push(`${file.duplication.duplicateBlocks} duplicate blocks`);
            totalIssues += file.duplication.duplicateBlocks;
          }
          
          if (issues.length > 0) {
            console.log(`${chalk.yellow(file.filePath)}`);
            console.log(`  ${issues.join(', ')}`);
          }
        });
        
        console.log(chalk.dim(`\nTotal issues: ${totalIssues}`));
        
        const response = await prompts({
          type: 'confirm',
          name: 'proceed',
          message: 'Proceed with cleaning?',
          initial: true
        });
        
        if (!response.proceed) {
          console.log(chalk.yellow('\nOperation cancelled.'));
          return;
        }
      }
      
      const fixer = new SafeFixer(fixConfig);
      const filesToClean = wastefulFiles.map(f => f.filePath);
      const result = await fixer.runSafeFixes(filesToClean);
      
      if (result.success) {
        if (result.filesModified > 0) {
          console.log(chalk.green(`\n✅ Successfully cleaned ${result.filesModified} files!`));
          console.log(chalk.green(`   Removed ${result.changesApplied} issues`));
          
          if (!options.dryRun) {
            console.log(chalk.dim('\nRun `git diff` to review changes'));
          }
        } else {
          console.log(chalk.green('\n✅ No automated fixes available for the detected issues.'));
        }
      } else {
        console.log(chalk.red('\n❌ Clean operation failed:'));
        result.errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`));
        });
      }
    } catch (error) {
      spinner.fail('Clean operation failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate detailed PDF report (Pro feature)')
  .argument('<path>', 'Path to analyze')
  .action(async (path) => {
    console.log('\n' + getUpgradeMessage('report'));
  });

// Add the safe fix command
program.addCommand(createSafeFixCommand());

program
  .command('todos')
  .description('Extract all TODO/FIXME comments')
  .argument('<path>', 'Path to analyze')
  .option('-p, --pattern <pattern>', 'File pattern to analyze', '**/*.{js,ts,jsx,tsx,py}')
  .option('--markdown', 'Output as markdown')
  .action(async (path, options) => {
    const spinner = ora('Scanning for TODOs and FIXMEs...').start();
    
    try {
      const gc = new GarbageCollector();
      const analysis = await gc.analyzeProject(path, options.pattern, true);
      
      spinner.succeed('Scan complete!');
      
      if (!analysis.todos || analysis.todos.length === 0) {
        console.log('\n✨ No TODOs or FIXMEs found!\n');
        return;
      }
      
      const todoReporter = new TodoReporter();
      if (options.markdown) {
        console.log(todoReporter.generateMarkdown(analysis.todos));
      } else {
        console.log(todoReporter.generateReport(analysis.todos));
      }
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();