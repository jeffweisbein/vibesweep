import { readFileSync } from 'fs';

export interface TodoItem {
  type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE';
  message: string;
  file: string;
  line: number;
  age?: number; // days old if we can detect from git
  priority: 'high' | 'medium' | 'low';
}

export class TodoReporter {
  private readonly patterns = [
    /\/\/\s*(TODO|FIXME|HACK|NOTE|XXX|BUG):\s*(.+)/gi,
    /\/\*\s*(TODO|FIXME|HACK|NOTE|XXX|BUG):\s*(.+)\*\//gi,
    /#\s*(TODO|FIXME|HACK|NOTE|XXX|BUG):\s*(.+)/gi, // Python
  ];

  extractTodos(filePath: string, content: string): TodoItem[] {
    const todos: TodoItem[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      this.patterns.forEach(pattern => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          const type = match[1].toUpperCase() as TodoItem['type'];
          const message = match[2].trim();
          
          todos.push({
            type: type as TodoItem['type'],
            message,
            file: filePath,
            line: index + 1,
            priority: this.getPriority(type, message)
          });
        });
      });
    });

    return todos;
  }

  private getPriority(type: string, message: string): TodoItem['priority'] {
    // FIXME and BUG are high priority
    if (type === 'FIXME' || type === 'BUG') return 'high';
    
    // Check for urgent keywords
    const urgentKeywords = /urgent|asap|critical|security|breaking|important/i;
    if (urgentKeywords.test(message)) return 'high';
    
    // Check for medium priority keywords
    const mediumKeywords = /soon|needed|should|improve|optimize/i;
    if (mediumKeywords.test(message)) return 'medium';
    
    return 'low';
  }

  generateReport(allTodos: TodoItem[]): string {
    if (allTodos.length === 0) {
      return '\n✨ No TODOs or FIXMEs found!\n';
    }

    const byPriority = {
      high: allTodos.filter(t => t.priority === 'high'),
      medium: allTodos.filter(t => t.priority === 'medium'),
      low: allTodos.filter(t => t.priority === 'low')
    };

    let report = '\n📋 TODO/FIXME Report\n';
    report += '══════════════════════════════════════════════════\n\n';
    
    // Summary
    report += `Found ${allTodos.length} items requiring attention:\n`;
    report += `  🔴 High Priority: ${byPriority.high.length}\n`;
    report += `  🟡 Medium Priority: ${byPriority.medium.length}\n`;
    report += `  🟢 Low Priority: ${byPriority.low.length}\n\n`;

    // High priority items
    if (byPriority.high.length > 0) {
      report += '🔴 HIGH PRIORITY\n';
      report += '────────────────\n';
      byPriority.high.forEach(todo => {
        report += `\n${todo.type}: ${todo.message}\n`;
        report += `  📁 ${todo.file}:${todo.line}\n`;
      });
      report += '\n';
    }

    // Medium priority items
    if (byPriority.medium.length > 0) {
      report += '🟡 MEDIUM PRIORITY\n';
      report += '──────────────────\n';
      byPriority.medium.forEach(todo => {
        report += `\n${todo.type}: ${todo.message}\n`;
        report += `  📁 ${todo.file}:${todo.line}\n`;
      });
      report += '\n';
    }

    // Low priority summary (just count)
    if (byPriority.low.length > 0) {
      report += `🟢 LOW PRIORITY: ${byPriority.low.length} items\n`;
      report += '  (Run with --todos-all to see all items)\n\n';
    }

    // Actionable next steps
    report += '💡 Next Steps:\n';
    report += '──────────────\n';
    if (byPriority.high.length > 0) {
      report += '1. Address HIGH priority items first (security/bugs)\n';
    }
    report += '2. Schedule time to tackle old TODOs\n';
    report += '3. Consider removing outdated TODOs\n';
    report += '4. Convert important TODOs to GitHub issues\n';

    return report;
  }

  generateMarkdown(allTodos: TodoItem[]): string {
    let md = '# TODO/FIXME Report\n\n';
    
    if (allTodos.length === 0) {
      return md + '✨ No TODOs or FIXMEs found!\n';
    }

    const byFile = new Map<string, TodoItem[]>();
    allTodos.forEach(todo => {
      const existing = byFile.get(todo.file) || [];
      existing.push(todo);
      byFile.set(todo.file, existing);
    });

    md += `## Summary\n\n`;
    md += `- Total items: ${allTodos.length}\n`;
    md += `- Files affected: ${byFile.size}\n\n`;

    md += '## By File\n\n';
    byFile.forEach((todos, file) => {
      md += `### ${file}\n\n`;
      todos.forEach(todo => {
        const emoji = todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢';
        md += `- ${emoji} **${todo.type}** (line ${todo.line}): ${todo.message}\n`;
      });
      md += '\n';
    });

    return md;
  }
}