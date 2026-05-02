const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/application/services/scoring-service.ts',
  'src/application/services/template-service.ts',
  'src/domain/models/award.ts',
  'src/domain/models/certification.ts',
  'src/domain/models/education.ts',
  'src/domain/models/project.ts',
  'src/domain/models/resume.ts',
  'src/domain/models/work-experience.ts',
  'src/domain/scoring/ats-scorer.ts',
  'src/domain/scoring/formatting-scorer.ts',
  'src/domain/scoring/keyword-scorer.ts',
  'src/domain/scoring/readability-scorer.ts',
  'src/domain/scoring/scoring-module.interface.ts',
  'src/domain/scoring/technical-scorer.ts',
  'src/infrastructure/generators/docx-generator.ts',
  'src/infrastructure/generators/html-generator.ts',
  'src/infrastructure/generators/pdf-generator.ts',
  'src/infrastructure/mcp/server.ts',
  'src/infrastructure/parsers/markdown-parser.ts',
  'src/infrastructure/templates/template-loader.ts'
];

function fixImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative imports to add .js extension
    content = content.replace(
      /from ['"](\.\.?\/[^'"]+)['"];?/g,
      (match, importPath) => {
        if (importPath.endsWith('.js')) {
          return match;
        }
        if (importPath.includes('@modelcontextprotocol') || 
            importPath.includes('zod') || 
            importPath.includes('markdown-it') ||
            importPath.includes('puppeteer') ||
            importPath.includes('docxtemplater') ||
            importPath.includes('pizzip')) {
          return match;
        }
        return match.replace(importPath, importPath + '.js');
      }
    );
    
    // Fix type-only imports for MCP SDK
    content = content.replace(
      /import \{ ([^}]*Tool[^}]*) \} from ['"]@modelcontextprotocol\/sdk\/types\.js['"];?/g,
      'import type { $1 } from \'@modelcontextprotocol/sdk/types.js\';'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixImports);
console.log('Import fixing complete!');
