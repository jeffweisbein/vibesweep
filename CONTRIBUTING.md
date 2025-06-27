# Contributing to Vibesweep 🧹

First off, thanks for taking the time to contribute! ❤️

## Code of Conduct

Be kind. We're all here to make code better.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- OS and Node version
- Steps to reproduce
- Expected vs actual behavior
- Code samples if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Provide:

- Clear use case
- Step-by-step description of the suggested enhancement
- Examples of how it would work
- Why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/vibesweep.git
cd vibesweep

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Project Structure

```
vibesweep/
├── src/
│   ├── analyzers/      # Detection algorithms
│   ├── core/           # Main analyzer logic
│   ├── detectors/      # Pattern definitions
│   ├── utils/          # Helper functions
│   └── cli.ts          # CLI interface
├── test/               # Test files
└── docs/               # Documentation
```

## Testing

- Write tests for any new functionality
- Run `npm test` before submitting PR
- Aim for >80% code coverage

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

## Adding New Detection Patterns

1. Add pattern to `src/detectors/patterns.ts`
2. Implement analyzer in `src/analyzers/`
3. Add tests for the new pattern
4. Update documentation

Example:
```typescript
// src/detectors/patterns.ts
export const AI_CODE_PATTERNS = {
  // ... existing patterns
  yourNewPattern: {
    description: "Detects X pattern",
    regex: /your-pattern/g,
    severity: 5
  }
};
```

## Questions?

Feel free to open an issue with the tag "question" or reach out on Discord!

## Recognition

Contributors will be added to our [CONTRIBUTORS.md](CONTRIBUTORS.md) file! 🌟