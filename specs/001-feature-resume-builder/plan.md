
# Implementation Plan: Resume Builder

**Branch**: `001-feature-resume-builder` | **Date**: 2025-10-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `D:\Development\Projects\Products\PassATS\specs\001-feature-resume-builder\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
An MCP server that exposes tools for AI assistants to help users create ATS-optimized resumes. The server validates markdown resume content, provides template specifications, generates resumes in multiple formats (DOCX, PDF, HTML), and performs ATS compatibility analysis with scoring and recommendations.

## Technical Context
**Language/Version**: TypeScript (Node.js) with strict typing enabled
**Primary Dependencies**:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `docxtemplater` - DOCX template processing and generation
- `pizzip` - ZIP manipulation for DOCX format (required by docxtemplater)
- `puppeteer` or `pdf-lib` - PDF generation from HTML/template
- `markdown-it` - Markdown parsing and validation
- `zod` - Runtime schema validation for inputs

**Storage**: File system for template storage; no persistent database required
**Testing**: Jest for unit and integration testing, MCP test harness for tool validation
**Target Platform**: Node.js 18+ runtime, cross-platform (Windows/macOS/Linux)
**Project Type**: Single MCP server package
**Performance Goals**:
- Document generation < 2 seconds per resume
- ATS scoring < 1 second per analysis
- Template validation < 500ms

**Constraints**:
- Must follow MCP protocol specification
- ATS-friendly output only (proper structure, parseable formatting)
- No complex layouts that break ATS parsing
- Memory efficient for batch processing

**Scale/Scope**:
- Support 5-10 professional resume templates initially
- Handle resumes up to 10 pages
- Support 3 output formats (DOCX, PDF, HTML)
- General ATS scoring (not job-specific initially)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. TypeScript & Clean Architecture
- [x] TypeScript with strict typing enabled
- [x] Clean architecture with separated layers (domain, application, infrastructure)
- [x] Dependency inversion principle applied
- [x] Domain logic isolated from external dependencies

### II. Modular & Scalable Design
- [x] Feature module is self-contained (MCP server package)
- [x] Clear interfaces between modules (template processing, markdown conversion, document generation, ATS scoring)
- [x] Dependency injection for loose coupling
- [x] Plugin architecture for extensibility (new templates, formats, scoring algorithms)

### III. ATS-First Optimization
- [x] Resume templates are ATS-friendly by default
- [x] Scoring algorithm validates against common ATS requirements
- [x] No minimum score threshold enforcement (handled by AI assistant guidance)
- [x] Proper heading structure and standard sections

### IV. Document Generation Pipeline
- [x] Markdown as intermediate format (template → markdown → docx/pdf)
- [x] DOCX generation preserves ATS compatibility (using docxtemplater)
- [x] PDF generation optimized for parsing (searchable text, proper font embedding)
- [x] Validation at each pipeline stage with clear error messages

### V. Template System
- [x] Templates defined as reusable, configurable components
- [x] Support for multiple resume formats (to be defined in research)
- [x] Template validation ensures ATS compliance
- [x] Version control for templates

**Result**: ✅ PASS - No constitutional violations. All principles align with MCP server architecture.

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
src/
├── domain/                  # Domain layer - business logic
│   ├── models/             # Resume, Template, ATSScore entities
│   ├── validators/         # Markdown validation logic
│   └── scoring/            # ATS scoring algorithms
│
├── application/            # Application layer - use cases
│   ├── tools/              # MCP tool implementations
│   │   ├── validate-resume.ts
│   │   ├── get-resume-template.ts
│   │   ├── list-resume-templates.ts
│   │   ├── generate-resume.ts
│   │   └── analyze-ats-score.ts
│   └── services/           # Application services
│       ├── template-service.ts
│       ├── generation-service.ts
│       └── scoring-service.ts
│
├── infrastructure/         # Infrastructure layer
│   ├── mcp/               # MCP server setup
│   │   └── server.ts
│   ├── generators/        # Document generators
│   │   ├── docx-generator.ts
│   │   ├── pdf-generator.ts
│   │   └── html-generator.ts
│   ├── parsers/           # Markdown parsers
│   │   └── markdown-parser.ts
│   └── templates/         # Template storage & loading
│       └── template-loader.ts
│
└── index.ts               # MCP server entry point

tests/
├── contract/              # MCP tool contract tests
│   └── tools/
├── integration/           # End-to-end tool tests
│   └── scenarios/
└── unit/                  # Unit tests for each layer
    ├── domain/
    ├── application/
    └── infrastructure/

templates/                 # Resume template files
├── professional/
├── modern/
└── classic/
```

**Structure Decision**: Single MCP server project with clean architecture layers. Domain logic isolated in `domain/`, application use cases in `application/`, and external concerns in `infrastructure/`. This structure supports the constitutional requirement for clean separation and enables independent testing of each layer.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
The /tasks command will generate implementation tasks based on the following approach:

1. **Contract Test Tasks** (from contracts/ directory):
   - validate-resume contract test [P]
   - get-resume-template contract test [P]
   - list-resume-templates contract test [P]
   - generate-resume contract test [P]
   - analyze-ats-score contract test [P]

2. **Domain Model Tasks** (from data-model.md):
   - Resume entity with validation [P]
   - Template entity with validation [P]
   - ATSScore entity with validation [P]
   - Value objects (ContactInfo, WorkExperience, etc.) [P]
   - Markdown structure validation rules

3. **Infrastructure Setup Tasks**:
   - MCP server initialization
   - Package.json with dependencies (docxtemplater, pizzip, puppeteer, markdown-it, zod)
   - TypeScript configuration
   - Jest test configuration
   - Project structure scaffolding

4. **Service Layer Tasks**:
   - MarkdownParser service (markdown-it integration)
   - TemplateLoader service (file-based template loading)
   - DocxGenerator service (docxtemplater + pizzip)
   - PdfGenerator service (puppeteer HTML→PDF)
   - HtmlGenerator service (markdown→HTML rendering)
   - ATSScorer service with scoring modules

5. **MCP Tool Implementation Tasks** (TDD - tests first):
   - validate-resume tool implementation
   - get-resume-template tool implementation
   - list-resume-templates tool implementation
   - generate-resume tool implementation
   - analyze-ats-score tool implementation

6. **Integration Test Tasks** (from quickstart.md):
   - End-to-end template retrieval test
   - End-to-end validation workflow test
   - End-to-end DOCX generation test
   - End-to-end PDF generation test
   - End-to-end HTML generation test
   - End-to-end ATS scoring test

7. **Template Setup Tasks**:
   - Create base resume templates (professional, modern, academic)
   - Template metadata JSON files
   - Template preview images
   - Template validation script

**Ordering Strategy**:
1. Infrastructure and setup (blocking dependencies)
2. Domain models and value objects [P] (can run in parallel)
3. Contract tests [P] (can run in parallel, will fail initially)
4. Service layer (ordered by dependencies: Parser → Generators → Scorer)
5. MCP tool implementations (TDD: make contract tests pass)
6. Integration tests (validate full workflows)
7. Template setup (data fixtures)

**Task Attributes**:
- [P] = Parallelizable (no blocking dependencies)
- Each task includes: description, dependencies, acceptance criteria, estimated time
- Tests marked as "should fail initially" for TDD workflow

**Estimated Output**: 35-40 numbered, dependency-ordered tasks in tasks.md

**Key Dependencies**:
- All MCP tools depend on: domain models, service layer
- Generators depend on: markdown parser, template loader
- ATSScorer depends on: markdown parser, domain models
- Integration tests depend on: all MCP tools implemented

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none - all principles followed)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
