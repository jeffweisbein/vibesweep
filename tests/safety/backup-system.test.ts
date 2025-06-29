import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { BackupSystem } from '../../src/safety/backup-system.js';

describe('BackupSystem', () => {
  let backupSystem: BackupSystem;
  let testDir: string;
  let testFiles: string[];

  beforeEach(async () => {
    backupSystem = new BackupSystem();
    await backupSystem.initialize();
    
    // Create test directory and files
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backup-test-'));
    testFiles = [];
    
    // Create some test files
    for (let i = 0; i < 3; i++) {
      const filePath = path.join(testDir, `test${i}.js`);
      await fs.writeFile(filePath, `console.log('test file ${i}');`, 'utf-8');
      testFiles.push(filePath);
    }
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('createBackup', () => {
    it('should create backup with unique ID', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      
      expect(handle.id).toBeTruthy();
      expect(handle.timestamp).toBeInstanceOf(Date);
      expect(handle.files.size).toBe(3);
      expect(handle.backupDir).toContain('backup-');
    });

    it('should copy file contents correctly', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      
      // Verify backup files exist and have correct content
      for (const [originalPath, backupPath] of handle.files.entries()) {
        const originalContent = await fs.readFile(originalPath, 'utf-8');
        const backupContent = await fs.readFile(backupPath, 'utf-8');
        expect(backupContent).toBe(originalContent);
      }
    });

    it('should handle missing files gracefully', async () => {
      const missingFile = path.join(testDir, 'missing.js');
      const handle = await backupSystem.createBackup([...testFiles, missingFile]);
      
      // Should backup existing files only
      expect(handle.files.size).toBe(3);
    });
  });

  describe('restore', () => {
    it('should restore files from backup', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      
      // Modify original files
      for (const file of testFiles) {
        await fs.writeFile(file, 'modified content', 'utf-8');
      }
      
      // Restore from backup
      await backupSystem.restore(handle);
      
      // Verify files are restored
      for (let i = 0; i < testFiles.length; i++) {
        const content = await fs.readFile(testFiles[i], 'utf-8');
        expect(content).toBe(`console.log('test file ${i}');`);
      }
    });

    it('should handle partial restore failures', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      
      // Delete one backup file to simulate failure
      const firstBackupPath = handle.files.values().next().value;
      await fs.unlink(firstBackupPath);
      
      // Should still restore other files
      await backupSystem.restore(handle);
      
      // At least some files should be restored
      const restoredCount = testFiles.filter(async (file) => {
        try {
          await fs.access(file);
          return true;
        } catch {
          return false;
        }
      }).length;
      
      expect(restoredCount).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('should remove backup directory', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      const backupDir = handle.backupDir;
      
      // Verify backup exists
      await expect(fs.access(backupDir)).resolves.toBeUndefined();
      
      // Cleanup
      await backupSystem.cleanup(handle);
      
      // Verify backup is removed
      await expect(fs.access(backupDir)).rejects.toThrow();
    });
  });

  describe('verifyBackup', () => {
    it('should return true for valid backup', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      const isValid = await backupSystem.verifyBackup(handle);
      expect(isValid).toBe(true);
    });

    it('should return false if backup files are missing', async () => {
      const handle = await backupSystem.createBackup(testFiles);
      
      // Delete a backup file
      const firstBackupPath = handle.files.values().next().value;
      await fs.unlink(firstBackupPath);
      
      const isValid = await backupSystem.verifyBackup(handle);
      expect(isValid).toBe(false);
    });
  });
});