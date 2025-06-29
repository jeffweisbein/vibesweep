import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export interface BackupHandle {
  id: string;
  timestamp: Date;
  backupDir: string;
  files: Map<string, string>; // original path -> backup path
}

export class BackupSystem {
  private tempDir: string;
  private backups: Map<string, BackupHandle> = new Map();

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'vibesweep-backups');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async createBackup(filePaths: string[]): Promise<BackupHandle> {
    const backupId = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date();
    const backupDir = path.join(this.tempDir, `backup-${backupId}`);
    
    await fs.mkdir(backupDir, { recursive: true });

    const handle: BackupHandle = {
      id: backupId,
      timestamp,
      backupDir,
      files: new Map()
    };

    // Copy each file to backup location
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        // Use just the filename for the backup to avoid deep directory structures
        const fileName = path.basename(filePath);
        const backupPath = path.join(backupDir, fileName);
        
        // Ensure backup directory exists
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        
        // Write backup
        await fs.writeFile(backupPath, content, 'utf-8');
        handle.files.set(filePath, backupPath);
        
      } catch (error) {
        logger.warn(`Failed to backup ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.backups.set(backupId, handle);
    logger.info(`Created backup ${backupId} with ${handle.files.size} files`);
    
    return handle;
  }

  async restore(handle: BackupHandle): Promise<void> {
    let restoredCount = 0;
    const errors: string[] = [];

    for (const [originalPath, backupPath] of handle.files.entries()) {
      try {
        const content = await fs.readFile(backupPath, 'utf-8');
        await fs.writeFile(originalPath, content, 'utf-8');
        restoredCount++;
      } catch (error) {
        errors.push(`${originalPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (errors.length > 0) {
      logger.error(`Failed to restore ${errors.length} files:`);
      errors.forEach(err => logger.error(`  - ${err}`));
    }

    logger.success(`Restored ${restoredCount} files from backup ${handle.id}`);
  }

  async cleanup(handle: BackupHandle): Promise<void> {
    try {
      await fs.rm(handle.backupDir, { recursive: true, force: true });
      this.backups.delete(handle.id);
      logger.debug(`Cleaned up backup ${handle.id}`);
    } catch (error) {
      logger.warn(`Failed to cleanup backup ${handle.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async cleanupOldBackups(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [id, handle] of this.backups.entries()) {
      if (handle.timestamp.getTime() < cutoffTime) {
        await this.cleanup(handle);
      }
    }
  }

  async verifyBackup(handle: BackupHandle): Promise<boolean> {
    for (const backupPath of handle.files.values()) {
      try {
        await fs.access(backupPath);
      } catch {
        return false;
      }
    }
    return true;
  }
}