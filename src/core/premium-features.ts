export interface PremiumLimits {
  freeFileLimit: number;
  freeProjectsPerDay: number;
}

export const LIMITS: PremiumLimits = {
  freeFileLimit: 50,
  freeProjectsPerDay: 3
};

export function checkLimits(fileCount: number, apiKey?: string): { allowed: boolean; message?: string } {
  if (apiKey) {
    return { allowed: true };
  }

  if (fileCount > LIMITS.freeFileLimit) {
    return {
      allowed: false,
      message: `⚠️  Free tier limited to ${LIMITS.freeFileLimit} files. Analyzing ${fileCount} files requires Vibesweep Pro.

🚀 Get unlimited analysis at https://vibesweep.ai/pricing
   
   Or set your API key:
   export VIBESWEEP_API_KEY=your-key-here`
    };
  }

  return { allowed: true };
}

export function getUpgradeMessage(feature: string): string {
  const messages: Record<string, string> = {
    autoFix: `✨ Auto-fix is a Vibesweep Pro feature
    
Remove detected waste automatically with:
vibesweep clean . --auto-fix

Upgrade at https://vibesweep.ai/pricing`,
    
    cicd: `🔧 CI/CD integration requires Vibesweep Pro

Get failing builds when waste exceeds thresholds.
Perfect for keeping your codebase clean!

Learn more at https://vibesweep.ai/pricing`,
    
    report: `📊 Detailed reports are a Vibesweep Pro feature

Get PDF reports with:
- Historical trends
- Team analytics  
- Cost projections
- Executive summaries

Upgrade at https://vibesweep.ai/pricing`
  };

  return messages[feature] || 'Upgrade to Vibesweep Pro at https://vibesweep.ai/pricing';
}