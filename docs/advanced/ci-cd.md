# CI/CD Integration

Integrate Vibesweep into your continuous integration pipeline to maintain code quality automatically.

## GitHub Actions

### Basic Workflow

```yaml
name: Code Quality Check

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  vibesweep:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Vibesweep
      run: npm install -g vibesweep
    
    - name: Run Vibesweep Analysis
      run: vibesweep analyze . --output json > vibesweep-report.json
    
    - name: Check Waste Threshold
      run: |
        WASTE_PERCENT=$(jq '.wastePercentage' vibesweep-report.json)
        if (( $(echo "$WASTE_PERCENT > 20" | bc -l) )); then
          echo "::error::Code waste too high: ${WASTE_PERCENT}%"
          exit 1
        fi
    
    - name: Upload Report
      uses: actions/upload-artifact@v3
      with:
        name: vibesweep-report
        path: vibesweep-report.json
```

### Advanced Workflow with PR Comments

```yaml
name: Vibesweep PR Analysis

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0  # Full history for comparison
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install Vibesweep
      run: npm install -g vibesweep
    
    - name: Analyze Current Branch
      run: |
        vibesweep analyze . --output json > current-report.json
    
    - name: Analyze Base Branch
      run: |
        git checkout ${{ github.base_ref }}
        vibesweep analyze . --output json > base-report.json
        git checkout -
    
    - name: Compare Results
      run: |
        CURRENT_WASTE=$(jq '.wastePercentage' current-report.json)
        BASE_WASTE=$(jq '.wastePercentage' base-report.json)
        DIFF=$(echo "$CURRENT_WASTE - $BASE_WASTE" | bc)
        
        echo "Base waste: ${BASE_WASTE}%"
        echo "Current waste: ${CURRENT_WASTE}%"
        echo "Difference: ${DIFF}%"
        
        echo "WASTE_DIFF=$DIFF" >> $GITHUB_ENV
        echo "CURRENT_WASTE=$CURRENT_WASTE" >> $GITHUB_ENV
    
    - name: Comment on PR
      uses: actions/github-script@v6
      with:
        script: |
          const diff = parseFloat(process.env.WASTE_DIFF);
          const current = parseFloat(process.env.CURRENT_WASTE);
          
          let emoji = diff > 0 ? '⚠️' : '✅';
          let trend = diff > 0 ? 'increased' : 'decreased';
          
          const comment = `## ${emoji} Vibesweep Analysis
          
          Code waste has ${trend} by **${Math.abs(diff).toFixed(1)}%**
          
          Current waste: **${current.toFixed(1)}%**
          
          <details>
          <summary>View detailed report</summary>
          
          \`\`\`json
          ${require('fs').readFileSync('current-report.json', 'utf8')}
          \`\`\`
          </details>`;
          
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: comment
          });
```

## GitLab CI

### .gitlab-ci.yml

```yaml
stages:
  - quality

vibesweep-analysis:
  stage: quality
  image: node:18
  script:
    - npm install -g vibesweep
    - vibesweep analyze . --output json > vibesweep-report.json
    - |
      WASTE_PERCENT=$(jq '.wastePercentage' vibesweep-report.json)
      if (( $(echo "$WASTE_PERCENT > 20" | bc -l) )); then
        echo "Code waste too high: ${WASTE_PERCENT}%"
        exit 1
      fi
  artifacts:
    reports:
      junit: vibesweep-report.json
    paths:
      - vibesweep-report.json
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

## Jenkins

### Jenkinsfile

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g vibesweep'
            }
        }
        
        stage('Vibesweep Analysis') {
            steps {
                sh 'vibesweep analyze . --output json > vibesweep-report.json'
                
                script {
                    def report = readJSON file: 'vibesweep-report.json'
                    def wastePercent = report.wastePercentage
                    
                    if (wastePercent > 20) {
                        error("Code waste too high: ${wastePercent}%")
                    }
                    
                    echo "Code waste: ${wastePercent}%"
                }
            }
        }
        
        stage('Publish Report') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: 'vibesweep-report.json',
                    reportName: 'Vibesweep Report'
                ])
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'vibesweep-report.json', 
                           fingerprint: true
        }
    }
}
```

## CircleCI

### .circleci/config.yml

```yaml
version: 2.1

jobs:
  vibesweep-check:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - run:
          name: Install Vibesweep
          command: npm install -g vibesweep
      - run:
          name: Run Analysis
          command: |
            vibesweep analyze . --output json > report.json
            cat report.json
      - run:
          name: Check Thresholds
          command: |
            WASTE=$(jq '.wastePercentage' report.json)
            if (( $(echo "$WASTE > 20" | bc -l) )); then
              echo "Code waste exceeds threshold: $WASTE%"
              exit 1
            fi
      - store_artifacts:
          path: report.json
          destination: vibesweep-report

workflows:
  quality-check:
    jobs:
      - vibesweep-check:
          filters:
            branches:
              only:
                - main
                - develop
```

## Bitbucket Pipelines

### bitbucket-pipelines.yml

```yaml
pipelines:
  pull-requests:
    '**':
      - step:
          name: Vibesweep Analysis
          image: node:18
          script:
            - npm install -g vibesweep
            - vibesweep analyze . --output json > report.json
            - |
              WASTE=$(jq '.wastePercentage' report.json)
              if (( $(echo "$WASTE > 20" | bc -l) )); then
                echo "Code waste too high: $WASTE%"
                exit 1
              fi
          artifacts:
            - report.json
```

## Configuration Best Practices

### CI-Specific Config

Create `.vibesweeprc.ci.json`:

```json
{
  "analysis": {
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.git/**"
    ]
  },
  "reporting": {
    "outputFormat": "json",
    "showFileDetails": false
  },
  "thresholds": {
    "maxWastePercentage": 20,
    "maxAIScore": 60
  }
}
```

Use in CI:
```bash
vibesweep analyze . --config .vibesweeprc.ci.json
```

### Progressive Thresholds

Start lenient and tighten over time:

```javascript
// ci-thresholds.js
const getThreshold = () => {
  const date = new Date();
  const startDate = new Date('2024-01-01');
  const monthsSinceStart = (date - startDate) / (1000 * 60 * 60 * 24 * 30);
  
  // Start at 40%, reduce by 2% per month, minimum 10%
  return Math.max(40 - (monthsSinceStart * 2), 10);
};

console.log(getThreshold());
```

## Reporting

### Generate HTML Reports

```bash
#!/bin/bash
# generate-report.sh

vibesweep analyze . --output json > report.json

cat > report.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Vibesweep Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>Code Quality Report</h1>
    <canvas id="wasteChart"></canvas>
    <script>
        const data = $(cat report.json);
        // Generate charts...
    </script>
</body>
</html>
EOF
```

### Slack Notifications

```yaml
# GitHub Actions example
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: |
      Vibesweep detected high code waste!
      Waste: ${{ env.CURRENT_WASTE }}%
      View details: ${{ github.event.pull_request.html_url }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Performance Optimization

### Caching

```yaml
# GitHub Actions
- name: Cache Vibesweep
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-vibesweep-${{ hashFiles('**/package-lock.json') }}

# GitLab CI
cache:
  paths:
    - node_modules/
  key: ${CI_COMMIT_REF_SLUG}
```

### Parallel Analysis

For large codebases:

```bash
#!/bin/bash
# parallel-analyze.sh

# Split into chunks
find . -name "*.js" -o -name "*.ts" | split -n 4

# Analyze in parallel
cat xaa | xargs vibesweep analyze --output json > report1.json &
cat xab | xargs vibesweep analyze --output json > report2.json &
cat xac | xargs vibesweep analyze --output json > report3.json &
cat xad | xargs vibesweep analyze --output json > report4.json &

wait

# Merge reports
jq -s '.[0] * .[1] * .[2] * .[3]' report*.json > final-report.json
```

## Troubleshooting

### Common Issues

1. **Out of Memory**
   ```yaml
   - run:
       name: Run Vibesweep
       command: NODE_OPTIONS="--max-old-space-size=4096" vibesweep analyze .
   ```

2. **Timeout**
   ```yaml
   - run:
       name: Run Vibesweep
       command: vibesweep analyze .
       no_output_timeout: 30m
   ```

3. **Permission Errors**
   ```yaml
   - run:
       name: Fix Permissions
       command: chmod -R 755 .
   ```

## Best Practices

1. **Fail Fast** - Run Vibesweep early in pipeline
2. **Cache Dependencies** - Speed up installation
3. **Incremental Checks** - Only analyze changed files in PRs
4. **Track Trends** - Store historical data
5. **Team Notifications** - Alert on threshold violations
6. **Gradual Adoption** - Start with warnings, then enforce