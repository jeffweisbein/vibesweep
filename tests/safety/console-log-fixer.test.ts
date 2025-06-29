import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { ConsoleLogFixer } from '../../src/fixers/console-log-fixer.js';

describe('ConsoleLogFixer', () => {
  let fixer: ConsoleLogFixer;
  let testDir: string;

  beforeEach(async () => {
    fixer = new ConsoleLogFixer();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vibesweep-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  async function createTestFile(filename: string, content: string): Promise<string> {
    const filePath = path.join(testDir, filename);
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  describe('findConsoleLogStatements', () => {
    it('should find basic console.log statements', async () => {
      const filePath = await createTestFile('test.js', `
        function test() {
          console.log('hello world');
          return 42;
        }
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      expect(fixes).toHaveLength(1);
      expect(fixes[0].line).toBe(3);
      expect(fixes[0].confidence).toBeGreaterThan(0.9);
    });

    it('should find console.debug and console.info', async () => {
      const filePath = await createTestFile('test.js', `
        console.debug('debug message');
        console.info('info message');
        console.error('error message'); // Should not be detected
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      expect(fixes).toHaveLength(2);
      expect(fixes[0].line).toBe(2);
      expect(fixes[1].line).toBe(3);
    });

    it('should skip test files', async () => {
      const filePath = await createTestFile('test.test.js', `
        it('should log', () => {
          console.log('test output');
        });
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      expect(fixes).toHaveLength(0);
    });

    it('should respect @vibesweep-ignore comments', async () => {
      const filePath = await createTestFile('test.js', `
        // @vibesweep-ignore
        console.log('this should be preserved');
        
        console.log('this should be detected');
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      expect(fixes).toHaveLength(1);
      expect(fixes[0].line).toBe(5);
    });

    it('should handle multi-line console.log', async () => {
      const filePath = await createTestFile('test.js', `
        console.log(
          'long message',
          'with multiple',
          'arguments'
        );
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      expect(fixes).toHaveLength(1);
      expect(fixes[0].line).toBe(2);
    });
  });

  describe('removeConsoleLogs', () => {
    it('should create correct change objects for removal', async () => {
      const filePath = await createTestFile('test.js', `
        function test() {
          console.log('hello');
          return 42;
        }
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      const changes = await fixer.removeConsoleLogs(filePath, fixes);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('remove');
      expect(changes[0].line).toBe(3);
      expect(changes[0].description).toContain('Remove console.log');
    });

    it('should handle inline console.log with other code', async () => {
      const filePath = await createTestFile('test.js', `
        const x = 5; console.log('value:', x); const y = 10;
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      const changes = await fixer.removeConsoleLogs(filePath, fixes);

      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('replace');
      expect(changes[0].newContent).toBe('        const x = 5;  const y = 10;');
    });

    it('should handle multiple console.logs', async () => {
      const filePath = await createTestFile('test.js', `
        console.log('one');
        console.log('two');
        console.log('three');
      `);

      const fixes = await fixer.findConsoleLogStatements(filePath);
      const changes = await fixer.removeConsoleLogs(filePath, fixes);

      expect(changes).toHaveLength(3);
      changes.forEach(change => {
        expect(change.type).toBe('remove');
      });
    });
  });
});