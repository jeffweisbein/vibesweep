import crypto from 'crypto';

interface CodeBlock {
  content: string;
  hash: string;
  lineStart: number;
  lineEnd: number;
}

export class DuplicationAnalyzer {
  private minBlockSize = 4;
  private similarityThreshold = 0.85;

  analyze(code: string): {
    duplicateBlocks: CodeBlock[];
    duplicationRatio: number;
    copyPasteScore: number;
  } {
    const lines = code.split('\n');
    const blocks = this.extractCodeBlocks(lines);
    const duplicates = this.findDuplicates(blocks);
    
    const totalLines = lines.length;
    const duplicateLines = duplicates.reduce((sum, block) => 
      sum + (block.lineEnd - block.lineStart + 1), 0
    );
    
    return {
      duplicateBlocks: duplicates,
      duplicationRatio: totalLines > 0 ? duplicateLines / totalLines : 0,
      copyPasteScore: this.calculateCopyPasteScore(duplicates, blocks)
    };
  }

  private extractCodeBlocks(lines: string[]): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const processedRanges = new Set<string>();
    
    for (let size = Math.min(30, lines.length); size >= this.minBlockSize; size -= 2) {
      for (let i = 0; i <= lines.length - size; i++) {
        const rangeKey = `${i}-${i + size}`;
        if (processedRanges.has(rangeKey)) continue;
        
        const content = lines.slice(i, i + size).join('\n').trim();
        if (content && !this.isBoilerplate(content)) {
          blocks.push({
            content,
            hash: this.hashContent(content),
            lineStart: i + 1,
            lineEnd: i + size
          });
          processedRanges.add(rangeKey);
        }
      }
    }
    
    return blocks;
  }

  private findDuplicates(blocks: CodeBlock[]): CodeBlock[] {
    const hashMap = new Map<string, CodeBlock[]>();
    const duplicates: CodeBlock[] = [];
    const usedLines = new Set<number>();
    
    blocks.forEach(block => {
      const existing = hashMap.get(block.hash) || [];
      existing.push(block);
      hashMap.set(block.hash, existing);
    });
    
    hashMap.forEach(blockGroup => {
      if (blockGroup.length > 1) {
        blockGroup.forEach((block, idx) => {
          if (idx === 0) return;
          
          let hasOverlap = false;
          for (let line = block.lineStart; line <= block.lineEnd; line++) {
            if (usedLines.has(line)) {
              hasOverlap = true;
              break;
            }
          }
          
          if (!hasOverlap) {
            duplicates.push(block);
            for (let line = block.lineStart; line <= block.lineEnd; line++) {
              usedLines.add(line);
            }
          }
        });
      }
    });
    
    return duplicates;
  }

  private hashContent(content: string): string {
    const normalized = content
      .replace(/\s+/g, ' ')
      .replace(/['"`]/g, '')
      .trim();
    
    return crypto
      .createHash('md5')
      .update(normalized)
      .digest('hex');
  }

  private isBoilerplate(content: string): boolean {
    const trimmed = content.trim();
    const lines = trimmed.split('\n').length;
    
    if (lines < 3) return true;
    
    const boilerplatePatterns = [
      /^import\s+.+from\s+['"].+['"]$/m,
      /^export\s+default\s+\w+;?$/,
      /^module\.exports\s*=/,
      /^package\s+\w+;/,
      /^#include\s*<.+>/
    ];
    
    const isSimpleImportExport = boilerplatePatterns.some(pattern => 
      pattern.test(trimmed) && lines <= 2
    );
    
    const hasMinimalComplexity = 
      trimmed.includes('{') || 
      trimmed.includes('(') || 
      trimmed.includes('=') ||
      trimmed.includes(':');
    
    return isSimpleImportExport || !hasMinimalComplexity;
  }

  private calculateCopyPasteScore(duplicates: CodeBlock[], allBlocks: CodeBlock[]): number {
    if (allBlocks.length === 0) return 0;
    
    const duplicateComplexity = duplicates.reduce((sum, block) => 
      sum + this.calculateComplexity(block.content), 0
    );
    
    const totalComplexity = allBlocks.reduce((sum, block) => 
      sum + this.calculateComplexity(block.content), 0
    );
    
    return totalComplexity > 0 ? duplicateComplexity / totalComplexity : 0;
  }

  private calculateComplexity(code: string): number {
    const complexityFactors = {
      conditionals: (code.match(/if\s*\(|switch\s*\(|case\s+/g) || []).length,
      loops: (code.match(/for\s*\(|while\s*\(|do\s*{/g) || []).length,
      functions: (code.match(/function\s+|=>\s*{|class\s+/g) || []).length,
      lines: code.split('\n').length
    };
    
    return complexityFactors.conditionals * 2 +
           complexityFactors.loops * 3 +
           complexityFactors.functions * 4 +
           complexityFactors.lines * 0.1;
  }
}