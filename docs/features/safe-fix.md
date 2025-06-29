# Safe Fix (Beta)

Vibesweep's Safe Fix feature automatically removes code artifacts with comprehensive safety measures to ensure your code never breaks.

## Overview

Safe Fix is designed with one principle: **Never break working code**. Every fix goes through multiple safety layers:

1. 🔍 **Pre-flight checks** - Verify git status and run tests
2. 💾 **Automatic backups** - Every file backed up before changes
3. 👀 **Preview changes** - Review diffs before applying
4. ✅ **Validation suite** - Tests, type-check, and lint after fixes
5. ↩️ **Atomic rollback** - Automatic restoration if anything fails

## Safety Layers

### 1. Git Integration

```bash
✓ Git working tree is clean
✓ Created backup branch: vibesweep-backup-2024-01-15-143022
```

- Requires clean working tree (no uncommitted changes)
- Creates backup branch before any modifications
- Allows easy recovery via git reset

### 2. File Backup System

```
✓ Created backup a7cdba32e69ac321 with 23 files
```

- Creates temporary backup of all files to be modified
- Stores in system temp directory
- Automatic cleanup after successful operation
- Instant restore capability if validation fails

### 3. Change Preview

```diff
[1/8] src/utils/helpers.ts
  - Remove console.log (line 45)
  - Remove console.debug (line 67)
  
  --- a/src/utils/helpers.ts
  +++ b/src/utils/helpers.ts
  @@ -42,7 +41,6 @@
     const result = transform(data);
  -  console.log('Processing complete', result);
     return result;
```

- Shows exact changes before applying
- File-by-file or bulk approval
- Skip individual changes if needed

### 4. Validation Suite

```
✓ Tests passed
✓ Type checking passed
✓ Linting passed
```

- Runs your existing test suite
- Verifies TypeScript compilation
- Checks ESLint rules
- Configurable validation commands

### 5. Atomic Operations

- All changes succeed or none are applied
- Automatic rollback on any failure
- Never leaves code in broken state

## Current Capabilities

### Console.log Removal (Ultra-Safe)

Removes development artifacts:
- `console.log()`
- `console.debug()`
- `console.info()`

Does NOT remove:
- `console.error()` - May be intentional
- `console.warn()` - May be intentional
- Test files - Logs may be needed
- Preserved patterns - `@vibesweep-ignore`

### Intelligent Detection

```javascript
// Removed - simple console.log
console.log('debug info');

// Removed - multi-line
console.log(
  'complex',
  'multi-line',
  'statement'
);

// Preserved - marked to ignore
// @vibesweep-ignore
console.log('keep this');

// Preserved - in test file
// file: user.test.js
console.log('test output');

// Smart handling of inline code
const x = 5; console.log(x); const y = 10;
// Becomes: const x = 5;  const y = 10;
```

## Configuration

### .vibesweeprc.json

```json
{
  "safety": {
    "requireGitClean": true,
    "requireBackup": true,
    "requireTests": true,
    "maxFilesPerRun": 10,
    "dryRunByDefault": true
  },
  
  "fixes": {
    "categories": {
      "console-logs": {
        "enabled": true,
        "excludePatterns": ["**/debug/**", "**/scripts/**"],
        "minConfidence": 0.9
      }
    }
  },
  
  "validation": {
    "runTests": true,
    "runTypeCheck": true,
    "runLinter": true,
    "testCommand": "npm test",
    "typeCheckCommand": "npm run type-check",
    "lintCommand": "npm run lint"
  },
  
  "whitelist": {
    "files": [
      "**/vendor/**",
      "**/generated/**",
      "**/*.min.js"
    ],
    "comments": [
      "@vibesweep-ignore",
      "@preserve",
      "eslint-disable-next-line no-console"
    ]
  }
}
```

## Usage Workflow

### 1. Prepare
```bash
# Ensure clean git state
git status
git commit -am "Save work before cleanup"
```

### 2. Preview
```bash
# See what would be fixed
vibesweep fix . --dry-run
```

### 3. Apply
```bash
# Run with all safety checks
vibesweep fix .
```

### 4. Verify
```bash
# Review changes
git diff

# Run tests
npm test
```

### 5. Commit
```bash
# If everything looks good
git commit -am "Remove console.logs with Vibesweep"
```

## Recovery Options

### If Something Goes Wrong

#### Option 1: Git Reset
```bash
# Vibesweep created a backup branch
git reset --hard vibesweep-backup-2024-01-15-143022
```

#### Option 2: Automatic Rollback
If validation fails, Vibesweep automatically restores from backup:
```
✗ Validation failed!
✓ Rolling back changes...
✓ Changes rolled back successfully
```

#### Option 3: Manual Recovery
```bash
# List recent backups
vibesweep backups list

# Restore specific backup
vibesweep restore --backup a7cdba32e69ac321
```

## Best Practices

### Do's ✅

1. **Always commit first** - Never run on uncommitted changes
2. **Start small** - Fix one directory at a time
3. **Use dry-run** - Preview changes before applying
4. **Review diffs** - Check every change before committing
5. **Run tests** - Ensure your test suite passes

### Don'ts ❌

1. **Skip git check** - The `--no-git-check` flag is dangerous
2. **Disable backups** - Always keep backups enabled
3. **Auto-confirm everything** - Review changes carefully
4. **Fix everything at once** - Gradual cleanup is safer
5. **Ignore validation failures** - They indicate real problems

## Roadmap

### Coming Soon

#### Level 2: Safe Fixes
- Unused imports removal
- Unused local variables (no side effects)
- Empty catch blocks
- Debugger statements

#### Level 3: Intelligent Fixes
- Dead function removal
- Duplicate code extraction
- Unused exports (with cross-file analysis)

#### Future Enhancements
- Machine learning confidence scoring
- Team-specific pattern learning
- Custom fix providers
- IDE integration

## FAQ

### Q: Will this break my code?
A: Safe Fix is designed with multiple safety layers. If anything could break, the operation is cancelled and changes are rolled back.

### Q: What if I need to keep some console.logs?
A: Use `@vibesweep-ignore` comment or configure whitelist patterns in `.vibesweeprc.json`.

### Q: Can I undo changes?
A: Yes! Use the git backup branch, or Vibesweep's restore command.

### Q: Why is it in beta?
A: We're being extra cautious. The core functionality is stable, but we want more real-world testing before v1.0.

### Q: How is this different from ESLint --fix?
A: Vibesweep provides comprehensive safety measures (backups, validation, rollback) and focuses specifically on AI-generated waste patterns.

## Getting Help

- Report issues: [GitHub Issues](https://github.com/jeffweisbein/vibesweep/issues)
- Ask questions: [Discord Community](https://discord.gg/vibesweep)
- Email support: support@vibesweep.ai