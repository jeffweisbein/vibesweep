# Quick Start Guide

Get up and running with Vibesweep in 5 minutes!

## Your First Analysis

Navigate to your project directory and run:

```bash
vibesweep analyze .
```

This will analyze all JavaScript and TypeScript files in your project and show you:
- Total waste percentage
- Number of files with issues
- Top waste offenders
- Potential savings in lines of code and disk space

## Understanding the Output

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

  1. src/utils/helpers.js
     Waste Score: 67%
     Dead Code: 45%
     Duplication: 12%
     AI Score: 89/100
     Patterns: verbose-conditionals

  2. src/components/UserList.tsx
     Waste Score: 54%
     Dead Code: 23%
     Duplication: 31%
     AI Score: 76/100
```

## Common Commands

### Analyze specific directories

```bash
# Analyze only the src directory
vibesweep analyze src/

# Analyze multiple directories
vibesweep analyze src/ lib/ utils/
```

### Change output format

```bash
# Get JSON output for parsing
vibesweep analyze . --output json

# Include TODO/FIXME report
vibesweep analyze . --todos
```

### Filter by file patterns

```bash
# Analyze only TypeScript files
vibesweep analyze . --pattern "**/*.ts"

# Analyze React components
vibesweep analyze . --pattern "**/*.{jsx,tsx}"
```

## Extract TODOs

Find all TODO and FIXME comments:

```bash
vibesweep todos .

# Output as markdown
vibesweep todos . --markdown
```

## Safe Fix (Beta)

Remove console.log statements safely:

```bash
# Preview what would be removed (dry run)
vibesweep fix . --dry-run

# Apply fixes with confirmation
vibesweep fix .

# Skip git check (not recommended)
vibesweep fix . --no-git-check
```

## What's Next?

1. **Configure Vibesweep**: Create a [.vibesweeprc.json](../configuration/config-file.md) file
2. **Understand patterns**: Learn about [AI detection patterns](../features/ai-detection.md)
3. **Integrate with CI**: Set up [CI/CD integration](../advanced/ci-cd.md)
4. **Customize**: Define [custom patterns](../advanced/custom-patterns.md) for your team

## Tips for Best Results

1. **Start small**: Analyze a single directory first to understand the reports
2. **Regular scans**: Run Vibesweep weekly to prevent waste accumulation
3. **Team adoption**: Share reports with your team to establish coding standards
4. **Gradual cleanup**: Don't try to fix everything at once - prioritize high-waste files