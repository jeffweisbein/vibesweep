# Understanding Vibesweep Reports

Learn how to interpret Vibesweep's analysis results and take action on the findings.

## Report Sections

### 1. Overview Section

```
📊 Overview:
  Total files analyzed: 142      # All JS/TS files scanned
  Total size: 1.2MB             # Combined size of analyzed files
  Total waste: 156KB            # Estimated removable code
  Waste percentage: 13%         # Waste / Total size
```

**What to look for:**
- **Waste > 20%**: Significant cleanup opportunity
- **Waste > 40%**: Critical - immediate action needed
- **Waste < 10%**: Well-maintained codebase

### 2. Summary Metrics

```
📈 Summary:
  Files with dead code: 23      # Files containing unused code
  Files with duplications: 8    # Files with copy-pasted code
  AI-generated files: 45        # Files showing AI patterns
```

**Key insights:**
- High dead code count → Need better code review process
- High duplication → Consider extracting shared utilities
- High AI-generated count → Review AI assistant usage patterns

### 3. Waste Categories

#### Dead Code
- **Unused variables**: Declared but never referenced
- **Unused functions**: Defined but never called
- **Unused imports**: Imported but not used
- **Unreachable code**: Code after return statements

#### Duplication
- **Exact matches**: Identical code blocks
- **Similar patterns**: Near-duplicate with minor variations
- **Threshold**: Blocks > 50 tokens are flagged

#### AI Patterns
- **Verbose conditionals**: Over-engineered if statements
- **Redundant comments**: Comments explaining obvious code
- **Boilerplate excess**: Unnecessary ceremonial code
- **Debug artifacts**: Console.logs and debug statements

### 4. Waste Score Calculation

```
Waste Score = (Dead Code % × 0.4) + (Duplication % × 0.3) + (AI Score × 0.3)
```

- **0-20%**: Clean file
- **21-40%**: Needs attention
- **41-60%**: High priority
- **61-100%**: Critical cleanup needed

### 5. AI Detection Score

The AI score (0-100) indicates likelihood of AI generation:

- **0-30**: Human-written
- **31-60**: Mixed human/AI
- **61-80**: Likely AI-generated
- **81-100**: Definitely AI-generated

## Reading File-Level Reports

```
src/utils/helpers.js
   Waste Score: 67%              # Overall waste level
   Dead Code: 45%                # Unused code percentage
   Duplication: 12%              # Duplicated code percentage
   AI Score: 89/100              # AI generation likelihood
   Patterns: verbose-conditionals # Specific issues found
```

## JSON Output Format

For programmatic processing:

```json
{
  "summary": {
    "totalFiles": 142,
    "totalSize": 1258291,
    "totalWaste": 159872,
    "wastePercentage": 12.7
  },
  "files": [
    {
      "path": "src/utils/helpers.js",
      "wasteScore": 67,
      "deadCode": {
        "ratio": 0.45,
        "unusedFunctions": ["formatDate", "parseJSON"],
        "unusedVariables": ["config", "DEFAULT_TIMEOUT"]
      },
      "duplication": {
        "ratio": 0.12,
        "blocks": [
          {
            "lines": "45-67",
            "duplicateIn": ["src/utils/format.js:23-45"]
          }
        ]
      },
      "aiPatterns": {
        "score": 89,
        "patterns": ["verbose-conditionals", "redundant-comments"]
      }
    }
  ]
}
```

## Taking Action

### Priority Matrix

1. **Critical (Waste > 60%)**
   - Immediate refactoring needed
   - Consider full file rewrite
   - Review with senior developer

2. **High (Waste 40-60%)**
   - Schedule for next sprint
   - Focus on dead code removal
   - Extract duplicated code

3. **Medium (Waste 20-40%)**
   - Include in regular maintenance
   - Good for junior developer tasks
   - Document patterns to avoid

4. **Low (Waste < 20%)**
   - Monitor for regression
   - Address during feature work
   - Use as good examples

### Common Fixes

**For Dead Code:**
```javascript
// Before
function unused() { return 42; }  // Never called
const config = { debug: true };   // Never used

// After
// Functions and variables removed
```

**For Duplication:**
```javascript
// Before
// File A
const formatUser = (user) => {
  return `${user.firstName} ${user.lastName}`;
};

// File B
const displayName = (person) => {
  return `${person.firstName} ${person.lastName}`;
};

// After
// Shared utility
export const formatFullName = (obj) => {
  return `${obj.firstName} ${obj.lastName}`;
};
```

**For AI Patterns:**
```javascript
// Before (AI-generated)
if (user !== null && user !== undefined && user.id !== null && user.id !== undefined) {
  // Overly verbose null checking
}

// After (Human-optimized)
if (user?.id) {
  // Clean optional chaining
}
```

## Best Practices

1. **Run regularly**: Weekly scans prevent waste accumulation
2. **Set thresholds**: Configure acceptable waste levels
3. **Track progress**: Monitor waste percentage over time
4. **Team education**: Share reports in code reviews
5. **Gradual improvement**: Focus on worst offenders first