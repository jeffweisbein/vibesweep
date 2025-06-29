import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { promises as fs } from 'fs';
import { Change } from '../safety/change-preview.js';
import { WhitelistConfig } from '../config/safe-fix-config.js';

export interface ConsoleLogFix {
  file: string;
  line: number;
  column: number;
  code: string;
  isInTestFile: boolean;
  confidence: number;
}

export class ConsoleLogFixer {
  private whitelist?: WhitelistConfig;
  
  private readonly testFilePatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /__tests__/,
    /test\//,
    /tests\//
  ];

  private readonly safePatterns = [
    /console\.log\s*\(/,  // Basic console.log
    /console\.debug\s*\(/,  // Debug statements
    /console\.info\s*\(/,   // Info statements
  ];

  constructor(whitelist?: WhitelistConfig) {
    this.whitelist = whitelist;
  }

  async findConsoleLogStatements(filePath: string): Promise<ConsoleLogFix[]> {
    const fixes: ConsoleLogFix[] = [];
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Skip if test file
    const isTestFile = this.isTestFile(filePath);
    if (isTestFile) {
      return [];
    }

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
        errorRecovery: true
      });

      const self = this;
      traverse(ast, {
        CallExpression(path) {
          // Check if it's console.log/debug/info
          if (
            t.isMemberExpression(path.node.callee) &&
            t.isIdentifier(path.node.callee.object, { name: 'console' }) &&
            t.isIdentifier(path.node.callee.property) &&
            ['log', 'debug', 'info'].includes(path.node.callee.property.name)
          ) {
            const loc = path.node.loc;
            if (!loc) return;

            // Check for preserve patterns
            const line = lines[loc.start.line - 1];
            const previousLine = loc.start.line > 1 ? lines[loc.start.line - 2] : '';
            
            if (self.shouldPreserve(line) || self.shouldPreserve(previousLine)) {
              return;
            }

            // Generate the code snippet
            const generated = generate(path.node, { compact: true });
            
            fixes.push({
              file: filePath,
              line: loc.start.line,
              column: loc.start.column,
              code: generated.code,
              isInTestFile: false,
              confidence: self.calculateConfidence(path)
            });
          }
        }
      });
    } catch (error) {
      // If parsing fails, fall back to regex-based detection
      return this.findWithRegex(filePath, content);
    }

    return fixes.filter(fix => fix.confidence >= 0.9);
  }

  private calculateConfidence(path: any): number {
    let confidence = 0.95; // Base confidence for console.log

    // Higher confidence if it's a simple call with string literals
    const args = path.node.arguments;
    if (args.every((arg: any) => t.isStringLiteral(arg))) {
      confidence = 0.99;
    }

    // Lower confidence if it might be used for side effects
    if (path.parent && t.isSequenceExpression(path.parent)) {
      confidence *= 0.8;
    }

    // Lower confidence if in a conditional
    if (path.findParent((p: any) => t.isConditionalExpression(p.node))) {
      confidence *= 0.9;
    }

    return confidence;
  }

  private async findWithRegex(filePath: string, content: string): Promise<ConsoleLogFix[]> {
    const fixes: ConsoleLogFix[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of this.safePatterns) {
        const match = line.match(pattern);
        if (match && !this.shouldPreserve(line)) {
          fixes.push({
            file: filePath,
            line: index + 1,
            column: match.index || 0,
            code: match[0],
            isInTestFile: false,
            confidence: 0.9
          });
        }
      }
    });

    return fixes;
  }

  private isTestFile(filePath: string): boolean {
    return this.testFilePatterns.some(pattern => pattern.test(filePath));
  }

  private shouldPreserve(line: string): boolean {
    // Default preserve patterns if no whitelist provided
    const defaultPreservePatterns = [
      '@vibesweep-ignore',
      '@preserve',
      'eslint-disable.*console'
    ];
    
    // Check whitelist comments if available
    if (this.whitelist?.comments) {
      for (const comment of this.whitelist.comments) {
        if (line.includes(comment)) {
          return true;
        }
      }
    } else {
      // Use default patterns if no whitelist
      for (const pattern of defaultPreservePatterns) {
        if (line.includes(pattern)) {
          return true;
        }
      }
    }
    
    // Check whitelist patterns
    if (this.whitelist?.patterns) {
      for (const pattern of this.whitelist.patterns) {
        if (new RegExp(pattern).test(line)) {
          return true;
        }
      }
    }
    
    return false;
  }

  async removeConsoleLogs(filePath: string, fixes: ConsoleLogFix[]): Promise<Change[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const changes: Change[] = [];

    // Sort fixes by line number in reverse order
    const sortedFixes = [...fixes].sort((a, b) => b.line - a.line);

    // Track processed lines to avoid duplicates
    const processedLines = new Set<number>();
    
    for (const fix of sortedFixes) {
      const lineIndex = fix.line - 1;
      
      // Skip if already processed
      if (processedLines.has(lineIndex)) {
        continue;
      }
      
      const line = lines[lineIndex];

      // Check if this is a multi-line console.log
      let endLine = lineIndex;
      
      // Simple check: if the line doesn't end with );, it might be multi-line
      if (!line.trim().endsWith(');') && !line.trim().endsWith(')')) {
        // Find the closing parenthesis
        for (let i = lineIndex + 1; i < lines.length; i++) {
          if (lines[i].includes(');')) {
            endLine = i;
            break;
          }
        }
      }

      // Mark lines as processed
      for (let i = lineIndex; i <= endLine; i++) {
        processedLines.add(i);
      }
      
      // Create change object
      if (lineIndex === endLine) {
        // Single line console.log
        const leadingWhitespace = line.match(/^\s*/)?.[0] || '';
        const trimmedLine = line.trim();
        
        // If the line only contains console.log, remove entire line
        if (trimmedLine.startsWith('console.')) {
          changes.push({
            file: filePath,
            line: fix.line,
            type: 'remove',
            oldContent: line,
            description: `Remove console.${fix.code.includes('debug') ? 'debug' : fix.code.includes('info') ? 'info' : 'log'} statement`
          });
        } else {
          // Line contains other code, just remove console.log part
          // Replace console.log statement, keeping appropriate spacing
          const newLine = line.replace(/\s*console\.(log|debug|info)\([^)]*\);\s*/, '  ');
          changes.push({
            file: filePath,
            line: fix.line,
            type: 'replace',
            oldContent: line,
            newContent: newLine,
            description: `Remove console.${fix.code.includes('debug') ? 'debug' : fix.code.includes('info') ? 'info' : 'log'} from line`
          });
        }
      } else {
        // Multi-line console.log - mark all lines for removal
        for (let i = lineIndex; i <= endLine; i++) {
          changes.push({
            file: filePath,
            line: i + 1,
            type: 'remove',
            oldContent: lines[i],
            description: 'Remove multi-line console.log statement'
          });
        }
      }
    }

    return changes;
  }
}