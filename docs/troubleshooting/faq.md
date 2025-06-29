# Frequently Asked Questions

## General Questions

### What is Vibesweep?

Vibesweep is a CLI tool that detects and removes AI-generated code waste, dead code, and duplications from your codebase. It helps maintain code quality by identifying patterns typical of AI-generated code and providing actionable insights.

### How does Vibesweep detect AI-generated code?

Vibesweep uses pattern recognition to identify common characteristics of AI-generated code:
- Verbose conditional statements
- Redundant comments explaining obvious code
- Over-engineered simple functions
- Excessive boilerplate
- Debug artifacts like console.logs

Each pattern contributes to an AI score (0-100) indicating the likelihood of AI generation.

### Is Vibesweep accurate?

Vibesweep has high accuracy for common patterns but isn't perfect. It's designed to:
- Flag probable AI-generated code for review
- Identify definite waste (dead code, duplications)
- Provide metrics to track code quality over time

Always review findings before taking action.

### What languages does Vibesweep support?

Currently supported:
- JavaScript (.js, .mjs)
- TypeScript (.ts, .tsx)
- JSX (.jsx)
- Python (.py) - Basic support

Coming soon:
- Java
- C#
- Go
- Ruby

### Is my code sent to servers?

No. Vibesweep runs entirely locally on your machine. Your code never leaves your computer. The only network requests are for:
- License validation (Pro version)
- Anonymous usage statistics (optional)

## Usage Questions

### How often should I run Vibesweep?

Recommended frequency:
- **Weekly**: For active development teams
- **Before PRs**: As part of code review
- **Monthly**: For maintenance projects
- **Continuous**: In CI/CD pipelines

### What's a good waste percentage?

Typical benchmarks:
- **< 10%**: Excellent - well-maintained code
- **10-20%**: Good - normal for active projects  
- **20-30%**: Fair - cleanup recommended
- **> 30%**: Poor - immediate action needed

### Should I fix everything Vibesweep finds?

No. Vibesweep provides insights, but you should:
1. Review all findings
2. Prioritize high-waste files
3. Consider context (legacy code, external libraries)
4. Fix gradually to avoid breaking changes

### Can I use Vibesweep with git hooks?

Yes! Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
WASTE=$(vibesweep analyze . --output json | jq '.wastePercentage')
if (( $(echo "$WASTE > 25" | bc -l) )); then
  echo "Code waste too high: $WASTE%"
  exit 1
fi
```

## Safe Fix Questions

### Is Safe Fix really safe?

Yes, with multiple safety layers:
1. Git working tree must be clean
2. Automatic file backups
3. Preview all changes
4. Run tests after fixes
5. Automatic rollback on failure

However, it's still in beta - always review changes.

### What does Safe Fix currently fix?

Currently (v0.2.0):
- ✅ console.log removal
- ✅ console.debug removal  
- ✅ console.info removal

Coming soon:
- Unused imports
- Unused variables
- Debugger statements
- Empty catch blocks

### Can I undo Safe Fix changes?

Yes, multiple ways:
1. Automatic rollback if tests fail
2. Git backup branch: `git reset --hard vibesweep-backup-[timestamp]`
3. Manual restore: `vibesweep restore --backup [id]`

### Why does Safe Fix require clean git?

For safety. If something goes wrong, you need a clean state to return to. This prevents:
- Mixing Vibesweep changes with your work
- Losing uncommitted changes
- Confusion about what changed

## Configuration Questions

### Where should I put .vibesweeprc.json?

In your project root, alongside package.json. Vibesweep searches:
1. Current directory
2. Parent directories (up to git root)
3. Home directory (for global config)

### Can I have different configs for different directories?

Yes. Place `.vibesweeprc.json` in subdirectories for specific settings:

```
project/
├── .vibesweeprc.json          # Project defaults
├── src/
│   └── .vibesweeprc.json      # Stricter for source
└── scripts/
    └── .vibesweeprc.json      # Lenient for scripts
```

### How do I exclude files?

Three ways:

1. CLI: `vibesweep analyze . --exclude "**/vendor/**"`
2. Config file:
   ```json
   {
     "analysis": {
       "excludePatterns": ["**/vendor/**"]
     }
   }
   ```
3. .gitignore (automatically respected)

## Integration Questions

### Does Vibesweep work with ESLint?

Yes, they complement each other:
- ESLint: Style and syntax rules
- Vibesweep: AI patterns and code waste

Run both for comprehensive quality checks.

### Can I use Vibesweep in CI/CD?

Yes! See our [CI/CD Integration Guide](../advanced/ci-cd.md). Supports:
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI
- Bitbucket Pipelines

### Does Vibesweep integrate with IDEs?

Not yet, but coming soon:
- VS Code extension (Q2 2024)
- IntelliJ plugin (Q3 2024)
- Sublime Text package (Q4 2024)

## Pricing Questions

### What's included in the free version?

Free tier includes:
- ✅ Full analysis capabilities
- ✅ All detection patterns
- ✅ Safe Fix (beta)
- ✅ TODO extraction
- ❌ Limited to 100 files per run
- ❌ No API access

### What does Pro add?

Pro features:
- ✅ Unlimited file analysis
- ✅ API access
- ✅ Priority support
- ✅ Advanced reports
- ✅ Team features
- ✅ Historical tracking

### Do I need Pro for open source?

No! We offer free Pro licenses for:
- Open source projects
- Educational use
- Non-profits

Contact support@vibesweep.ai with your GitHub repo.

## Troubleshooting Questions

### Why is Vibesweep slow?

Common causes:
1. Large node_modules (exclude it)
2. Minified files (exclude *.min.js)
3. Generated files (exclude dist/)
4. Low memory (increase with NODE_OPTIONS)

### Why are some files not analyzed?

Check:
1. File extensions match patterns
2. Files aren't in excludePatterns
3. Files aren't in .gitignore
4. File size within limits
5. Valid syntax (parsing errors skip files)

### Can I contribute to Vibesweep?

Yes! We welcome contributions:
- Report bugs: GitHub issues
- Submit PRs: See CONTRIBUTING.md
- Share patterns: Discord community
- Write docs: Always needed!

## Privacy Questions

### What data does Vibesweep collect?

Optional anonymous telemetry:
- Command usage (analyze, fix, etc.)
- Error types (not content)
- Performance metrics
- No code content ever

Disable with: `VIBESWEEP_TELEMETRY=0`

### Is Vibesweep secure?

Yes:
- Runs locally only
- No code transmission
- Open source core
- Regular security audits

## Getting Help

### Where can I get support?

1. Documentation: https://vibesweep.ai/docs
2. GitHub Issues: https://github.com/jeffweisbein/vibesweep/issues
3. Discord: https://discord.gg/vibesweep
4. Email: support@vibesweep.ai (Pro only)

### How do I report bugs?

Include:
1. Vibesweep version: `vibesweep --version`
2. Node version: `node --version`
3. OS and version
4. Error messages
5. Steps to reproduce
6. Sample code (if possible)