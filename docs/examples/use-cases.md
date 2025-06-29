# Use Cases & Examples

Real-world examples of using Vibesweep to improve code quality.

## Common Scenarios

### 1. New Project Audit

**Scenario**: You've inherited a codebase or joined a new team.

```bash
# Get overview
vibesweep analyze . > initial-report.txt

# Find worst offenders
vibesweep analyze . --output json | jq '.topOffenders[:5]'

# Extract all TODOs
vibesweep todos . --markdown > TODOS.md

# Check specific concerns
vibesweep analyze src/ --pattern "**/*.js"
```

**Action Plan**:
1. Review top 5 waste files
2. Schedule cleanup sprints
3. Set waste percentage baseline
4. Add to CI pipeline

### 2. Pre-Release Cleanup

**Scenario**: Preparing for a major release.

```bash
# Full analysis
vibesweep analyze .

# Safe cleanup
vibesweep fix . --dry-run
vibesweep fix src/ --max-files 20

# Verify improvements
vibesweep analyze . > post-cleanup.txt
diff initial-report.txt post-cleanup.txt
```

### 3. CI/CD Integration

**Scenario**: Maintain quality standards automatically.

`.github/workflows/quality.yml`:
```yaml
- name: Code Quality Gate
  run: |
    npx vibesweep analyze . --output json > report.json
    WASTE=$(jq '.wastePercentage' report.json)
    AI_SCORE=$(jq '.summary.averageAIScore // 0' report.json)
    
    if (( $(echo "$WASTE > 25" | bc -l) )); then
      echo "::error::Code waste too high: ${WASTE}%"
      exit 1
    fi
    
    if (( $(echo "$AI_SCORE > 70" | bc -l) )); then
      echo "::warning::High AI-generated code detected"
    fi
```

### 4. Team Code Review

**Scenario**: Establish team coding standards.

```bash
# Generate report for discussion
vibesweep analyze . --output json | \
  jq '{
    summary: .summary,
    worst_files: .topOffenders[:10],
    patterns: .topOffenders | map(.aiPatterns.patterns) | flatten | group_by(.) | map({pattern: .[0], count: length}) | sort_by(.count) | reverse
  }' > team-review.json

# Create actionable list
vibesweep todos . --markdown > technical-debt.md
```

## Project-Specific Examples

### React Application

**.vibesweeprc.json**:
```json
{
  "analysis": {
    "includePatterns": ["src/**/*.{jsx,tsx}"],
    "excludePatterns": [
      "**/*.test.tsx",
      "**/*.stories.tsx",
      "**/node_modules/**"
    ]
  },
  "thresholds": {
    "maxWastePercentage": 20,
    "maxAIScore": 60
  },
  "whitelist": {
    "comments": ["@generated", "eslint-disable"]
  }
}
```

**Usage**:
```bash
# Check components
vibesweep analyze src/components/

# Find unused imports in containers
vibesweep analyze src/containers/ --output json | \
  jq '.files[] | select(.deadCode.unusedImports | length > 0)'
```

### Node.js API

**.vibesweeprc.json**:
```json
{
  "analysis": {
    "includePatterns": ["src/**/*.js", "lib/**/*.js"],
    "excludePatterns": ["**/migrations/**", "**/seeds/**"]
  },
  "fixes": {
    "categories": {
      "console-logs": {
        "enabled": true,
        "excludePatterns": ["**/logger.js", "**/debug/**"]
      }
    }
  }
}
```

**Usage**:
```bash
# Analyze API routes
vibesweep analyze src/routes/

# Clean up safely
vibesweep fix src/controllers/ --dry-run
```

### TypeScript Monorepo

**.vibesweeprc.json**:
```json
{
  "analysis": {
    "includePatterns": ["packages/*/src/**/*.ts"],
    "excludePatterns": ["**/dist/**", "**/*.d.ts"]
  },
  "validation": {
    "testCommand": "yarn test",
    "typeCheckCommand": "yarn type-check",
    "customCommands": ["yarn build"]
  }
}
```

**Usage**:
```bash
# Analyze each package
for pkg in packages/*; do
  echo "Analyzing $pkg"
  vibesweep analyze "$pkg"
done

# Fix with validation
vibesweep fix packages/core/ --max-files 5
```

## Advanced Patterns

### 1. Track Progress Over Time

```bash
#!/bin/bash
# track-progress.sh

DATE=$(date +%Y-%m-%d)
vibesweep analyze . --output json > "reports/vibesweep-$DATE.json"

# Generate trend
jq -s '
  map({
    date: input_filename | split("-")[-1] | split(".")[0],
    waste: .wastePercentage,
    ai_score: .summary.averageAIScore
  })
' reports/*.json > trend.json
```

### 2. Custom Reporting

```javascript
// generate-report.js
const { execSync } = require('child_process');
const fs = require('fs');

const report = JSON.parse(
  execSync('vibesweep analyze . --output json', { encoding: 'utf-8' })
);

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Code Quality Report</title>
  <style>
    .critical { color: red; }
    .warning { color: orange; }
    .good { color: green; }
  </style>
</head>
<body>
  <h1>Vibesweep Report</h1>
  <p class="${report.wastePercentage > 20 ? 'critical' : 'good'}">
    Waste: ${report.wastePercentage.toFixed(1)}%
  </p>
  <h2>Top Issues</h2>
  <ul>
    ${report.topOffenders.slice(0, 10).map(file => `
      <li>${file.filePath} - ${file.wasteScore}%</li>
    `).join('')}
  </ul>
</body>
</html>
`;

fs.writeFileSync('report.html', html);
```

### 3. Pre-commit Hook

`.git/hooks/pre-commit`:
```bash
#!/bin/bash

# Check only staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|jsx|tsx)$')

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

# Create temp directory with staged content
TMPDIR=$(mktemp -d)
for FILE in $STAGED_FILES; do
  mkdir -p "$TMPDIR/$(dirname $FILE)"
  git show ":$FILE" > "$TMPDIR/$FILE"
done

# Analyze staged files
WASTE=$(vibesweep analyze "$TMPDIR" --output json | jq '.wastePercentage')
rm -rf "$TMPDIR"

if (( $(echo "$WASTE > 30" | bc -l) )); then
  echo "❌ Staged files have ${WASTE}% waste (max: 30%)"
  echo "Run 'vibesweep fix .' to clean up"
  exit 1
fi

echo "✅ Code quality check passed (${WASTE}% waste)"
```

### 4. Slack Integration

```javascript
// slack-report.js
const { execSync } = require('child_process');
const https = require('https');

const report = JSON.parse(
  execSync('vibesweep analyze . --output json', { encoding: 'utf-8' })
);

const emoji = report.wastePercentage > 20 ? '🔴' : '🟢';
const message = {
  text: `${emoji} Code Quality Report`,
  attachments: [{
    color: report.wastePercentage > 20 ? 'danger' : 'good',
    fields: [
      {
        title: 'Waste Percentage',
        value: `${report.wastePercentage.toFixed(1)}%`,
        short: true
      },
      {
        title: 'Files Analyzed',
        value: report.totalFiles,
        short: true
      },
      {
        title: 'Top Offender',
        value: report.topOffenders[0]?.filePath || 'None',
        short: false
      }
    ]
  }]
};

// Post to Slack webhook
const webhook = process.env.SLACK_WEBHOOK_URL;
// ... send message
```

## Team Workflows

### 1. Weekly Quality Review

```bash
#!/bin/bash
# weekly-review.sh

echo "📊 Weekly Code Quality Review"
echo "============================"
echo

# Current status
echo "Current Status:"
vibesweep analyze . | grep -E "(Waste percentage|AI-generated files)"

# Week-over-week change
if [ -f last-week.json ]; then
  LAST_WASTE=$(jq '.wastePercentage' last-week.json)
  CURRENT_WASTE=$(vibesweep analyze . --output json | tee this-week.json | jq '.wastePercentage')
  CHANGE=$(echo "$CURRENT_WASTE - $LAST_WASTE" | bc)
  
  echo "Change from last week: ${CHANGE}%"
fi

# Top fixes needed
echo -e "\nTop 5 files to fix:"
vibesweep analyze . --output json | \
  jq -r '.topOffenders[:5] | .[] | "\(.wasteScore)% - \(.filePath)"'

# Move this week to last week
mv this-week.json last-week.json 2>/dev/null || true
```

### 2. Sprint Planning

```javascript
// sprint-tasks.js
const { execSync } = require('child_process');

const report = JSON.parse(
  execSync('vibesweep analyze . --output json', { encoding: 'utf-8' })
);

// Generate JIRA-compatible tasks
const tasks = report.topOffenders
  .filter(file => file.wasteScore > 40)
  .slice(0, 10)
  .map(file => ({
    summary: `Clean up ${file.filePath}`,
    description: `Reduce waste from ${file.wasteScore}%\n\nIssues:\n- Dead code: ${file.deadCode.ratio * 100}%\n- Duplication: ${file.duplication.ratio * 100}%\n- AI Score: ${file.aiPatterns.score}`,
    storyPoints: Math.ceil(file.wasteScore / 20),
    labels: ['technical-debt', 'vibesweep']
  }));

console.log(JSON.stringify(tasks, null, 2));
```

## Migration Scenarios

### From ESLint to Vibesweep

Add Vibesweep for AI-specific issues:

```json
// package.json
{
  "scripts": {
    "lint": "eslint . && vibesweep analyze .",
    "lint:fix": "eslint . --fix && vibesweep fix . --dry-run"
  }
}
```

### Adding to Existing CI

```yaml
# Gradual adoption
- name: Vibesweep Check
  continue-on-error: true  # Warning only at first
  run: |
    npx vibesweep analyze . --output json > report.json
    WASTE=$(jq '.wastePercentage' report.json)
    if (( $(echo "$WASTE > 30" | bc -l) )); then
      echo "::warning::High code waste: ${WASTE}%"
    fi
```

## Best Practices

1. **Start with Analysis** - Understand your baseline before fixing
2. **Fix Incrementally** - Don't try to fix everything at once
3. **Set Realistic Thresholds** - Start loose, tighten gradually
4. **Integrate Early** - Add to CI before enforcing standards
5. **Track Progress** - Measure improvement over time
6. **Celebrate Wins** - Recognize waste reduction achievements