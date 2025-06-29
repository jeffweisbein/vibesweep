# Configuration File

Vibesweep can be configured using a `.vibesweeprc.json` file in your project root.

## File Location

Vibesweep looks for configuration in this order:
1. `.vibesweeprc.json` in the current directory
2. `.vibesweeprc.json` in parent directories
3. Default configuration if no file found

## Complete Configuration

```json
{
  "thresholds": {
    "maxWastePercentage": 40,
    "maxDuplicationRatio": 0.15,
    "maxAIScore": 70
  },
  
  "analysis": {
    "includePatterns": ["**/*.{js,jsx,ts,tsx}"],
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.min.js",
      "**/vendor/**"
    ],
    "minFileSize": 100,
    "maxFileSize": 1000000
  },
  
  "safety": {
    "requireGitClean": true,
    "requireBackup": true,
    "requireTests": true,
    "maxFilesPerRun": 10,
    "confirmEachFile": false,
    "dryRunByDefault": true
  },
  
  "fixes": {
    "levels": {
      "ultra-safe": true,
      "safe": false,
      "experimental": false
    },
    "categories": {
      "console-logs": {
        "enabled": true,
        "excludePatterns": ["**/debug/**", "**/scripts/**"],
        "minConfidence": 0.9
      },
      "unused-imports": {
        "enabled": false,
        "minConfidence": 0.95
      },
      "dead-code": {
        "enabled": false,
        "minConfidence": 0.95
      }
    }
  },
  
  "validation": {
    "runTests": true,
    "runTypeCheck": true,
    "runLinter": true,
    "testCommand": "npm test",
    "typeCheckCommand": "npm run type-check",
    "lintCommand": "npm run lint",
    "customCommands": ["npm run build"]
  },
  
  "whitelist": {
    "files": [
      "**/vendor/**",
      "**/generated/**",
      "**/node_modules/**",
      "**/*.min.js",
      "**/dist/**",
      "**/build/**"
    ],
    "patterns": [
      "_unused.*",
      "DEBUG_.*",
      "LEGACY_.*"
    ],
    "comments": [
      "@vibesweep-ignore",
      "@preserve",
      "eslint-disable-next-line no-console",
      "TODO: keep"
    ]
  },
  
  "aiPatterns": {
    "customPatterns": [
      "// This function.*",
      "// Helper function to.*",
      "// Utility for.*"
    ],
    "ignorePatterns": [
      "// Copyright.*",
      "// License.*"
    ]
  },
  
  "reporting": {
    "outputFormat": "text",
    "showFileDetails": true,
    "maxFilesToShow": 10,
    "sortBy": "wasteScore"
  }
}
```

## Configuration Sections

### thresholds

Control when Vibesweep flags issues:

```json
{
  "thresholds": {
    "maxWastePercentage": 40,      // Flag files > 40% waste
    "maxDuplicationRatio": 0.15,    // Flag files > 15% duplication
    "maxAIScore": 70                // Flag files > 70 AI score
  }
}
```

### analysis

Configure what files to analyze:

```json
{
  "analysis": {
    "includePatterns": ["src/**/*.js"],    // Only analyze src
    "excludePatterns": ["**/*.test.js"],   // Skip test files
    "minFileSize": 100,                    // Skip tiny files
    "maxFileSize": 1000000                 // Skip huge files
  }
}
```

### safety

Safe Fix safety settings:

```json
{
  "safety": {
    "requireGitClean": true,    // Require clean git state
    "requireBackup": true,      // Always create backups
    "requireTests": true,       // Run tests after fixes
    "maxFilesPerRun": 10,      // Limit batch size
    "dryRunByDefault": true    // Default to preview mode
  }
}
```

### fixes

Control which fixes are enabled:

```json
{
  "fixes": {
    "categories": {
      "console-logs": {
        "enabled": true,
        "excludePatterns": ["**/debug/**"],
        "minConfidence": 0.9
      }
    }
  }
}
```

### validation

Configure post-fix validation:

```json
{
  "validation": {
    "runTests": true,
    "testCommand": "jest",              // Custom test command
    "typeCheckCommand": "tsc --noEmit", // Custom type check
    "customCommands": [                 // Additional checks
      "npm run build",
      "npm run integration-test"
    ]
  }
}
```

### whitelist

Preserve specific code:

```json
{
  "whitelist": {
    "files": ["**/legacy/**"],           // Skip entire directories
    "patterns": ["_unused.*"],           // Preserve by name pattern
    "comments": ["@vibesweep-ignore"]    // Preserve by comment
  }
}
```

## Examples

### Minimal Configuration

```json
{
  "thresholds": {
    "maxWastePercentage": 30
  }
}
```

### Frontend Project

```json
{
  "analysis": {
    "includePatterns": ["src/**/*.{jsx,tsx}"],
    "excludePatterns": ["**/*.stories.js", "**/*.test.js"]
  },
  "fixes": {
    "categories": {
      "console-logs": {
        "enabled": true,
        "excludePatterns": ["src/debug/**"]
      }
    }
  }
}
```

### Conservative Settings

```json
{
  "thresholds": {
    "maxWastePercentage": 50,
    "maxAIScore": 80
  },
  "safety": {
    "dryRunByDefault": true,
    "maxFilesPerRun": 5,
    "confirmEachFile": true
  },
  "fixes": {
    "levels": {
      "ultra-safe": true,
      "safe": false,
      "experimental": false
    }
  }
}
```

### CI/CD Configuration

```json
{
  "analysis": {
    "excludePatterns": [
      "**/node_modules/**",
      "**/coverage/**",
      "**/dist/**"
    ]
  },
  "reporting": {
    "outputFormat": "json",
    "showFileDetails": false
  },
  "thresholds": {
    "maxWastePercentage": 25
  }
}
```

## Environment Variables

Some settings can be overridden with environment variables:

```bash
# Skip config file
VIBESWEEP_NO_CONFIG=true vibesweep analyze .

# Override output format
VIBESWEEP_OUTPUT=json vibesweep analyze .

# Set API key for Pro features
VIBESWEEP_API_KEY=your-key vibesweep analyze .
```

## Validation

Vibesweep validates your configuration and warns about:
- Unknown configuration keys
- Invalid patterns
- Conflicting settings
- Deprecated options

## Best Practices

1. **Start with defaults** - Only configure what you need
2. **Version control** - Commit `.vibesweeprc.json` to share with team
3. **Progressive strictness** - Start loose, tighten over time
4. **Document choices** - Add comments explaining thresholds
5. **Test configuration** - Run with `--dry-run` first

## Migration

### From v1 to v2

```json
// Old (v1)
{
  "ignorePaths": ["node_modules"]
}

// New (v2)
{
  "analysis": {
    "excludePatterns": ["**/node_modules/**"]
  }
}
```