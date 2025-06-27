#!/bin/bash

# Initialize git repo
git init

# Add all files
git add .

# Create initial commit
git commit -m "🧹 Initial release: Vibesweep v0.1.0

Detect and eliminate AI-generated code waste
- Dead code detection
- Duplication analysis  
- AI pattern recognition
- Free tier + Pro tier ($49/mo)

Try it: npx vibesweep analyze ."

# Add remote (replace YOUR_USERNAME with your GitHub username)
echo "Replace YOUR_USERNAME with your actual GitHub username:"
echo "git remote add origin git@github.com:YOUR_USERNAME/vibesweep.git"

# Push to GitHub
echo "Then run:"
echo "git branch -M main"
echo "git push -u origin main"