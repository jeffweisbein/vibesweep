# vibesweep fix

Safely fix issues in your codebase (BETA).

## Synopsis

```bash
vibesweep fix [path] [options]
```

## Description

The `fix` command safely removes code artifacts like console.log statements with comprehensive safety measures:
- Git status verification
- Automatic backups
- Change preview with diffs
- Test/lint validation
- Atomic operations with rollback

**Note**: This feature is in BETA. Always review changes before committing.

## Arguments

### `[path]`
Path to analyze. Default: `.` (current directory)

## Options

### `--dry-run`
Show what would be fixed without making changes.

### `--no-git-check`
Skip git clean working tree check. **Not recommended** for safety.

### `--no-backup`
Skip creating file backups. **Not recommended**.

### `--no-validation`
Skip running tests/lint after fixes.

### `--auto-confirm`
Skip confirmation prompts. Use with caution.

### `--max-files <number>`
Maximum files to process per run.
- Default: `10`

### `--include <patterns>`
Glob patterns to include.
- Default: `**/*.{js,jsx,ts,tsx}`

### `--exclude <patterns>`
Glob patterns to exclude.
- Default: `**/node_modules/**,**/dist/**,**/build/**`

## Safety Features

### 1. Pre-flight Checks
- ✅ Git working tree must be clean
- ✅ Backup branch created automatically
- ✅ Tests must pass before fixes

### 2. Change Preview
```
Found 23 fixes across 8 files:
  
[1/8] src/utils/helpers.ts
  - Remove console.log (line 45)
  - Remove console.debug (line 67)
  
  Preview changes? [Y/n/skip/all]: y
  
  --- a/src/utils/helpers.ts
  +++ b/src/utils/helpers.ts
  @@ -42,7 +41,6 @@
     const result = transform(data);
  -  console.log('Processing complete', result);
     return result;
  
  Apply these changes? [Y/n/edit]:
```

### 3. Validation
After applying fixes, Vibesweep runs:
- Test suite
- Type checking
- Linting

If any validation fails, changes are automatically rolled back.

## Examples

### Basic usage
```bash
# Dry run to preview changes
vibesweep fix . --dry-run

# Apply fixes with all safety checks
vibesweep fix .

# Fix specific directory
vibesweep fix src/
```

### Advanced usage
```bash
# Process more files
vibesweep fix . --max-files 50

# Skip git check (not recommended)
vibesweep fix . --no-git-check

# Auto-confirm all changes
vibesweep fix . --auto-confirm

# Custom file patterns
vibesweep fix . --include "src/**/*.js" --exclude "**/*.test.js"
```

## Configuration

Create `.vibesweeprc.json` to configure fix behavior:

```json
{
  "safety": {
    "requireGitClean": true,
    "requireBackup": true,
    "requireTests": true,
    "maxFilesPerRun": 10
  },
  "fixes": {
    "categories": {
      "console-logs": {
        "enabled": true,
        "excludePatterns": ["**/debug/**"]
      }
    }
  },
  "whitelist": {
    "comments": ["@vibesweep-ignore", "@preserve"],
    "files": ["**/vendor/**", "**/generated/**"]
  }
}
```

## Currently Supported Fixes

### Console.log Removal (Ultra-Safe)
- Removes `console.log()`, `console.debug()`, `console.info()`
- Preserves code with `@vibesweep-ignore` comments
- Skips test files automatically
- Handles multi-line console statements

### Coming Soon
- Unused imports removal
- Dead variable removal
- Debugger statement removal

## Whitelist Patterns

Preserve specific code:

```javascript
// @vibesweep-ignore
console.log('This will be preserved');

// eslint-disable-next-line no-console
console.log('Also preserved');
```

## Workflow

1. **Commit current changes**: Ensure clean git state
2. **Run analysis**: `vibesweep analyze .` to identify issues
3. **Preview fixes**: `vibesweep fix . --dry-run`
4. **Apply fixes**: `vibesweep fix .`
5. **Review changes**: `git diff`
6. **Run tests**: Ensure everything works
7. **Commit**: `git commit -m "Remove console.logs"`

## Rollback

If something goes wrong:

```bash
# Vibesweep creates a backup branch
git reset --hard vibesweep-backup-[timestamp]

# Or restore from the automatic backup
vibesweep restore --backup [backup-id]
```

## Exit Codes

- `0`: Success or no fixes needed
- `1`: Fix operation failed

## Best Practices

1. **Always commit first**: Never run on uncommitted changes
2. **Start small**: Fix one directory at a time
3. **Review carefully**: Check diffs before committing
4. **Test thoroughly**: Run full test suite after fixes
5. **Gradual adoption**: Start with console.log removal

## See Also

- [analyze](./analyze.md) - Analyze before fixing
- [Configuration](../configuration/config-file.md) - Configure fix behavior
- [Safe Fix Guide](../features/safe-fix.md) - Detailed safety documentation