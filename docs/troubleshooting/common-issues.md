# Common Issues

Solutions to frequently encountered problems with Vibesweep.

## Installation Issues

### npm install fails

**Problem**: Installation fails with permission errors

**Solution**:
```bash
# Option 1: Use npx instead of global install
npx vibesweep analyze .

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g vibesweep

# Option 3: Use yarn
yarn global add vibesweep
```

### Command not found

**Problem**: `vibesweep: command not found` after installation

**Solution**:
```bash
# Check if installed
npm list -g vibesweep

# Check PATH
echo $PATH

# Find installation location
npm root -g

# Add to PATH if needed
export PATH="$(npm root -g)/bin:$PATH"
```

## Analysis Issues

### Out of Memory

**Problem**: "JavaScript heap out of memory" error

**Solution**:
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" vibesweep analyze .

# Or analyze smaller directories
vibesweep analyze src/
vibesweep analyze lib/
```

### File Limit Exceeded

**Problem**: "File limit exceeded" error

**Solution**:
```bash
# Option 1: Upgrade to Pro
export VIBESWEEP_API_KEY="your-api-key"

# Option 2: Exclude directories
vibesweep analyze . --pattern "src/**/*.js"

# Option 3: Use config file
```

`.vibesweeprc.json`:
```json
{
  "analysis": {
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/vendor/**"
    ]
  }
}
```

### No Files Found

**Problem**: "No files found matching the specified patterns"

**Solution**:
```bash
# Check current directory
ls -la

# Use different patterns
vibesweep analyze . --pattern "**/*.{js,jsx,ts,tsx}"

# Check for .gitignore issues
vibesweep analyze . --no-gitignore
```

### Parsing Errors

**Problem**: "Failed to parse file" errors

**Solution**:
1. Check for syntax errors in the file
2. Ensure file encoding is UTF-8
3. Update to latest Vibesweep version
4. Report issue with file sample

## Safe Fix Issues

### Git Working Tree Not Clean

**Problem**: "Working tree is not clean" error

**Solution**:
```bash
# Check git status
git status

# Commit changes
git add .
git commit -m "Save work before vibesweep"

# Or stash changes
git stash

# Run fix
vibesweep fix .

# Restore stash if needed
git stash pop
```

### Validation Failed

**Problem**: Tests fail after applying fixes

**Solution**:
```bash
# Use dry-run first
vibesweep fix . --dry-run

# Fix specific directories
vibesweep fix src/utils/

# Skip validation (not recommended)
vibesweep fix . --no-validation

# Manual rollback if needed
git reset --hard vibesweep-backup-[timestamp]
```

### Permission Denied

**Problem**: Cannot write to files

**Solution**:
```bash
# Check file permissions
ls -la src/

# Fix permissions
chmod -R u+w src/

# Run as owner
sudo chown -R $(whoami) .
```

## Configuration Issues

### Config File Not Found

**Problem**: Configuration not being applied

**Solution**:
```bash
# Check file name (must be exact)
ls -la .vibesweeprc.json

# Validate JSON syntax
jq . .vibesweeprc.json

# Test with explicit config
vibesweep analyze . --config .vibesweeprc.json
```

### Invalid Configuration

**Problem**: "Invalid configuration" warning

**Solution**:
```javascript
// Validate with schema
{
  "$schema": "https://vibesweep.ai/schema/config.json",
  "thresholds": {
    "maxWastePercentage": 40  // Must be number, not string
  }
}
```

## Performance Issues

### Slow Analysis

**Problem**: Analysis takes too long

**Solution**:
```bash
# Exclude large directories
vibesweep analyze src/ --exclude "**/build/**"

# Analyze in parts
find . -type d -name "src" -exec vibesweep analyze {} \;

# Use specific patterns
vibesweep analyze . --pattern "*.js"
```

### High Memory Usage

**Problem**: System becomes unresponsive

**Solution**:
```bash
# Limit concurrent files
vibesweep analyze . --max-files 50

# Use nice to lower priority
nice -n 19 vibesweep analyze .

# Monitor memory
watch -n 1 'ps aux | grep vibesweep'
```

## Output Issues

### No Color in Output

**Problem**: Terminal output is not colored

**Solution**:
```bash
# Force color
FORCE_COLOR=1 vibesweep analyze .

# Check terminal support
echo $TERM

# Use different terminal
export TERM=xterm-256color
```

### JSON Parse Errors

**Problem**: Cannot parse JSON output

**Solution**:
```bash
# Ensure clean JSON output
vibesweep analyze . --output json 2>/dev/null > report.json

# Validate JSON
jq . report.json

# Pretty print
vibesweep analyze . --output json | jq '.'
```

## Platform-Specific Issues

### Windows Issues

**Problem**: Path-related errors on Windows

**Solution**:
```powershell
# Use forward slashes
vibesweep analyze ./src

# Or use WSL
wsl vibesweep analyze .

# Git Bash
/c/Program\ Files/nodejs/vibesweep analyze .
```

### macOS Issues

**Problem**: "Operation not permitted" on macOS

**Solution**:
```bash
# Grant terminal permissions
# System Preferences > Security & Privacy > Privacy > Full Disk Access

# Or use different directory
cd ~/Documents/myproject
vibesweep analyze .
```

## Error Messages

### "Cannot find module"

**Problem**: Module resolution errors

**Solution**:
```bash
# Reinstall
npm uninstall -g vibesweep
npm install -g vibesweep

# Clear cache
npm cache clean --force

# Check Node version
node --version  # Should be 16+
```

### "EACCES: permission denied"

**Problem**: File access errors

**Solution**:
```bash
# Run without sudo
npm install -g vibesweep --unsafe-perm

# Fix npm permissions
npm config set prefix ~/.npm
export PATH=~/.npm/bin:$PATH
```

## Getting More Help

### Debug Mode

Enable verbose logging:
```bash
DEBUG=vibesweep:* vibesweep analyze .
```

### Generate Diagnostic Report

```bash
vibesweep diagnose > diagnostic.txt
```

Include this file when reporting issues.

### Report Issues

1. GitHub Issues: https://github.com/jeffweisbein/vibesweep/issues
2. Include:
   - Vibesweep version: `vibesweep --version`
   - Node version: `node --version`
   - Operating system
   - Error message
   - Steps to reproduce

### Community Support

- Discord: https://discord.gg/vibesweep
- Stack Overflow: Tag with `vibesweep`
- Email: support@vibesweep.ai