# Vibesweep Landing Page Structure 🧹

## Hero Section
```
<Hero>
  <h1>Your AI Code is 67% Garbage</h1>
  <h2>Sweep away vibe coding waste in seconds</h2>
  
  <LiveDemo>
    $ npx vibesweep analyze ./my-project
    
    🧹 Analyzing 127 files...
    
    📊 Waste detected: 67%
    💰 Could save: 8,421 lines
    🚨 Duplicates found: 43 blocks
  </LiveDemo>
  
  <CTA>
    <CodeBlock>npx vibesweep analyze .</CodeBlock>
    <Button>View on GitHub</Button>
  </CTA>
  
  <SocialProof>
    Trusted by 1,000+ developers • 50K+ repos analyzed
  </SocialProof>
</Hero>
```

## Problem Section
```
<Problem>
  <h2>The Vibe Coding Crisis</h2>
  
  <Stats>
    <Stat icon="📊" value="41%" label="of code is AI-generated" />
    <Stat icon="📈" value="4x" label="increase in duplication" />
    <Stat icon="💸" value="$2.1M" label="wasted on dead code yearly" />
    <Stat icon="⚠️" value="3.8%" label="of devs trust AI code" />
  </Stats>
  
  <Examples>
    <h3>Real Examples We Found:</h3>
    • 5 identical email validators in one file
    • 300-line solution for 10-line problem
    • TODO comments from 2023
    • Console.logs in production
    • Entire unused classes and services
  </Examples>
</Problem>
```

## Solution Section
```
<Solution>
  <h2>Meet Vibesweep</h2>
  <p>The first tool designed specifically for AI-generated code cleanup</p>
  
  <Features>
    <Feature icon="🧟">
      <h3>Dead Code Detection</h3>
      <p>AST analysis finds unused variables, functions, and imports</p>
    </Feature>
    
    <Feature icon="📋">
      <h3>Duplication Analysis</h3>
      <p>Fuzzy matching catches copy-paste and near-duplicates</p>
    </Feature>
    
    <Feature icon="🤖">
      <h3>AI Pattern Recognition</h3>
      <p>Detects verbose comments, placeholders, and over-engineering</p>
    </Feature>
    
    <Feature icon="💰">
      <h3>Cost Calculator</h3>
      <p>See exactly how much you could save in storage and compute</p>
    </Feature>
  </Features>
</Solution>
```

## Demo Section
```
<Demo>
  <h2>Try It Live</h2>
  
  <DemoTabs>
    <Tab name="Popular Repos">
      <RepoSelector>
        • facebook/react - Analyze
        • vercel/next.js - Analyze  
        • microsoft/vscode - Analyze
      </RepoSelector>
    </Tab>
    
    <Tab name="Paste Your Code">
      <CodeEditor>
        // Paste your code here
      </CodeEditor>
      <Button>Analyze</Button>
    </Tab>
  </DemoTabs>
  
  <Results>
    [Live analysis results appear here]
  </Results>
</Demo>
```

## How It Works
```
<HowItWorks>
  <h2>Under the Hood</h2>
  
  <Steps>
    <Step number="1">
      <h3>Parse</h3>
      <p>AST analysis using Babel</p>
    </Step>
    
    <Step number="2">
      <h3>Detect</h3>
      <p>Pattern matching & usage tracking</p>
    </Step>
    
    <Step number="3">
      <h3>Score</h3>
      <p>Weighted algorithm for accuracy</p>
    </Step>
    
    <Step number="4">
      <h3>Report</h3>
      <p>Actionable insights & metrics</p>
    </Step>
  </Steps>
</HowItWorks>
```

## Integration Section
```
<Integrations>
  <h2>Fits Your Workflow</h2>
  
  <IntegrationCards>
    <Card>
      <GitHubLogo />
      <h3>GitHub Actions</h3>
      <code>uses: vibesweep/action@v1</code>
    </Card>
    
    <Card>
      <VSCodeLogo />
      <h3>VS Code Extension</h3>
      <p>Coming soon</p>
    </Card>
    
    <Card>
      <CILogo />
      <h3>CI/CD Ready</h3>
      <p>JSON output for automation</p>
    </Card>
  </IntegrationCards>
</Integrations>
```

## CTA Section
```
<FinalCTA>
  <h2>Start Sweeping</h2>
  <p>It's free, open-source, and takes 30 seconds</p>
  
  <CTABox>
    <CodeBlock>npx vibesweep analyze .</CodeBlock>
    <Links>
      <Link>GitHub</Link>
      <Link>Documentation</Link>
      <Link>Discord</Link>
    </Links>
  </CTABox>
  
  <Newsletter>
    <h3>Get Weekly AI Code Quality Reports</h3>
    <EmailForm />
  </Newsletter>
</FinalCTA>
```

## Footer
```
<Footer>
  <Logo>vibesweep</Logo>
  <Tagline>Made with ❤️ by developers tired of AI slop</Tagline>
  
  <Links>
    <Column>
      <Link>Documentation</Link>
      <Link>GitHub</Link>
      <Link>npm</Link>
    </Column>
    
    <Column>
      <Link>Twitter</Link>
      <Link>Discord</Link>
      <Link>Blog</Link>
    </Column>
    
    <Column>
      <Link>Privacy</Link>
      <Link>Terms</Link>
      <Link>License</Link>
    </Column>
  </Links>
</Footer>
```

## Wall of Shame (Separate Page)
```
/wall-of-shame

<h1>The AI Code Wall of Shame</h1>
<p>Anonymized examples of the worst AI-generated code we've found</p>

<LeaderBoard>
  1. 94% waste - "E-commerce Platform"
  2. 89% waste - "Social Media Dashboard"  
  3. 87% waste - "Task Management App"
  ...
</LeaderBoard>

<Examples>
  [Rotating showcase of terrible code]
</Examples>
```