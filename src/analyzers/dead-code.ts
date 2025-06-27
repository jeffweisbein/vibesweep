import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse as any;
import { readFileSync } from 'fs';

interface CodeUsage {
  defined: Set<string>;
  used: Set<string>;
  exports: Set<string>;
  imports: Map<string, string>;
}

export class DeadCodeAnalyzer {
  analyze(filePath: string): {
    unusedVariables: string[];
    unusedFunctions: string[];
    unusedImports: string[];
    deadCodeRatio: number;
  } {
    const code = readFileSync(filePath, 'utf-8');
    const usage: CodeUsage = {
      defined: new Set(),
      used: new Set(),
      exports: new Set(),
      imports: new Map(),
    };

    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      traverse(ast, {
        VariableDeclarator(path: any) {
          if (path.node.id.type === 'Identifier') {
            usage.defined.add(path.node.id.name);
          }
        },
        
        FunctionDeclaration(path: any) {
          if (path.node.id) {
            usage.defined.add(path.node.id.name);
          }
        },

        Identifier(path: any) {
          if (
            path.isReferencedIdentifier() &&
            !path.isBindingIdentifier() &&
            !path.node.name.startsWith('_')
          ) {
            usage.used.add(path.node.name);
          }
        },

        ImportDeclaration(path: any) {
          path.node.specifiers.forEach((spec: any) => {
            if (spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier') {
              usage.imports.set(spec.local.name, spec.imported.name);
            }
          });
        },

        ExportNamedDeclaration(path: any) {
          if (path.node.declaration) {
            if (path.node.declaration.type === 'VariableDeclaration') {
              path.node.declaration.declarations.forEach((dec: any) => {
                if (dec.id.type === 'Identifier') {
                  usage.exports.add(dec.id.name);
                }
              });
            }
          }
        }
      });
    } catch (error) {
      return {
        unusedVariables: [],
        unusedFunctions: [],
        unusedImports: [],
        deadCodeRatio: 0
      };
    }

    const unusedVariables = Array.from(usage.defined)
      .filter(name => !usage.used.has(name) && !usage.exports.has(name));
    
    const unusedImports = Array.from(usage.imports.keys())
      .filter(name => !usage.used.has(name));

    const totalDefinitions = usage.defined.size + usage.imports.size;
    const deadDefinitions = unusedVariables.length + unusedImports.length;
    const deadCodeRatio = totalDefinitions > 0 ? deadDefinitions / totalDefinitions : 0;

    return {
      unusedVariables,
      unusedFunctions: unusedVariables.filter(name => code.includes(`function ${name}`)),
      unusedImports,
      deadCodeRatio
    };
  }
}