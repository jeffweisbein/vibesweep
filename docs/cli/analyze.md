# vibesweep analyze

Analyze a project for AI-generated waste, dead code, and duplications.

## Synopsis

```bash
vibesweep analyze <path> [options]
```

## Description

The `analyze` command scans your codebase to detect:
- AI-generated code patterns
- Dead code (unused variables, functions, imports)
- Code duplications
- TODO/FIXME comments (with --todos flag)

## Arguments

### `<path>`
The directory path to analyze. Use `.` for current directory.

## Options

### `-p, --pattern <pattern>`
File pattern to analyze. 
- Default: `**/*.{js,ts,jsx,tsx,py}`
- Examples:
  - `"**/*.ts"` - Only TypeScript files
  - `"src/**/*.{js,jsx}"` - Only JS files in src
  - `"**/*.vue"` - Vue components

### `-o, --output <format>`
Output format for results.
- Choices: `text`, `json`
- Default: `text`

### `--todos`
Include TODO/FIXME comment report in the analysis.

## Examples

### Basic analysis
```bash
# Analyze current directory
vibesweep analyze .

# Analyze specific directory
vibesweep analyze src/
```

### Custom file patterns
```bash
# Only TypeScript files
vibesweep analyze . --pattern "**/*.ts"

# Multiple extensions
vibesweep analyze . --pattern "**/*.{js,jsx,ts,tsx}"

# Specific directory pattern
vibesweep analyze . --pattern "src/**/*.js"
```

### Output formats
```bash
# Human-readable output (default)
vibesweep analyze .

# JSON output for parsing
vibesweep analyze . --output json

# JSON with pretty printing
vibesweep analyze . --output json | jq '.'
```

### Include TODOs
```bash
# Add TODO/FIXME report
vibesweep analyze . --todos
```

## Output

### Text Format
```
🧹 Vibesweep Analysis Report
──────────────────────────────────────────────────

📊 Overview:
  Total files analyzed: 142
  Total size: 1.2MB
  Total waste: 156KB
  Waste percentage: 13%

📈 Summary:
  Files with dead code: 23
  Files with duplications: 8
  AI-generated files: 45

💰 Potential Savings:
  Lines of code: 1,234
  Disk space: 156KB

🚨 Top Waste Offenders:
  [List of files with highest waste scores]
```

### JSON Format
```json
{
  "totalFiles": 142,
  "totalSize": 1258291,
  "totalWaste": 159872,
  "wastePercentage": 12.7,
  "summary": {
    "deadCodeFiles": 23,
    "duplicatedFiles": 8,
    "aiGeneratedFiles": 45,
    "estimatedSavings": {
      "lines": 1234,
      "kilobytes": 156
    }
  },
  "topOffenders": [...],
  "todos": [...]
}
```

## File Limits

- **Free tier**: Up to 100 files per analysis
- **Pro tier**: Unlimited files
- **API key**: Set `VIBESWEEP_API_KEY` environment variable

## Performance Tips

1. **Exclude directories**: Use `.gitignore` patterns
2. **Specific patterns**: Target only relevant file types
3. **Incremental analysis**: Analyze changed directories

## Common Patterns

```bash
# Frontend project
vibesweep analyze . --pattern "**/*.{js,jsx,ts,tsx}"

# Backend API
vibesweep analyze . --pattern "**/*.{js,ts}"

# Python project
vibesweep analyze . --pattern "**/*.py"

# Monorepo package
vibesweep analyze packages/web/
```

## Exit Codes

- `0`: Success
- `1`: Analysis failed or file limit exceeded

## See Also

- [fix](./fix.md) - Apply automated fixes
- [todos](./todos.md) - Extract TODO comments
- [Configuration](../configuration/config-file.md) - Configure analysis