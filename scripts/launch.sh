#!/bin/bash

echo "🚀 Vibesweep Launch Script"
echo "========================="
echo ""

# Check if npm is logged in
echo "📦 Checking npm login status..."
npm whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

echo "✅ npm login confirmed"
echo ""

# Build the project
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Dry run to test
echo "🧪 Running npm publish dry run..."
npm publish --dry-run
echo ""

echo "Ready to publish! Next steps:"
echo "1. Run: npm publish"
echo "2. Test: npx vibesweep analyze ."
echo "3. Deploy landing page to Vercel"
echo "4. Launch on social media!"
echo ""
echo "Landing page is in: ../vibesweep-landing"