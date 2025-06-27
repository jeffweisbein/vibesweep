import { AI_CODE_PATTERNS, COMMON_AI_COMMENTS } from '../detectors/patterns.js';

export class AIPatternAnalyzer {
  analyze(code: string): {
    aiScore: number;
    detectedPatterns: string[];
    overEngineering: number;
    verbosity: number;
  } {
    const detectedPatterns: string[] = [];
    let patternScore = 0;

    const verboseComments = this.detectVerboseComments(code);
    if (verboseComments > 0) {
      detectedPatterns.push(`Verbose AI comments: ${verboseComments} instances`);
      patternScore += verboseComments * 2;
    }

    const placeholders = this.detectPlaceholders(code);
    if (placeholders > 0) {
      detectedPatterns.push(`Placeholder code: ${placeholders} instances`);
      patternScore += placeholders * 5;
    }

    const redundantTypes = this.detectRedundantTypes(code);
    if (redundantTypes > 0) {
      detectedPatterns.push(`Redundant 'any' types: ${redundantTypes} instances`);
      patternScore += redundantTypes * 3;
    }

    const consoleLogs = this.detectConsoleLogs(code);
    if (consoleLogs > 0) {
      detectedPatterns.push(`Console.log statements: ${consoleLogs} instances`);
      patternScore += consoleLogs * 1;
    }

    const overEngineering = this.detectOverEngineering(code);
    const verbosity = this.calculateVerbosity(code);

    const aiScore = Math.min(100, patternScore + overEngineering * 10 + verbosity * 5);

    return {
      aiScore,
      detectedPatterns,
      overEngineering,
      verbosity
    };
  }

  private detectVerboseComments(code: string): number {
    const comments = code.match(AI_CODE_PATTERNS.aiSpecificSmells.verboseComments) || [];
    return comments.filter(comment => {
      const normalized = comment.toLowerCase().trim();
      if (normalized.length < 10) return false;
      
      return COMMON_AI_COMMENTS.some(aiComment => 
        normalized.includes(aiComment.toLowerCase())
      ) || normalized.split(' ').length > 15;
    }).length;
  }

  private detectPlaceholders(code: string): number {
    return (code.match(AI_CODE_PATTERNS.aiSpecificSmells.placeholderCode) || []).length;
  }

  private detectRedundantTypes(code: string): number {
    return (code.match(AI_CODE_PATTERNS.aiSpecificSmells.redundantTypeAnnotations) || []).length;
  }

  private detectConsoleLogs(code: string): number {
    return (code.match(AI_CODE_PATTERNS.aiSpecificSmells.consoleLogs) || []).length;
  }

  private detectOverEngineering(code: string): number {
    let score = 0;
    
    const singleUseClasses = (code.match(AI_CODE_PATTERNS.overEngineering.singleUseClasses) || []).length;
    score += singleUseClasses * 2;

    AI_CODE_PATTERNS.overEngineering.unnecessaryAbstractions.forEach(pattern => {
      if (pattern.test(code)) {
        score += 3;
      }
    });

    const deepNesting = (code.match(AI_CODE_PATTERNS.complexityIndicators.deepNesting) || []).length;
    score += deepNesting;

    return score;
  }

  private calculateVerbosity(code: string): number {
    const lines = code.split('\n');
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*');
    });

    const avgLineLength = codeLines.reduce((sum, line) => sum + line.length, 0) / codeLines.length;
    const longLines = codeLines.filter(line => line.length > 120).length;
    
    return (avgLineLength > 80 ? 1 : 0) + (longLines / codeLines.length);
  }
}