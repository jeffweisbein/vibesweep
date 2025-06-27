import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { DeadCodeAnalyzer } from '../analyzers/dead-code-enhanced.js';
import { DuplicationAnalyzer } from '../analyzers/duplication.js';
import { AIPatternAnalyzer } from '../analyzers/ai-patterns.js';
import { TodoReporter, TodoItem } from '../reports/todo-report.js';
import path from 'path';

export interface LocationInfo {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface ActionableIssue {
  file: string;
  type: 'dead-code' | 'duplication' | 'ai-pattern';
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: LocationInfo;
  fix?: {
    action: 'delete' | 'refactor' | 'merge';
    lines?: number[];
    suggestion?: string;
  };
}

export interface FileAnalysis {
  filePath: string;
  fileSize: number;
  wasteScore: number;
  deadCode: {
    ratio: number;
    unusedVariables: string[];
    unusedFunctions: string[];
    unusedImports: string[];
    locations?: any[];
  };
  duplication: {
    ratio: number;
    copyPasteScore: number;
    duplicateBlocks: number;
  };
  aiPatterns: {
    score: number;
    patterns: string[];
    overEngineering: number;
  };
  actionableIssues: ActionableIssue[];
}

export interface ProjectAnalysis {
  totalFiles: number;
  totalSize: number;
  totalWaste: number;
  wastePercentage: number;
  topOffenders: FileAnalysis[];
  actionableIssues: ActionableIssue[];
  summary: {
    deadCodeFiles: number;
    duplicatedFiles: number;
    aiGeneratedFiles: number;
    estimatedSavings: {
      lines: number;
      kilobytes: number;
      monthlyDollars: number;
    };
  };
  todos?: TodoItem[];
}

export class GarbageCollectorEnhanced {
  private deadCodeAnalyzer = new DeadCodeAnalyzer();
  private duplicationAnalyzer = new DuplicationAnalyzer();
  private aiPatternAnalyzer = new AIPatternAnalyzer();
  private todoReporter = new TodoReporter();

  async analyzeProject(
    projectPath: string, 
    pattern: string = '**/*.{js,ts,jsx,tsx,py}',
    options: {
      includeTodos?: boolean;
      outputFormat?: 'console' | 'json' | 'markdown';
      outputFile?: string;
      fix?: boolean;
    } = {}
  ): Promise<ProjectAnalysis> {
    const files = await glob(pattern, { 
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', 'coverage/**']
    });

    const analyses: FileAnalysis[] = [];
    const allTodos: TodoItem[] = [];
    const allActionableIssues: ActionableIssue[] = [];
    let totalSize = 0;
    let totalWaste = 0;

    for (const file of files) {
      const filePath = `${projectPath}/${file}`;
      try {
        const analysis = this.analyzeFile(filePath, file);
        if (analysis) {
          analyses.push(analysis);
          totalSize += analysis.fileSize;
          totalWaste += analysis.fileSize * (analysis.wasteScore / 100);
          allActionableIssues.push(...analysis.actionableIssues);
        }
        
        if (options.includeTodos) {
          const content = readFileSync(filePath, 'utf-8');
          const todos = this.todoReporter.extractTodos(file, content);
          allTodos.push(...todos);
        }
      } catch (error) {
        // Skip files that can't be analyzed
      }
    }

    analyses.sort((a, b) => b.wasteScore - a.wasteScore);
    allActionableIssues.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const summary = this.calculateSummary(analyses);

    const result: ProjectAnalysis = {
      totalFiles: files.length,
      totalSize,
      totalWaste,
      wastePercentage: totalSize > 0 ? (totalWaste / totalSize) * 100 : 0,
      topOffenders: analyses.slice(0, 10),
      actionableIssues: allActionableIssues.slice(0, 50), // Top 50 issues
      summary,
      todos: options.includeTodos ? allTodos : undefined
    };

    // Handle output formats
    if (options.outputFormat === 'markdown' && options.outputFile) {
      this.exportMarkdown(result, options.outputFile);
    } else if (options.outputFormat === 'json' && options.outputFile) {
      writeFileSync(options.outputFile, JSON.stringify(result, null, 2));
    }

    // Handle --fix flag
    if (options.fix) {
      await this.applyFixes(result.actionableIssues.filter(i => i.fix?.action === 'delete'));
    }

    return result;
  }

  private analyzeFile(filePath: string, relativePath: string): FileAnalysis | null {
    try {
      const code = readFileSync(filePath, 'utf-8');
      const fileSize = Buffer.byteLength(code, 'utf-8');

      const deadCode = this.deadCodeAnalyzer.analyze(filePath);
      const duplication = this.duplicationAnalyzer.analyze(code);
      const aiPatterns = this.aiPatternAnalyzer.analyze(code);

      const wasteScore = this.calculateWasteScore(deadCode, duplication, aiPatterns);
      const actionableIssues = this.generateActionableIssues(
        relativePath, 
        deadCode, 
        duplication, 
        aiPatterns
      );

      return {
        filePath,
        fileSize,
        wasteScore,
        deadCode: {
          ratio: deadCode.deadCodeRatio,
          unusedVariables: deadCode.unusedVariables,
          unusedFunctions: deadCode.unusedFunctions,
          unusedImports: deadCode.unusedImports,
          locations: deadCode.locations
        },
        duplication: {
          ratio: duplication.duplicationRatio,
          copyPasteScore: duplication.copyPasteScore,
          duplicateBlocks: duplication.duplicateBlocks.length
        },
        aiPatterns: {
          score: aiPatterns.aiScore,
          patterns: aiPatterns.detectedPatterns,
          overEngineering: aiPatterns.overEngineering
        },
        actionableIssues
      };
    } catch (error) {
      return null;
    }
  }

  private generateActionableIssues(
    file: string,
    deadCode: any,
    duplication: any,
    aiPatterns: any
  ): ActionableIssue[] {
    const issues: ActionableIssue[] = [];

    // Dead code issues
    if (deadCode.locations) {
      deadCode.locations.forEach((item: any) => {
        issues.push({
          file,
          type: 'dead-code',
          severity: item.type === 'function' ? 'high' : 'medium',
          description: `Unused ${item.type}: ${item.name}`,
          location: item.location,
          fix: {
            action: 'delete',
            lines: [item.location.line],
            suggestion: `Remove unused ${item.type} '${item.name}'`
          }
        });
      });
    }

    // Duplication issues
    if (duplication.duplicateBlocks && duplication.duplicateBlocks.length > 0) {
      duplication.duplicateBlocks.slice(0, 5).forEach((block: any, idx: number) => {
        issues.push({
          file,
          type: 'duplication',
          severity: block.size > 50 ? 'high' : 'medium',
          description: `Duplicate code block (${block.size} characters)`,
          location: {
            line: Math.floor(block.start / 80) + 1, // Rough line estimate
            column: 0
          },
          fix: {
            action: 'refactor',
            suggestion: 'Extract to shared function'
          }
        });
      });
    }

    // AI pattern issues
    const highPriorityPatterns = ['console.log', 'debugger', 'TODO:', 'FIXME:'];
    aiPatterns.detectedPatterns.forEach((pattern: string) => {
      if (highPriorityPatterns.some(p => pattern.includes(p))) {
        issues.push({
          file,
          type: 'ai-pattern',
          severity: pattern.includes('debugger') ? 'high' : 'low',
          description: `AI pattern detected: ${pattern}`,
          location: { line: 1, column: 0 }, // Would need enhanced pattern detection for exact location
          fix: {
            action: 'delete',
            suggestion: `Remove ${pattern}`
          }
        });
      }
    });

    return issues;
  }

  private calculateWasteScore(
    deadCode: any,
    duplication: any,
    aiPatterns: any
  ): number {
    const weights = {
      deadCode: 0.35,
      duplication: 0.35,
      aiPatterns: 0.30
    };

    const score = 
      deadCode.deadCodeRatio * 100 * weights.deadCode +
      duplication.duplicationRatio * 100 * weights.duplication +
      aiPatterns.aiScore * weights.aiPatterns;

    return Math.min(100, Math.round(score));
  }

  private calculateSummary(analyses: FileAnalysis[]): ProjectAnalysis['summary'] {
    const deadCodeFiles = analyses.filter(a => a.deadCode.ratio > 0.1).length;
    const duplicatedFiles = analyses.filter(a => a.duplication.ratio > 0.15).length;
    const aiGeneratedFiles = analyses.filter(a => a.aiPatterns.score > 50).length;

    const estimatedLinesSaved = analyses.reduce((sum, a) => {
      const fileContent = readFileSync(a.filePath, 'utf-8');
      const lines = fileContent.split('\n').length;
      return sum + Math.round(lines * a.wasteScore / 100);
    }, 0);

    const estimatedKBSaved = analyses.reduce((sum, a) => 
      sum + (a.fileSize * a.wasteScore / 100) / 1024, 0
    );

    // Rough cloud compute cost estimate: $0.10 per GB per month
    const estimatedMonthlyDollars = (estimatedKBSaved / 1024 / 1024) * 0.10;

    return {
      deadCodeFiles,
      duplicatedFiles,
      aiGeneratedFiles,
      estimatedSavings: {
        lines: estimatedLinesSaved,
        kilobytes: Math.round(estimatedKBSaved),
        monthlyDollars: Math.round(estimatedMonthlyDollars * 100) / 100
      }
    };
  }

  private exportMarkdown(analysis: ProjectAnalysis, outputFile: string): void {
    const markdown = `# Vibesweep Analysis Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Files Analyzed**: ${analysis.totalFiles}
- **Total Waste**: ${analysis.totalWaste.toFixed(2)} KB (${analysis.wastePercentage.toFixed(1)}%)
- **Estimated Savings**: 
  - Lines: ${analysis.summary.estimatedSavings.lines.toLocaleString()}
  - Size: ${analysis.summary.estimatedSavings.kilobytes} KB
  - Monthly Cost: $${analysis.summary.estimatedSavings.monthlyDollars}

## Top Issues to Fix

${analysis.actionableIssues.slice(0, 20).map((issue, idx) => 
`${idx + 1}. **${issue.file}:${issue.location.line}** - ${issue.description}
   - Severity: ${issue.severity}
   - Action: ${issue.fix?.suggestion || 'Review needed'}
`).join('\n')}

## Top Offending Files

${analysis.topOffenders.slice(0, 10).map((file, idx) => 
`${idx + 1}. **${file.filePath}** - ${file.wasteScore}% waste
   - Dead code: ${file.deadCode.unusedVariables.length + file.deadCode.unusedFunctions.length + file.deadCode.unusedImports.length} items
   - Duplications: ${file.duplication.duplicateBlocks} blocks
   - AI patterns: ${file.aiPatterns.patterns.length} detected
`).join('\n')}

${analysis.todos ? `
## TODOs Extracted

${analysis.todos.slice(0, 20).map(todo => 
`- **${todo.priority}**: ${todo.message} (${todo.file}:${todo.line})`
).join('\n')}
` : ''}

---
*Generated by [Vibesweep](https://vibesweep.ai) - // TODO: delete this*
`;

    writeFileSync(outputFile, markdown);
  }

  private async applyFixes(deletableIssues: ActionableIssue[]): Promise<void> {
    console.log(`\n🔧 Applying ${deletableIssues.length} safe fixes...\n`);
    
    // Group by file
    const fileGroups = deletableIssues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, ActionableIssue[]>);

    // Apply fixes file by file
    for (const [file, issues] of Object.entries(fileGroups)) {
      console.log(`Fixing ${file}...`);
      // This would implement actual fix logic
      // For now, just logging what would be fixed
      issues.forEach(issue => {
        console.log(`  - Would ${issue.fix?.action} ${issue.description}`);
      });
    }
  }
}