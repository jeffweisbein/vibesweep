import { diffLines } from 'diff';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import prompts from 'prompts';
import { logger } from '../utils/logger.js';

export interface Change {
  file: string;
  line: number;
  type: 'remove' | 'replace' | 'add';
  oldContent?: string;
  newContent?: string;
  description: string;
}

export interface ChangeSet {
  changes: Change[];
  summary: {
    totalFiles: number;
    totalChanges: number;
    changesByType: Record<string, number>;
  };
}

export type UserDecision = 'accept' | 'reject' | 'partial' | 'skip';

export class ChangePreview {
  async generateDiff(filePath: string, changes: Change[]): Promise<string> {
    const originalContent = await fs.readFile(filePath, 'utf-8');
    const lines = originalContent.split('\n');
    
    // Apply changes to create modified version
    const modifiedLines = [...lines];
    
    // Sort changes by line number in reverse order to avoid offset issues
    const sortedChanges = [...changes].sort((a, b) => b.line - a.line);
    
    for (const change of sortedChanges) {
      const lineIndex = change.line - 1;
      
      switch (change.type) {
        case 'remove':
          modifiedLines.splice(lineIndex, 1);
          break;
        case 'replace':
          if (change.newContent !== undefined) {
            modifiedLines[lineIndex] = change.newContent;
          }
          break;
        case 'add':
          if (change.newContent !== undefined) {
            modifiedLines.splice(lineIndex + 1, 0, change.newContent);
          }
          break;
      }
    }
    
    const modifiedContent = modifiedLines.join('\n');
    
    // Generate unified diff
    const diff = diffLines(originalContent, modifiedContent);
    let diffOutput = '';
    let lineNumOld = 1;
    let lineNumNew = 1;
    
    diff.forEach(part => {
      const lines = part.value.split('\n').filter(line => line !== '');
      
      lines.forEach(line => {
        if (part.added) {
          diffOutput += chalk.green(`+ ${line}\n`);
          lineNumNew++;
        } else if (part.removed) {
          diffOutput += chalk.red(`- ${line}\n`);
          lineNumOld++;
        } else {
          diffOutput += chalk.gray(`  ${line}\n`);
          lineNumOld++;
          lineNumNew++;
        }
      });
    });
    
    return diffOutput;
  }

  formatChangeSummary(changeSet: ChangeSet): string {
    const { summary } = changeSet;
    
    let output = chalk.bold('\nChange Summary:\n');
    output += `  Files affected: ${summary.totalFiles}\n`;
    output += `  Total changes: ${summary.totalChanges}\n`;
    
    if (summary.changesByType['console.log']) {
      output += `  - console.log removals: ${summary.changesByType['console.log']}\n`;
    }
    if (summary.changesByType['debugger']) {
      output += `  - debugger removals: ${summary.changesByType['debugger']}\n`;
    }
    if (summary.changesByType['comment']) {
      output += `  - comment removals: ${summary.changesByType['comment']}\n`;
    }
    
    return output;
  }

  async showInteractive(changeSet: ChangeSet): Promise<UserDecision> {
    console.log(this.formatChangeSummary(changeSet));
    
    const response = await prompts({
      type: 'select',
      name: 'decision',
      message: 'How would you like to proceed?',
      choices: [
        { title: 'Accept all changes', value: 'accept' },
        { title: 'Review each file', value: 'partial' },
        { title: 'Skip all changes', value: 'skip' },
        { title: 'Cancel operation', value: 'reject' }
      ]
    });
    
    return response.decision as UserDecision;
  }

  async selectChanges(changeSet: ChangeSet): Promise<ChangeSet> {
    const selectedChanges: Change[] = [];
    
    // Group changes by file
    const changesByFile = new Map<string, Change[]>();
    for (const change of changeSet.changes) {
      if (!changesByFile.has(change.file)) {
        changesByFile.set(change.file, []);
      }
      changesByFile.get(change.file)!.push(change);
    }
    
    // Review each file
    for (const [file, changes] of changesByFile) {
      console.log(chalk.bold(`\n${file}:`));
      
      // Show preview
      const diff = await this.generateDiff(file, changes);
      console.log(diff);
      
      const response = await prompts({
        type: 'select',
        name: 'action',
        message: `Apply ${changes.length} changes to this file?`,
        choices: [
          { title: 'Yes', value: 'yes' },
          { title: 'No', value: 'no' },
          { title: 'Select individually', value: 'individual' }
        ]
      });
      
      if (response.action === 'yes') {
        selectedChanges.push(...changes);
      } else if (response.action === 'individual') {
        // Review each change
        for (const change of changes) {
          console.log(chalk.yellow(`\n${change.description} (line ${change.line})`));
          
          const includeResponse = await prompts({
            type: 'confirm',
            name: 'include',
            message: 'Include this change?',
            initial: true
          });
          
          if (includeResponse.include) {
            selectedChanges.push(change);
          }
        }
      }
    }
    
    // Return new changeset with selected changes
    return {
      changes: selectedChanges,
      summary: this.calculateSummary(selectedChanges)
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
    if (change.description.includes('console.log')) return 'console.log';
    if (change.description.includes('debugger')) return 'debugger';
    if (change.description.includes('comment')) return 'comment';
    return 'other';
  }
}