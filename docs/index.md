# Vibesweep Documentation

Welcome to Vibesweep - your AI code waste detector and cleaner. Vibesweep helps you identify and remove AI-generated code artifacts, dead code, and duplications from your codebase.

## What is Vibesweep?

Vibesweep is a powerful CLI tool that analyzes your codebase to detect:
- 🤖 **AI-generated code patterns** - Identifies telltale signs of LLM-generated code
- 💀 **Dead code** - Finds unused functions, variables, and imports
- 🔄 **Code duplication** - Detects copy-pasted code blocks
- 📝 **TODO/FIXME tracking** - Extracts and reports on code debt markers
- 🧹 **Safe automated fixes** - Removes console.logs and other artifacts safely

## Quick Start

```bash
# Install globally
npm install -g vibesweep

# Analyze your project
vibesweep analyze .

# View detailed file analysis
vibesweep analyze src/ --output json

# Extract TODOs
vibesweep todos .
```

## Documentation

### Getting Started
- [Installation](./getting-started/installation.md)
- [Quick Start Guide](./getting-started/quick-start.md)
- [Understanding the Reports](./getting-started/understanding-reports.md)

### Features
- [AI Pattern Detection](./features/ai-detection.md)
- [Dead Code Analysis](./features/dead-code.md)
- [Duplication Detection](./features/duplication.md)
- [Safe Fix (Beta)](./features/safe-fix.md)

### Configuration
- [Configuration File](./configuration/config-file.md)
- [Command Line Options](./configuration/cli-options.md)
- [Whitelist & Ignore Patterns](./configuration/whitelist.md)

### CLI Reference
- [analyze](./cli/analyze.md)
- [fix](./cli/fix.md)
- [todos](./cli/todos.md)
- [clean](./cli/clean.md) (Pro)
- [report](./cli/report.md) (Pro)

### Advanced Topics
- [API Integration](./advanced/api.md)
- [CI/CD Integration](./advanced/ci-cd.md)
- [Custom Patterns](./advanced/custom-patterns.md)
- [Performance Tuning](./advanced/performance.md)

### Troubleshooting
- [Common Issues](./troubleshooting/common-issues.md)
- [FAQ](./troubleshooting/faq.md)
- [Getting Help](./troubleshooting/support.md)

## Why Vibesweep?

Modern development with AI assistants like GitHub Copilot and ChatGPT has revolutionized coding speed, but it comes with a hidden cost: **AI-generated code waste**.

### The Problem

- **Verbose patterns**: AI often generates unnecessarily verbose code
- **Redundant comments**: Over-documented obvious code
- **Debug artifacts**: Leftover console.logs and debug statements
- **Duplicate solutions**: Similar code patterns repeated across files
- **Dead code**: Unused functions and variables that accumulate over time

### The Solution

Vibesweep uses advanced AST parsing and pattern recognition to:
1. **Identify** AI-generated code patterns with high accuracy
2. **Analyze** your codebase for waste and inefficiencies
3. **Report** actionable insights with clear metrics
4. **Fix** safe issues automatically (with your approval)

## Getting Help

- 📧 Email: support@vibesweep.ai
- 💬 Discord: [Join our community](https://discord.gg/vibesweep)
- 🐛 Issues: [GitHub Issues](https://github.com/jeffweisbein/vibesweep/issues)
- 📖 Blog: [Best practices and tips](https://vibesweep.ai/blog)