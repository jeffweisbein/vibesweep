import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse as any;
import { readFileSync } from 'fs';

interface LocationInfo {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

interface UnusedItem {
  name: string;
  type: 'variable' | 'function' | 'import';
  location: LocationInfo;
  context?: string;
}

interface CodeUsage {
  defined: Map<string, LocationInfo>;
  used: Set<string>;
  exports: Set<string>;
  imports: Map<string, LocationInfo>;
  unusedItems: UnusedItem[];
}

export class DeadCodeAnalyzer {
  analyze(filePath: string): {
    unusedVariables: string[];
    unusedFunctions: string[];
    unusedImports: string[];
    deadCodeRatio: number;
    locations: UnusedItem[];
  } {
    const code = readFileSync(filePath, 'utf-8');
    const lines = code.split('\n');
    const usage: CodeUsage = {
      defined: new Map(),
      used: new Set(),
      exports: new Set(),
      imports: new Map(),
      unusedItems: [],
    };

    try {
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      traverse(ast, {
        VariableDeclarator(path: any) {
          if (path.node.id.type === 'Identifier') {
            const loc = path.node.id.loc;
            usage.defined.set(path.node.id.name, {
              line: loc.start.line,
              column: loc.start.column,
              endLine: loc.end.line,
              endColumn: loc.end.column,
            });
          }
        },
        
        FunctionDeclaration(path: any) {
          if (path.node.id) {
            const loc = path.node.id.loc;
            usage.defined.set(path.node.id.name, {
              line: loc.start.line,
              column: loc.start.column,
              endLine: path.node.loc.end.line,
              endColumn: path.node.loc.end.column,
            });
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
              const loc = spec.loc;
              usage.imports.set(spec.local.name, {
                line: loc.start.line,
                column: loc.start.column,
                endLine: loc.end.line,
                endColumn: loc.end.column,
              });
            } else if (spec.type === 'ImportDefaultSpecifier') {
              const loc = spec.loc;
              usage.imports.set(spec.local.name, {
                line: loc.start.line,
                column: loc.start.column,
                endLine: loc.end.line,
                endColumn: loc.end.column,
              });
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
            } else if (path.node.declaration.type === 'FunctionDeclaration' && path.node.declaration.id) {
              usage.exports.add(path.node.declaration.id.name);
            }
          }
        },

        ExportDefaultDeclaration(path: any) {
          if (path.node.declaration?.type === 'Identifier') {
            usage.exports.add(path.node.declaration.name);
          }
        }
      });
    } catch (error) {
      return {
        unusedVariables: [],
        unusedFunctions: [],
        unusedImports: [],
        deadCodeRatio: 0,
        locations: []
      };
    }

    // Find unused items with locations
    const unusedVariables: string[] = [];
    const unusedFunctions: string[] = [];
    
    usage.defined.forEach((location, name) => {
      if (!usage.used.has(name) && !usage.exports.has(name)) {
        const lineContent = lines[location.line - 1]?.trim() || '';
        const isFunction = lineContent.includes('function') || lineContent.includes('=>');
        
        if (isFunction) {
          unusedFunctions.push(name);
        } else {
          unusedVariables.push(name);
        }

        usage.unusedItems.push({
          name,
          type: isFunction ? 'function' : 'variable',
          location,
          context: lineContent.substring(0, 100)
        });
      }
    });

    const unusedImports: string[] = [];
    usage.imports.forEach((location, name) => {
      if (!usage.used.has(name)) {
        unusedImports.push(name);
        const lineContent = lines[location.line - 1]?.trim() || '';
        
        usage.unusedItems.push({
          name,
          type: 'import',
          location,
          context: lineContent.substring(0, 100)
        });
      }
    });

    const totalDefinitions = usage.defined.size + usage.imports.size;
    const deadDefinitions = unusedVariables.length + unusedFunctions.length + unusedImports.length;
    const deadCodeRatio = totalDefinitions > 0 ? deadDefinitions / totalDefinitions : 0;

    return {
      unusedVariables,
      unusedFunctions,
      unusedImports,
      deadCodeRatio,
      locations: usage.unusedItems
    };
  }
}