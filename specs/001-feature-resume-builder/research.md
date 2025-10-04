# Research Findings: Resume Builder

**Date**: 2025-10-04
**Feature**: Resume Builder MCP Server

## Overview
This document consolidates research findings for implementing the Resume Builder feature as an MCP server. It resolves all [NEEDS CLARIFICATION] items from the spec and documents technical decisions.

---

## Clarification Resolutions

### 1. Template Metadata (FR-006)
**Original Question**: What specific metadata should be returned - industry focus, formality level, section layout?

**Decision**: Return comprehensive template metadata including:
- `id`: Unique template identifier (string)
- `name`: Human-readable template name (string)
- `description`: Brief description of template style (string)
- `category`: Template category (professional/modern/creative/academic)
- `industryFocus`: Suggested industries (array of strings, e.g., ["tech", "finance", "creative"])
- `formalityLevel`: Formality rating (formal/business/casual)
- `sections`: Supported sections configuration (array of section names)
- `features`: Template features (e.g., "two-column", "color-accents", "minimal")
- `preview`: Base64 thumbnail or URL to preview image

**Rationale**:
- Provides sufficient context for AI assistants to make intelligent recommendations
- Enables filtering and selection based on user's industry and preferences
- Supports future UI implementations if needed
- Follows MCP best practices for rich tool responses

**Alternatives Considered**:
- Minimal metadata (id, name only) - Rejected: Insufficient for intelligent selection
- Include full template content - Rejected: Too verbose for listing operation

---

### 2. Generated File Return Format (FR-015)
**Original Question**: Should the tool return base64-encoded file content, a file path, or a URI?

**Decision**: Return base64-encoded file content embedded in the MCP response

**Rationale**:
- **MCP Protocol Alignment**: MCP tools return all data in the response; no file system assumptions
- **Cross-platform Compatibility**: Works regardless of AI assistant's file system access
- **Stateless Operation**: No temporary file cleanup required
- **Security**: No file path traversal vulnerabilities
- **AI Assistant Flexibility**: Assistant can save, stream, or process content as needed

**Implementation Details**:
```typescript
interface GenerateResumeResponse {
  success: boolean;
  format: 'docx' | 'pdf' | 'html';
  filename: string;
  content: string; // base64-encoded
  mimeType: string;
  size: number; // bytes
}
```

**Alternatives Considered**:
- File path return - Rejected: Assumes shared file system between MCP server and AI
- URI return - Rejected: Requires additional HTTP server infrastructure
- Streaming - Rejected: MCP protocol doesn't support streaming responses

---

### 3. ATS Score Scale (FR-017)
**Original Question**: What is the scoring scale - 0-100, 1-10, letter grade?

**Decision**: 0-100 numerical scale with categorical ratings

**Rationale**:
- **Industry Standard**: Most ATS scoring tools use 0-100 scale
- **Granularity**: Provides precise feedback for incremental improvements
- **Familiarity**: Users understand percentage-based scoring
- **Categorical Mapping**: Easy to map to categories (0-40: Poor, 41-70: Fair, 71-85: Good, 86-100: Excellent)

**Implementation Details**:
```typescript
interface ATSScoreResult {
  score: number; // 0-100
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  issues: Array<{
    category: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    impact: number; // points deducted
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    potentialGain: number; // points that could be gained
  }>;
  breakdown: {
    formatting: number; // subscore
    keywords: number;
    structure: number;
    readability: number;
  };
}
```

**Alternatives Considered**:
- 1-10 scale - Rejected: Too coarse for meaningful feedback
- Letter grades - Rejected: Less intuitive for improvement tracking
- Pass/Fail - Rejected: Not actionable enough

---

### 4. ATS Best Practices Criteria (FR-020)
**Original Question**: What specific criteria define "general" ATS best practices?

**Decision**: Comprehensive multi-factor evaluation covering:

**1. Formatting & Structure (30 points)**
- Simple, single-column layout preferred
- Standard section headers (Experience, Education, Skills)
- Consistent font usage (1-2 font families max)
- Proper use of whitespace
- No headers/footers, text boxes, or tables
- Standard bullet points (•, -, *)

**2. Keyword & Content (25 points)**
- Relevant industry keywords present
- Skills section with concrete technologies/tools
- Action verbs in experience descriptions
- Quantifiable achievements with metrics
- No abbreviations without full form first
- No spelling or grammar errors

**3. Technical Compatibility (25 points)**
- File format compatibility (DOCX/PDF text-based)
- No embedded images for text content
- No fancy formatting (borders, shading, colors)
- Standard date formats (MM/YYYY or Month YYYY)
- No special characters or symbols
- Proper encoding (UTF-8)

**4. Readability & Organization (20 points)**
- Chronological order (most recent first)
- Clear job titles and company names
- Consistent date formatting
- Appropriate resume length (1-2 pages)
- Contact information at top
- No personal pronouns (I, me, my)

**Rationale**:
- Based on research of major ATS systems (Taleo, Workday, Greenhouse, Lever)
- Covers both technical parsing requirements and content best practices
- Weighted scoring reflects relative importance
- Specific enough to generate actionable feedback
- General enough to apply across industries

**Alternatives Considered**:
- Job-specific scoring - Rejected: Out of scope for initial version (future enhancement)
- Minimal criteria (formatting only) - Rejected: Incomplete evaluation
- Industry-specific rules - Rejected: Too complex for v1

---

## Technology Research

### Document Generation Stack

#### DOCX Generation: docxtemplater + pizzip
**Decision**: Use `docxtemplater` v3.x with `pizzip` for DOCX generation

**Best Practices**:
- Define template structure with proper XML placeholders
- Use conditional sections for optional resume sections
- Implement loop constructs for arrays (work experience, education)
- Validate template structure before content injection
- Handle special characters escaping (XML entities)
- Maintain template registry with versioning

**Key Findings**:
- docxtemplater provides template-based approach (not programmatic)
- pizzip required for DOCX file manipulation (ZIP format)
- Template validation prevents runtime errors
- Support for complex logic via modules (angular-parser recommended)

**Example Template Structure**:
```
{name}
{email} | {phone}

{#experience}
{title} at {company}
{startDate} - {endDate}
{#responsibilities}
- {.}
{/responsibilities}
{/experience}
```

**Dependencies**:
```json
{
  "docxtemplater": "^3.42.0",
  "pizzip": "^3.1.6",
  "docxtemplater-image-module-free": "^1.0.4" // for logos if needed
}
```

---

#### PDF Generation: Puppeteer vs pdf-lib
**Decision**: Use `puppeteer` for HTML-to-PDF conversion

**Rationale**:
- **Puppeteer Advantages**:
  - Renders HTML/CSS to PDF with high fidelity
  - Supports web fonts and modern CSS
  - Maintains text searchability
  - Easy styling with familiar web technologies
  - Proper font embedding automatically

- **pdf-lib Disadvantages**:
  - Programmatic layout is complex
  - Harder to maintain consistent styling
  - Manual font embedding required
  - More code for the same result

**Best Practices**:
- Generate clean HTML from markdown first
- Use print-optimized CSS (@media print)
- Set proper PDF metadata (title, author, subject)
- Configure page size (A4/Letter)
- Ensure text remains selectable (no rasterization)
- Optimize for file size (compress embedded resources)

**Configuration**:
```typescript
const pdfOptions = {
  format: 'A4',
  printBackground: false, // ATS-friendly
  margin: {
    top: '0.5in',
    right: '0.75in',
    bottom: '0.5in',
    left: '0.75in'
  },
  preferCSSPageSize: true
};
```

**Dependencies**:
```json
{
  "puppeteer": "^21.6.0",
  "puppeteer-core": "^21.6.0" // optional: use installed Chrome
}
```

**Alternatives Considered**:
- pdf-lib - Rejected: Too low-level for template-based generation
- jsPDF - Rejected: Similar limitations as pdf-lib
- wkhtmltopdf - Rejected: External binary dependency, harder deployment

---

#### Markdown Processing: markdown-it
**Decision**: Use `markdown-it` with strict parsing and validation

**Best Practices**:
- Enable strict mode for consistent parsing
- Use typographer for proper quotes and dashes
- Validate required sections via AST analysis
- Sanitize HTML output (prevent XSS)
- Support CommonMark spec
- Custom renderer for resume-specific elements

**Validation Strategy**:
1. Parse markdown to AST
2. Verify required sections exist (heading analysis)
3. Validate structure (heading hierarchy)
4. Check formatting compliance (no unsupported elements)
5. Extract data for template population

**Configuration**:
```typescript
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: false, // Security: no raw HTML
  xhtmlOut: true, // XHTML-compliant
  breaks: false, // No <br> on \n
  linkify: true, // Auto-link URLs
  typographer: true // Smart quotes
});
```

**Dependencies**:
```json
{
  "markdown-it": "^13.0.2",
  "@types/markdown-it": "^13.0.7"
}
```

---

### MCP Implementation

#### SDK: @modelcontextprotocol/sdk
**Decision**: Use official MCP TypeScript SDK

**Best Practices**:
- Implement all tools with proper schema validation (Zod)
- Use structured error responses with error codes
- Provide detailed tool descriptions for AI understanding
- Include examples in tool schemas
- Handle async operations properly
- Implement proper logging for debugging

**Tool Schema Pattern**:
```typescript
import { z } from 'zod';

const ValidateResumeSchema = z.object({
  content: z.string().describe('Markdown-formatted resume content'),
  strict: z.boolean().optional().describe('Enable strict validation mode')
});

server.tool({
  name: 'validate-resume',
  description: 'Validate markdown resume content against template schema',
  inputSchema: zodToJsonSchema(ValidateResumeSchema),
  handler: async (input) => {
    // Implementation
  }
});
```

**Error Handling**:
```typescript
class MCPToolError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

// Usage
throw new MCPToolError(
  'INVALID_MARKDOWN',
  'Missing required section: Work Experience',
  { section: 'experience', line: 0 }
);
```

---

### Testing Strategy

#### Test Framework: Jest
**Decision**: Jest for all testing layers

**Test Structure**:
1. **Unit Tests** (80%+ coverage target)
   - Domain logic (validators, scoring algorithms)
   - Pure functions in isolation
   - Mock external dependencies

2. **Integration Tests**
   - MCP tool end-to-end flows
   - Template processing pipelines
   - Document generation with real files

3. **Contract Tests**
   - MCP protocol compliance
   - Tool schema validation
   - Error response format

**Jest Configuration**:
```typescript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## Resolved Dependencies

### Final Package List
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "docxtemplater": "^3.42.0",
    "pizzip": "^3.1.6",
    "puppeteer": "^21.6.0",
    "markdown-it": "^13.0.2",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/markdown-it": "^13.0.7",
    "@types/node": "^20.10.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

---

## Architecture Decisions

### Template Storage Strategy
**Decision**: File-based template storage with JSON metadata

**Structure**:
```
templates/
├── professional/
│   ├── template.docx        # DOCX template file
│   ├── metadata.json        # Template metadata
│   └── preview.png          # Template preview
├── modern/
│   └── ...
└── classic/
    └── ...
```

**Metadata Format**:
```json
{
  "id": "professional-001",
  "name": "Professional Classic",
  "description": "Traditional format ideal for corporate roles",
  "category": "professional",
  "industryFocus": ["finance", "consulting", "legal"],
  "formalityLevel": "formal",
  "sections": ["contact", "summary", "experience", "education", "skills"],
  "features": ["single-column", "serif-font", "minimal"],
  "version": "1.0.0"
}
```

---

### Scoring Algorithm Architecture
**Decision**: Pluggable scoring modules with weighted aggregation

**Pattern**:
```typescript
interface ScoringModule {
  name: string;
  weight: number;
  evaluate(resume: ParsedResume): ScoringResult;
}

class ATSScorer {
  constructor(private modules: ScoringModule[]) {}

  score(resume: ParsedResume): ATSScoreResult {
    const results = this.modules.map(m => ({
      ...m.evaluate(resume),
      weight: m.weight
    }));

    return this.aggregate(results);
  }
}
```

**Modules**:
- `FormattingScorer` - Checks layout and structure (30%)
- `KeywordScorer` - Analyzes content and keywords (25%)
- `TechnicalScorer` - Validates technical compatibility (25%)
- `ReadabilityScorer` - Evaluates organization and clarity (20%)

---

## Performance Considerations

### Document Generation Optimization
1. **Template Caching**: Load templates once, reuse in memory
2. **Async Processing**: Use worker threads for PDF generation if needed
3. **Stream Processing**: Stream large documents instead of loading fully
4. **Resource Pooling**: Reuse Puppeteer browser instances

### Memory Management
- Limit concurrent document generations
- Clean up temporary resources immediately
- Use streaming for file I/O where possible
- Monitor heap usage in production

---

## Security Considerations

### Input Validation
- Sanitize all markdown input
- Validate file sizes (prevent DoS)
- Escape special characters in templates
- Validate template files on load

### Output Safety
- No arbitrary code execution in templates
- Sanitize generated HTML
- Validate PDF output integrity
- No sensitive data in error messages

---

## Next Steps (Phase 1)

1. ✅ Technical decisions finalized
2. → Generate data-model.md with entity definitions
3. → Create MCP tool contracts in /contracts/
4. → Generate failing contract tests
5. → Document quickstart workflow
6. → Update agent context file

---

**Research Status**: ✅ COMPLETE - All clarifications resolved, ready for Phase 1 design
