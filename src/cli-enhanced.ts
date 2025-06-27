#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GarbageCollectorEnhanced } from './core/garbage-collector-enhanced.js';
import { formatBytes, formatPercentage } from './utils/format.js';
import { checkLimits, getUpgradeMessage } from './core/premium-features.js';
import { TodoReporter } from './reports/todo-report.js';
import type { ProjectAnalysis, ActionableIssue } from './core/garbage-collector-enhanced.js';

const program = new Command();

program
  .name('vibesweep')
  .description('Sweep away AI-generated code waste // TODO: delete this 🧹')
  .version('0.2.0');

program
  .command('analyze')
  .description('Analyze a project for AI-generated waste')
  .argument('<path>', 'Path to the project directory')
  .option('-p, --pattern <pattern>', 'File pattern to analyze', '**/*.{js,ts,jsx,tsx,py}')
  .option('-o, --output <file>', 'Export report to file (supports .json, .md)')
  .option('-f, --format <format>', 'Output format (console, json, markdown)', 'console')
  .option('--fix', 'Automatically fix safe issues (removes unused imports, variables)')
  .option('--todos', 'Include TODO/FIXME report')
  .option('--no-actionable', 'Skip actionable issues output')
  .action(async (path, options) => {
    const spinner = ora('Analyzing project for AI-generated waste...').start();
    
    try {
      const gc = new GarbageCollectorEnhanced();
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
      
      // Determine output format
      let outputFormat = options.format;
      if (options.output) {
        if (options.output.endsWith('.json')) outputFormat = 'json';
        else if (options.output.endsWith('.md')) outputFormat = 'markdown';
      }
      
      const analysis = await gc.analyzeProject(path, options.pattern, {
        includeTodos: options.todos,
        outputFormat: outputFormat as any,
        outputFile: options.output,
        fix: options.fix
      });
      
      spinner.succeed('Analysis complete!');
      
      if (outputFormat === 'console') {
        displayEnhancedResults(analysis, !options.noActionable);
      } else if (options.output) {
        console.log(chalk.green(`\n✅ Report exported to ${options.output}\n`));
      }
      
      if (options.fix) {
        console.log(chalk.yellow('\n🔧 Auto-fix completed! Review changes before committing.\n'));
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

function displayEnhancedResults(analysis: ProjectAnalysis, showActionable: boolean) {
  const output = [
    '',
    chalk.bold.magenta('🧹 Vibesweep Analysis Report'),
    chalk.gray('─'.repeat(60)),
    '',
    chalk.bold('📊 Overview:'),
    `  Total files analyzed: ${chalk.yellow(analysis.totalFiles)}`,
    `  Total size: ${chalk.yellow(formatBytes(analysis.totalSize))}`,
    `  Total waste detected: ${chalk.red.bold(formatBytes(analysis.totalWaste))} (${chalk.red.bold(formatPercentage(analysis.wastePercentage))})`,
    '',
    chalk.bold('📈 Impact Summary:'),
    `  Files with dead code: ${chalk.yellow(analysis.summary.deadCodeFiles)}`,
    `  Files with duplications: ${chalk.yellow(analysis.summary.duplicatedFiles)}`,
    `  AI-generated files: ${chalk.yellow(analysis.summary.aiGeneratedFiles)}`,
    '',
    chalk.bold('💰 Potential Savings:'),
    `  Lines of code: ${chalk.green.bold(analysis.summary.estimatedSavings.lines.toLocaleString())}`,
    `  Disk space: ${chalk.green.bold(formatBytes(analysis.summary.estimatedSavings.kilobytes * 1024))}`,
    `  Monthly cloud costs: ${chalk.green.bold('$' + analysis.summary.estimatedSavings.monthlyDollars)}`,
  ];

  // Show actionable issues
  if (showActionable && analysis.actionableIssues.length > 0) {
    output.push('', chalk.bold('🎯 Top Issues to Fix:'));
    
    const topIssues = analysis.actionableIssues.slice(0, 10);
    topIssues.forEach((issue, index) => {
      const severityColor = {
        high: chalk.red,
        medium: chalk.yellow,
        low: chalk.gray
      }[issue.severity];
      
      output.push(
        '',
        `  ${index + 1}. ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${chalk.cyan(issue.file)}:${issue.location.line}`,
        `     ${issue.description}`,
        `     ${chalk.dim('→ ' + (issue.fix?.suggestion || 'Manual review needed'))}`
      );
    });
    
    if (analysis.actionableIssues.length > 10) {
      output.push(
        '',
        chalk.dim(`  ... and ${analysis.actionableIssues.length - 10} more issues`)
      );
    }
    
    output.push(
      '',
      chalk.bold('💡 Quick Actions:'),
      `  • Run with ${chalk.cyan('--fix')} to auto-fix safe issues`,
      `  • Run with ${chalk.cyan('--output report.md')} for detailed report`,
      `  • Visit ${chalk.cyan('https://vibesweep.ai/dashboard')} to track progress`
    );
  }

  // Show top offending files
  if (analysis.topOffenders.length > 0) {
    output.push('', chalk.bold('🚨 Most Wasteful Files:'));
    
    analysis.topOffenders.slice(0, 5).forEach((file, index) => {
      output.push(
        '',
        `  ${index + 1}. ${chalk.yellow(file.filePath)}`,
        `     Waste Score: ${chalk.red.bold(file.wasteScore + '%')}`,
        `     Issues: ${file.deadCode.unusedVariables.length + file.deadCode.unusedFunctions.length + file.deadCode.unusedImports.length} dead code, ${file.duplication.duplicateBlocks} duplications`
      );
      
      if (file.aiPatterns.patterns.length > 0) {
        output.push(`     AI Patterns: ${file.aiPatterns.patterns.slice(0, 3).join(', ')}`);
      }
    });
  }
  
  output.push(
    '',
    chalk.gray('─'.repeat(60)),
    chalk.dim('vibesweep v0.2.0 • // TODO: delete this')
  );
  
  console.log(output.join('\n'));
  
  // Show TODO report if requested
  if (analysis.todos && analysis.todos.length > 0) {
    const todoReporter = new TodoReporter();
    console.log(todoReporter.generateReport(analysis.todos));
  }
}

// Helper function to display actionable issues grouped by type
function displayActionableIssues(issues: ActionableIssue[]) {
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = [];
    acc[issue.type].push(issue);
    return acc;
  }, {} as Record<string, ActionableIssue[]>);
  
  Object.entries(grouped).forEach(([type, typeIssues]) => {
    console.log(`\n${chalk.bold(type.toUpperCase())} (${typeIssues.length} issues):`);
    typeIssues.slice(0, 5).forEach((issue: ActionableIssue) => {
      console.log(`  ${issue.file}:${issue.location.line} - ${issue.description}`);
    });
  });
}

// Add dashboard command
program
  .command('dashboard')
  .description('Open web dashboard to track waste over time')
  .action(async () => {
    console.log(chalk.cyan('\n🌐 Opening Vibesweep Dashboard...\n'));
    console.log(`Visit: ${chalk.bold('https://vibesweep.ai/dashboard')}`);
    console.log(chalk.gray('\nNote: Dashboard requires Pro subscription ($49/mo)\n'));
  });

// Update clean command with actual functionality
program
  .command('clean')
  .description('Interactively remove detected waste')
  .argument('<path>', 'Path to clean')
  .option('--dry-run', 'Show what would be removed without removing')
  .option('--force', 'Skip confirmation prompts (dangerous!)')
  .action(async (path, options) => {
    if (!process.env.VIBESWEEP_API_KEY) {
      console.log('\n' + getUpgradeMessage('autoFix'));
      return;
    }
    
    const spinner = ora('Analyzing waste for removal...').start();
    
    try {
      const gc = new GarbageCollectorEnhanced();
      const analysis = await gc.analyzeProject(path, undefined, {
        fix: !options.dryRun
      });
      
      spinner.succeed('Analysis complete!');
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n🔍 DRY RUN - No files will be modified\n'));
      }
      
      console.log(`Found ${chalk.red(analysis.actionableIssues.length)} issues that can be cleaned`);
      
      if (!options.dryRun && !options.force) {
        console.log(chalk.yellow('\n⚠️  Use --force to apply changes without confirmation\n'));
      }
    } catch (error) {
      spinner.fail('Clean failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    }
  });

// Keep existing commands
program
  .command('todos')
  .description('Extract all TODO/FIXME comments')
  .argument('<path>', 'Path to analyze')
  .option('-p, --pattern <pattern>', 'File pattern to analyze', '**/*.{js,ts,jsx,tsx,py}')
  .option('--markdown', 'Output as markdown')
  .option('-o, --output <file>', 'Save to file')
  .action(async (path, options) => {
    const spinner = ora('Scanning for TODOs and FIXMEs...').start();
    
    try {
      const gc = new GarbageCollectorEnhanced();
      const analysis = await gc.analyzeProject(path, options.pattern, {
        includeTodos: true,
        outputFormat: options.markdown ? 'markdown' : 'console',
        outputFile: options.output
      });
      
      spinner.succeed('Scan complete!');
      
      if (!analysis.todos || analysis.todos.length === 0) {
        console.log('\n✨ No TODOs or FIXMEs found!\n');
        return;
      }
      
      const todoReporter = new TodoReporter();
      const output = options.markdown 
        ? todoReporter.generateMarkdown(analysis.todos)
        : todoReporter.generateReport(analysis.todos);
      
      if (options.output) {
        const { writeFileSync } = await import('fs');
        writeFileSync(options.output, output);
        console.log(chalk.green(`\n✅ TODOs exported to ${options.output}\n`));
      } else {
        console.log(output);
      }
    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();