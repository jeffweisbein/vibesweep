export const AI_CODE_PATTERNS = {
  duplications: {
    exactCopyPaste: /^[\s]*\/\/ (TODO|FIXME|NOTE).*\n(.*\n){0,50}\1/gm,
    similarFunctions: /function\s+\w+\s*\([^)]*\)\s*{[^}]+}/g,
  },
  
  overEngineering: {
    unnecessaryAbstractions: [
      /class\s+\w+Manager\s*{[\s\S]*?}\s*class\s+\w+Service\s*{[\s\S]*?}\s*class\s+\w+Controller/,
      /interface\s+I\w+\s*{\s*\w+\(\):\s*void;\s*}/g,
    ],
    singleUseClasses: /class\s+\w+\s*{[^}]*constructor[^}]*}[^}]*}/g,
  },

  deadCode: {
    unusedImports: /import\s+(?:{[^}]+}|[\w\s,]+)\s+from\s+['"][^'"]+['"]/g,
    unusedVariables: /(?:const|let|var)\s+\w+\s*=\s*[^;]+;/g,
    unusedFunctions: /(?:function|const\s+\w+\s*=\s*(?:\([^)]*\)|[\w\s]*)\s*=>)\s*[^{]*{[^}]*}/g,
  },

  aiSpecificSmells: {
    verboseComments: /\/\/{2,}.*|\/\*[\s\S]*?\*\//g,
    redundantTypeAnnotations: /:\s*any(?:\[\])?/g,
    consoleLogs: /console\.(log|error|warn|debug)\([^)]*\)/g,
    placeholderCode: /\/\/\s*(TODO|IMPLEMENT|PLACEHOLDER|FIX ME|FIXME)/gi,
    boilerplate: /export\s+default\s+\w+;?\s*$/gm,
  },

  complexityIndicators: {
    deepNesting: /(?:if|for|while|switch)\s*\([^)]*\)\s*{(?:[^{}]|{[^{}]*})*{/g,
    longFunctions: /function\s+\w+\s*\([^)]*\)\s*{[^}]{500,}/g,
    godClasses: /class\s+\w+\s*{[^}]{1000,}/g,
  }
};

export const COMMON_AI_COMMENTS = [
  "Helper function",
  "Utility function", 
  "Main function",
  "Entry point",
  "TODO: Implement this",
  "Add your code here",
  "This function does",
  "Function to handle",
  "Process the",
  "Helper method to",
  "Utility method for"
];

export const FRAMEWORK_BOILERPLATE = {
  react: [
    /import React from ['"]react['"]/,
    /export default function \w+\(\) {\s*return \(\s*<div>\s*<\/div>\s*\);\s*}/,
  ],
  express: [
    /app\.listen\(\d+,\s*\(\)\s*=>\s*{\s*console\.log/,
    /app\.use\(express\.json\(\)\);?\s*app\.use\(express\.urlencoded/,
  ],
  nextjs: [
    /export\s+default\s+function\s+\w+Page\(\)\s*{/,
    /import\s+{\s*Inter\s*}\s+from\s+['"]next\/font\/google['"]/,
  ]
};