# vibesweep todos

Extract all TODO and FIXME comments from your codebase.

## Synopsis

```bash
vibesweep todos <path> [options]
```

## Description

The `todos` command scans your codebase for TODO, FIXME, HACK, and other code debt markers, presenting them in an organized report.

## Arguments

### `<path>`
The directory path to scan. Use `.` for current directory.

## Options

### `-p, --pattern <pattern>`
File pattern to scan.
- Default: `**/*.{js,ts,jsx,tsx,py}`

### `--markdown`
Output as markdown format instead of colored terminal output.

## Detected Patterns

Vibesweep detects these comment patterns:
- `TODO:` - General tasks
- `FIXME:` - Bugs to fix
- `HACK:` - Temporary workarounds
- `NOTE:` - Important notes
- `OPTIMIZE:` - Performance improvements
- `REFACTOR:` - Code improvement tasks

## Examples

### Basic usage
```bash
# Scan current directory
vibesweep todos .

# Scan specific directory
vibesweep todos src/
```

### Custom patterns
```bash
# Only TypeScript files
vibesweep todos . --pattern "**/*.ts"

# Multiple directories
vibesweep todos src/ lib/ --pattern "**/*.{js,ts}"
```

### Markdown output
```bash
# Generate markdown report
vibesweep todos . --markdown > TODOS.md

# For GitHub issues
vibesweep todos . --markdown
```

## Output Format

### Terminal Output
```
📝 TODO/FIXME Report
══════════════════════════════════════════════════

src/api/auth.js
  Line 23: TODO: Add rate limiting to login endpoint
  Line 45: FIXME: Token expiration not working properly
  Line 67: HACK: Temporary fix for session handling

src/utils/validation.js
  Line 12: TODO: Add email validation
  Line 34: OPTIMIZE: This regex is slow for large inputs

Summary:
  Total: 5 items
  TODO: 2
  FIXME: 1
  HACK: 1
  OPTIMIZE: 1
```

### Markdown Output
```markdown
# TODO/FIXME Report

## src/api/auth.js
- [ ] **Line 23**: TODO: Add rate limiting to login endpoint
- [ ] **Line 45**: FIXME: Token expiration not working properly
- [ ] **Line 67**: HACK: Temporary fix for session handling

## src/utils/validation.js
- [ ] **Line 12**: TODO: Add email validation
- [ ] **Line 34**: OPTIMIZE: This regex is slow for large inputs

---
**Summary**: 5 items (TODO: 2, FIXME: 1, HACK: 1, OPTIMIZE: 1)
```

## Integration Ideas

### Create GitHub Issues
```bash
# Generate markdown and create issues
vibesweep todos . --markdown | gh issue create --title "Technical Debt" --body-file -
```

### Track Progress
```bash
# Save baseline
vibesweep todos . --markdown > todos-baseline.md

# Check progress later
vibesweep todos . --markdown > todos-current.md
diff todos-baseline.md todos-current.md
```

### CI Integration
```bash
# Fail if too many TODOs
TODO_COUNT=$(vibesweep todos . --output json | jq '.summary.total')
if [ $TODO_COUNT -gt 50 ]; then
  echo "Too many TODOs: $TODO_COUNT"
  exit 1
fi
```

## Best Practices

### Good TODO Comments
```javascript
// TODO(john): Implement caching by Q4 2024
// FIXME(#123): User.save() fails with null email
// HACK: Remove after upgrading to React 18
```

### Bad TODO Comments
```javascript
// TODO: Fix this
// FIXME: Broken
// TODO: Later
```

## Filtering

Future versions will support:
- Filter by type (TODO only, FIXME only)
- Filter by age (using git blame)
- Filter by assignee
- Priority levels

## Exit Codes

- `0`: Success
- `1`: Scan failed

## See Also

- [analyze](./analyze.md) - Full codebase analysis
- [Configuration](../configuration/config-file.md) - Configure scanning