import { execSync } from 'child_process';
import { logger } from '../utils/logger.js';

export interface GitStatus {
  isClean: boolean;
  hasUncommittedChanges: boolean;
  currentBranch: string;
  lastCommitHash: string;
}

export class GitSafety {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  checkGitStatus(): GitStatus {
    try {
      const status = execSync('git status --porcelain', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      const lastCommit = execSync('git rev-parse HEAD', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      }).trim();

      return {
        isClean: status === '',
        hasUncommittedChanges: status !== '',
        currentBranch: branch,
        lastCommitHash: lastCommit
      };
    } catch (error) {
      throw new Error(`Failed to check git status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  requireCleanWorkingTree(): void {
    const status = this.checkGitStatus();
    
    if (!status.isClean) {
      throw new Error(
        'Working tree is not clean. Please commit or stash your changes before running fixes.\n' +
        'Run "git status" to see uncommitted changes.'
      );
    }
  }

  createBackupBranch(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupBranchName = `vibesweep-backup-${timestamp}`;
    
    try {
      // Create backup branch from current HEAD
      execSync(`git branch ${backupBranchName}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });
      
      logger.success(`Created backup branch: ${backupBranchName}`);
      return backupBranchName;
    } catch (error) {
      throw new Error(`Failed to create backup branch: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  verifyBranchExists(branchName: string): boolean {
    try {
      execSync(`git rev-parse --verify ${branchName}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }

  restoreFromBranch(branchName: string): void {
    if (!this.verifyBranchExists(branchName)) {
      throw new Error(`Backup branch ${branchName} does not exist`);
    }

    try {
      // Hard reset to backup branch
      execSync(`git reset --hard ${branchName}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      });
      
      logger.success(`Restored from backup branch: ${branchName}`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  isGitRepository(): boolean {
    try {
      execSync('git rev-parse --git-dir', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }
}