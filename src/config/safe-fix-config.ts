import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface WhitelistConfig {
  files: string[];        // File patterns to exclude from fixes
  patterns: string[];     // Code patterns to preserve (regex)
  comments: string[];     // Comment markers that prevent fixes
}

export interface FixTypeConfig {
  enabled: boolean;
  excludePatterns?: string[];
  minConfidence?: number;
}

export interface SafeFixUserConfig {
  safety?: {
    requireGitClean?: boolean;
    requireBackup?: boolean;
    requireTests?: boolean;
    maxFilesPerRun?: number;
    confirmEachFile?: boolean;
    dryRunByDefault?: boolean;
  };
  
  fixes?: {
    levels?: {
      'ultra-safe'?: boolean;
      'safe'?: boolean;
      'experimental'?: boolean;
    };
    
    categories?: {
      'console-logs'?: FixTypeConfig;
      'unused-imports'?: FixTypeConfig;
      'dead-code'?: FixTypeConfig;
    };
  };
  
  validation?: {
    runTests?: boolean;
    runTypeCheck?: boolean;
    runLinter?: boolean;
    testCommand?: string;
    typeCheckCommand?: string;
    lintCommand?: string;
    customCommands?: string[];
  };
  
  whitelist?: WhitelistConfig;
}

export class SafeFixConfigLoader {
  private static readonly CONFIG_FILENAME = '.vibesweeprc.json';
  
  static async load(projectRoot: string): Promise<SafeFixUserConfig> {
    const configPath = path.join(projectRoot, this.CONFIG_FILENAME);
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content) as SafeFixUserConfig;
      logger.debug(`Loaded config from ${configPath}`);
      return config;
    } catch (error) {
      // Config file is optional
      return {};
    }
  }
  
  static getDefaultConfig(): Required<SafeFixUserConfig> {
    return {
      safety: {
        requireGitClean: true,
        requireBackup: true,
        requireTests: true,
        maxFilesPerRun: 10,
        confirmEachFile: false,
        dryRunByDefault: true
      },
      
      fixes: {
        levels: {
          'ultra-safe': true,
          'safe': false,
          'experimental': false
        },
        
        categories: {
          'console-logs': {
            enabled: true,
            excludePatterns: ['**/debug/**', '**/scripts/**'],
            minConfidence: 0.9
          },
          'unused-imports': {
            enabled: false,
            minConfidence: 0.95
          },
          'dead-code': {
            enabled: false,
            minConfidence: 0.95
          }
        }
      },
      
      validation: {
        runTests: true,
        runTypeCheck: true,
        runLinter: true,
        testCommand: undefined,
        typeCheckCommand: undefined,
        lintCommand: undefined,
        customCommands: []
      },
      
      whitelist: {
        files: [
          '**/vendor/**',
          '**/generated/**',
          '**/node_modules/**',
          '**/*.min.js',
          '**/dist/**',
          '**/build/**'
        ],
        patterns: [
          '_unused.*',
          'DEBUG_.*',
          'LEGACY_.*'
        ],
        comments: [
          '@vibesweep-ignore',
          '@preserve',
          'eslint-disable.*console',
          'TODO: keep'
        ]
      }
    };
  }
  
  static merge(userConfig: SafeFixUserConfig): Required<SafeFixUserConfig> {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      safety: { ...defaultConfig.safety, ...userConfig.safety },
      fixes: {
        levels: { ...defaultConfig.fixes.levels, ...userConfig.fixes?.levels },
        categories: { ...defaultConfig.fixes.categories, ...userConfig.fixes?.categories }
      },
      validation: { ...defaultConfig.validation, ...userConfig.validation },
      whitelist: {
        files: [...defaultConfig.whitelist.files, ...(userConfig.whitelist?.files || [])],
        patterns: [...defaultConfig.whitelist.patterns, ...(userConfig.whitelist?.patterns || [])],
        comments: [...defaultConfig.whitelist.comments, ...(userConfig.whitelist?.comments || [])]
      }
    };
  }
  
  static shouldSkipFile(filePath: string, whitelist: WhitelistConfig): boolean {
    return whitelist.files.some(pattern => {
      // Convert glob pattern to regex
      const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '.');
      return new RegExp(regex).test(filePath);
    });
  }
  
  static shouldPreserveCode(code: string, whitelist: WhitelistConfig): boolean {
    // Check patterns
    for (const pattern of whitelist.patterns) {
      if (new RegExp(pattern).test(code)) {
        return true;
      }
    }
    
    // Check comment markers
    for (const comment of whitelist.comments) {
      if (code.includes(comment)) {
        return true;
      }
    }
    
    return false;
  }
}