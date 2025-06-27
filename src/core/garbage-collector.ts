import { readFileSync } from 'fs';
import { glob } from 'glob';
import { DeadCodeAnalyzer } from '../analyzers/dead-code.js';
import { DuplicationAnalyzer } from '../analyzers/duplication.js';
import { AIPatternAnalyzer } from '../analyzers/ai-patterns.js';
import { TodoReporter, TodoItem } from '../reports/todo-report.js';

export interface FileAnalysis {
  filePath: string;
  fileSize: number;
  wasteScore: number;
  deadCode: {
    ratio: number;
    unusedVariables: string[];
    unusedFunctions: string[];
    unusedImports: string[];
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
}

export interface ProjectAnalysis {
  totalFiles: number;
  totalSize: number;
  totalWaste: number;
  wastePercentage: number;
  topOffenders: FileAnalysis[];
  summary: {
    deadCodeFiles: number;
    duplicatedFiles: number;
    aiGeneratedFiles: number;
    estimatedSavings: {
      lines: number;
      kilobytes: number;
    };
  };
  todos?: TodoItem[];
}

export class GarbageCollector {
  private deadCodeAnalyzer = new DeadCodeAnalyzer();
  private duplicationAnalyzer = new DuplicationAnalyzer();
  private aiPatternAnalyzer = new AIPatternAnalyzer();
  private todoReporter = new TodoReporter();

  async analyzeProject(projectPath: string, pattern: string = '**/*.{js,ts,jsx,tsx,py}', includeTodos: boolean = false): Promise<ProjectAnalysis> {
    const files = await glob(pattern, { 
      cwd: projectPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**']
    });

    const analyses: FileAnalysis[] = [];
    const allTodos: TodoItem[] = [];
    let totalSize = 0;
    let totalWaste = 0;

    for (const file of files) {
      const filePath = `${projectPath}/${file}`;
      try {
        const analysis = this.analyzeFile(filePath);
        if (analysis) {
          analyses.push(analysis);
          totalSize += analysis.fileSize;
          totalWaste += analysis.fileSize * (analysis.wasteScore / 100);
        }
        
        // Extract TODOs if requested
        if (includeTodos) {
          const content = readFileSync(filePath, 'utf-8');
          const todos = this.todoReporter.extractTodos(file, content);
          allTodos.push(...todos);
        }
      } catch (error) {
      }
    }

    analyses.sort((a, b) => b.wasteScore - a.wasteScore);

    const summary = this.calculateSummary(analyses);

    return {
      totalFiles: files.length,
      totalSize,
      totalWaste,
      wastePercentage: totalSize > 0 ? (totalWaste / totalSize) * 100 : 0,
      topOffenders: analyses.slice(0, 10),
      summary,
      todos: includeTodos ? allTodos : undefined
    };
  }

  private analyzeFile(filePath: string): FileAnalysis | null {
    try {
      const code = readFileSync(filePath, 'utf-8');
      const fileSize = Buffer.byteLength(code, 'utf-8');

      const deadCode = this.deadCodeAnalyzer.analyze(filePath);
      const duplication = this.duplicationAnalyzer.analyze(code);
      const aiPatterns = this.aiPatternAnalyzer.analyze(code);

      const wasteScore = this.calculateWasteScore(deadCode, duplication, aiPatterns);

      return {
        filePath,
        fileSize,
        wasteScore,
        deadCode: {
          ratio: deadCode.deadCodeRatio,
          unusedVariables: deadCode.unusedVariables,
          unusedFunctions: deadCode.unusedFunctions,
          unusedImports: deadCode.unusedImports
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
        }
      };
    } catch (error) {
      return null;
    }
  }

  private calculateWasteScore(
    deadCode: ReturnType<DeadCodeAnalyzer['analyze']>,
    duplication: ReturnType<DuplicationAnalyzer['analyze']>,
    aiPatterns: ReturnType<AIPatternAnalyzer['analyze']>
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

    return {
      deadCodeFiles,
      duplicatedFiles,
      aiGeneratedFiles,
      estimatedSavings: {
        lines: estimatedLinesSaved,
        kilobytes: Math.round(estimatedKBSaved)
      }
    };
  }
}