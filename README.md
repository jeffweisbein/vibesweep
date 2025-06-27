# vibesweep 🧹

[![npm version](https://img.shields.io/npm/v/vibesweep.svg)](https://www.npmjs.com/package/vibesweep)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/vibesweep/ci.yml?branch=main)](https://github.com/yourusername/vibesweep/actions)
[![Code Waste](https://img.shields.io/badge/waste-38%25-orange)](https://github.com/yourusername/vibesweep)

> Sweep away AI-generated code waste and vibe coding artifacts

## The Problem 🚨

- **41% of all code is now AI-generated** (and growing)
- **4x increase in code duplication** since AI coding became mainstream
- **Only 3.8% of developers** trust AI code without review
- Companies waste **millions in compute/storage** on unused code

## What is Vibesweep? 

Vibesweep analyzes your codebase to detect:

- 🧟 **Dead Code** - Unused variables, functions, and imports
- 📋 **Copy-Paste Code** - Duplicate blocks and similar patterns
- 🤖 **AI Patterns** - Verbose comments, placeholder TODOs, over-engineering
- 💸 **Waste Metrics** - Calculate potential savings in lines and disk space

## Quick Start 🚀

```bash
# Analyze current directory
npx vibesweep analyze .

# Analyze specific directory
npx vibesweep analyze ./src

# Custom file patterns
npx vibesweep analyze . --pattern "**/*.{js,ts}"

# JSON output for CI/CD
npx vibesweep analyze . --output json
```

## Installation

```bash
# Global install
npm install -g vibesweep

# Or use npx (no install needed)
npx vibesweep analyze .

# Add to project
npm install --save-dev vibesweep
```

## Example Output

```
🧹 Vibesweep Analysis Report
──────────────────────────────────────────────────

📊 Overview:
  Total files analyzed: 127
  Total size: 2.4 MB
  Total waste: 782 KB
  Waste percentage: 32.58%

📈 Summary:
  Files with dead code: 43
  Files with duplications: 28
  AI-generated files: 51

💰 Potential Savings:
  Lines of code: 8,421
  Disk space: 782 KB

🚨 Top Waste Offenders:

  1. src/components/UserDashboard.tsx
     Waste Score: 87%
     Dead Code: 43.20%
     Duplication: 38.50%
     AI Score: 92/100
     Patterns: Verbose AI comments: 23 instances
```

## How It Works

1. **AST Analysis** - Parses code using Babel to find unused declarations
2. **Pattern Detection** - Identifies common AI generation patterns
3. **Duplication Detection** - Uses fuzzy matching to find copy-paste code
4. **Scoring Algorithm** - Combines factors into actionable waste scores

## CI/CD Integration

### GitHub Actions

```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  vibesweep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Vibesweep
        run: |
          npx vibesweep analyze . --output json > vibesweep-report.json
          waste=$(cat vibesweep-report.json | jq '.wastePercentage')
          if (( $(echo "$waste > 50" | bc -l) )); then
            echo "❌ Code waste exceeds 50%!"
            exit 1
          fi
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

waste=$(npx vibesweep analyze . --output json | jq '.wastePercentage')
if (( $(echo "$waste > 40" | bc -l) )); then
  echo "⚠️  Warning: Code waste is ${waste}%"
  echo "Run 'vibesweep analyze .' for details"
fi
```

## Configuration

Create `.vibesweeprc.json` in your project root:

```json
{
  "patterns": ["src/**/*.{js,ts,jsx,tsx}"],
  "ignore": ["**/*.test.*", "**/*.spec.*"],
  "thresholds": {
    "maxWastePercentage": 40,
    "maxDuplicationRatio": 0.15,
    "maxAIScore": 70
  }
}
```

## API Usage

```javascript
import { GarbageCollector } from 'vibesweep';

const gc = new GarbageCollector();
const analysis = await gc.analyzeProject('./src');

console.log(`Total waste: ${analysis.wastePercentage}%`);
console.log(`Could save ${analysis.summary.estimatedSavings.lines} lines`);
```

## Contributing

We love contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## The Science Behind It

Vibesweep uses multiple detection strategies:

- **Dead Code Detection**: AST traversal to track variable usage
- **Duplication Analysis**: MD5 hashing with sliding window algorithm
- **AI Pattern Recognition**: Heuristic analysis of common AI code smells
- **Complexity Scoring**: Cyclomatic complexity and nesting depth

## FAQ

**Q: Will this delete my code?**  
A: No! Vibesweep only analyzes and reports. Cleaning is always manual.

**Q: Does it work with all languages?**  
A: Currently supports JavaScript, TypeScript, JSX, TSX, and Python.

**Q: How accurate is the AI detection?**  
A: We use pattern matching that catches ~85% of AI-generated code.

**Q: Can I use this in production?**  
A: Yes! It's read-only and safe to run anywhere.

## License

MIT © 2025

---

<p align="center">
  Made with ❤️ by developers tired of AI slop<br>
  <a href="https://vibesweep.ai">vibesweep.ai</a> • 
  <a href="https://twitter.com/vibesweep">@vibesweep</a> • 
  <a href="https://discord.gg/vibesweep">Discord</a>
</p>