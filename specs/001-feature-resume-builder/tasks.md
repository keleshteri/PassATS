# Tasks: Resume Builder MCP Server

**Branch**: `001-feature-resume-builder`
**Feature**: Resume Builder MCP Server
**Date**: 2025-10-04

**Input**: Design documents from `D:\Development\Projects\Products\PassATS\specs\001-feature-resume-builder\`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

---

## Overview

This task list implements the Resume Builder MCP server based on the implementation plan. Tasks are ordered by dependencies and marked with [P] for parallel execution where appropriate.

**Total Tasks**: 43 (4 completed, 39 remaining)
**Estimated Duration**: 5-7 days

---

## Phase 3.1: Setup & Infrastructure

### ✅ T001: Initialize Node.js project with TypeScript (COMPLETED)
**Description**: Create package.json with project metadata, initialize TypeScript configuration with strict mode enabled, and set up project structure according to plan.md.

**Files**:
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ Directory structure: `src/`, `tests/`, `templates/`

**Acceptance Criteria**:
- ✅ TypeScript strict mode enabled
- ✅ Node.js version >= 20.0.0 specified
- ✅ ESLint configured
- ✅ Build script produces clean output in `build/`

**Dependencies**: None

---

### ✅ T002: Install core dependencies (COMPLETED)
**Description**: Install all required npm packages: @modelcontextprotocol/sdk, docxtemplater, pizzip, puppeteer, markdown-it, zod, and all devDependencies.

**Files**:
- ✅ `package.json`
- ✅ `package-lock.json`

**Acceptance Criteria**:
- ✅ Core dependencies installed (@modelcontextprotocol/sdk, zod)
- ⚠️ Resume-specific dependencies needed (docxtemplater, pizzip, puppeteer, markdown-it)
- ✅ Lock file committed

**Dependencies**: T001

---

### T002b: Install resume-specific dependencies
**Description**: Install remaining npm packages needed for resume builder: docxtemplater, pizzip, puppeteer, markdown-it.

**Files**:
- `package.json`
- `package-lock.json`

**Acceptance Criteria**:
- All dependencies from research.md installed
- No security vulnerabilities reported
- Lock file committed

**Dependencies**: T002

---

### ✅ T003: Configure test directory structure (COMPLETED)
**Description**: Create test directory structure for contract, unit, and integration tests. Project uses Node.js native test runner (not Jest).

**Files**:
- ✅ `tests/contract/`
- ✅ `tests/unit/`
- ✅ `tests/integration/` (already exists)

**Acceptance Criteria**:
- ✅ Test directories created
- ✅ Test script works with Node.js test runner
- ✅ Directory structure matches plan

**Dependencies**: T002

---

### ✅ T004: Set up ESLint (COMPLETED)
**Description**: Configure ESLint with TypeScript parser and @typescript-eslint plugin.

**Files**:
- ✅ `eslint.config.mjs`

**Acceptance Criteria**:
- ✅ Linting runs without errors
- ✅ npm scripts for lint and lint:fix

**Dependencies**: T002

---

## Phase 3.2: Contract Tests (TDD - Must Fail Initially) ⚠️

**CRITICAL**: All contract tests MUST be written and MUST FAIL before any implementation begins.

### T005 [P]: Contract test for validate-resume tool
**Description**: Write contract test for validate-resume tool in `tests/contract/validate-resume.test.ts` following test scenarios from `contracts/validate-resume.json`.

**Files**:
- `tests/contract/validate-resume.test.ts`

**Test Scenarios**:
- Valid complete resume → valid=true
- Invalid resume with missing education → valid=false with error code
- Invalid email format → INVALID_EMAIL error
- Invalid phone format → INVALID_PHONE error
- Empty sections → EMPTY_SECTION errors

**Acceptance Criteria**:
- All 5+ test scenarios from contract implemented
- Tests MUST FAIL (tool not implemented yet)
- Assertions match contract outputSchema
- Use Node.js native test runner (not Jest)

**Dependencies**: T003

---

### T006 [P]: Contract test for get-resume-template tool
**Description**: Write contract test for get-resume-template tool in `tests/contract/get-resume-template.test.ts` following test scenarios from `contracts/get-resume-template.json`.

**Files**:
- `tests/contract/get-resume-template.test.ts`

**Test Scenarios**:
- Default markdown format returns complete template
- JSON format returns valid JSON template
- All required sections present in metadata
- Comprehensive formatting rules (>= 10 rules)

**Acceptance Criteria**:
- All test scenarios implemented
- Tests MUST FAIL (tool not implemented yet)
- Template validation assertions included
- Use Node.js native test runner (not Jest)

**Dependencies**: T003

---

### T007 [P]: Contract test for list-resume-templates tool
**Description**: Write contract test for list-resume-templates tool in `tests/contract/list-resume-templates.test.ts` following test scenarios from `contracts/list-resume-templates.json`.

**Files**:
- `tests/contract/list-resume-templates.test.ts`

**Test Scenarios**:
- List all templates returns >= 5 templates
- Filter by category=professional
- Filter by industryFocus=technology
- Template metadata validation
- Templates sorted by category then name

**Acceptance Criteria**:
- All filter scenarios tested
- Tests MUST FAIL (tool not implemented yet)
- Metadata validation for each template
- Use Node.js native test runner (not Jest)

**Dependencies**: T003

---

### T008 [P]: Contract test for generate-resume tool
**Description**: Write contract test for generate-resume tool in `tests/contract/generate-resume.test.ts` following test scenarios from `contracts/generate-resume.json`.

**Files**:
- `tests/contract/generate-resume.test.ts`

**Test Scenarios**:
- Generate valid DOCX from markdown
- Generate valid PDF with searchable text
- Generate valid HTML with proper structure
- Custom filename handling
- Auto-generate filename from name
- Error handling for invalid template ID
- Error handling for invalid markdown
- Content preservation verification

**Acceptance Criteria**:
- All 8 test scenarios implemented
- Tests MUST FAIL (tool not implemented yet)
- Base64 decoding and file validation
- Use Node.js native test runner (not Jest)

**Dependencies**: T003

---

### T009 [P]: Contract test for analyze-ats-score tool
**Description**: Write contract test for analyze-ats-score tool in `tests/contract/analyze-ats-score.test.ts` following test scenarios from `contracts/analyze-ats-score.json`.

**Files**:
- `tests/contract/analyze-ats-score.test.ts`

**Test Scenarios**:
- Well-formatted resume returns excellent score (>= 85)
- Poorly formatted resume returns poor score (<= 40)
- Missing sections detection
- Invalid contact information detection
- Job description targeting
- Score breakdown validation
- Personal pronouns detection
- Detail level variations

**Acceptance Criteria**:
- All 8 test scenarios implemented
- Tests MUST FAIL (tool not implemented yet)
- Score math validation (breakdown sums to total)
- Use Node.js native test runner (not Jest)

**Dependencies**: T003

---

## Phase 3.3: Domain Layer Implementation

### T010 [P]: Implement ContactInfo value object
**Description**: Create ContactInfo value object in `src/domain/models/contact-info.ts` with validation logic from data-model.md.

**Files**:
- `src/domain/models/contact-info.ts`

**Properties**:
- fullName, email, phone (required)
- location, linkedin, github, portfolio, website (optional)

**Validation**:
- Email must match RFC 5322 format
- Phone must be E.164 format
- URLs must be valid HTTPS
- LinkedIn/GitHub URL pattern validation

**Acceptance Criteria**:
- All validations enforced
- TypeScript strict typing
- Immutable value object

**Dependencies**: T004

---

### T011 [P]: Implement DatePeriod value object
**Description**: Create DatePeriod value object in `src/domain/models/date-period.ts` with month/year validation.

**Files**:
- `src/domain/models/date-period.ts`

**Properties**:
- month: number (1-12)
- year: number (1950-2030)

**Acceptance Criteria**:
- Month/year range validation
- Comparison methods (isBefore, isAfter)
- Format method (MM/YYYY)

**Dependencies**: T004

---

### T012 [P]: Implement WorkExperience value object
**Description**: Create WorkExperience value object in `src/domain/models/work-experience.ts` with all fields from data-model.md.

**Files**:
- `src/domain/models/work-experience.ts`

**Dependencies**: T011 (DatePeriod)

**Acceptance Criteria**:
- All fields validated
- startDate < endDate validation
- current flag consistency check
- Responsibilities array >= 2 items

**Dependencies**: T011

---

### T013 [P]: Implement Education value object
**Description**: Create Education value object in `src/domain/models/education.ts` with degree, institution, graduation date.

**Files**:
- `src/domain/models/education.ts`

**Dependencies**: T011 (DatePeriod)

**Acceptance Criteria**:
- GPA validation (0.0-4.0)
- Required field validation
- Optional honors/courses arrays

**Dependencies**: T011

---

### T014 [P]: Implement SkillCategory value object
**Description**: Create SkillCategory value object in `src/domain/models/skill-category.ts` with category name and skills array.

**Files**:
- `src/domain/models/skill-category.ts`

**Acceptance Criteria**:
- Category name validation (2-50 chars)
- Skills array >= 1 item
- Duplicate skill detection

**Dependencies**: T004

---

### T015 [P]: Implement Certification, Project, Award value objects
**Description**: Create remaining value objects in `src/domain/models/` for certifications, projects, and awards.

**Files**:
- `src/domain/models/certification.ts`
- `src/domain/models/project.ts`
- `src/domain/models/award.ts`

**Dependencies**: T011 (DatePeriod)

**Acceptance Criteria**:
- All fields from data-model.md implemented
- Validation rules enforced
- TypeScript strict typing

**Dependencies**: T011

---

### T016: Implement Resume entity
**Description**: Create Resume entity in `src/domain/models/resume.ts` aggregating all value objects.

**Files**:
- `src/domain/models/resume.ts`

**Dependencies**: T010-T015 (all value objects)

**Acceptance Criteria**:
- All sections from data-model.md
- Business rules enforced (reverse chronological order)
- Invariants validated
- 50,000 character limit

**Dependencies**: T010, T011, T012, T013, T014, T015

---

### T017 [P]: Implement Template entity
**Description**: Create Template entity in `src/domain/models/template.ts` with metadata and configuration.

**Files**:
- `src/domain/models/template.ts`

**Acceptance Criteria**:
- All properties from data-model.md
- Version semver validation
- SectionConfig array
- Template category enum

**Dependencies**: T004

---

### T018 [P]: Implement ATSScore entity
**Description**: Create ATSScore entity in `src/domain/models/ats-score.ts` with score breakdown and issues.

**Files**:
- `src/domain/models/ats-score.ts`

**Acceptance Criteria**:
- Score 0-100 validation
- Rating calculation (poor/fair/good/excellent)
- Breakdown validation (sums to total)
- Issues and recommendations arrays

**Dependencies**: T004

---

### T019 [P]: Implement markdown validation rules
**Description**: Create markdown structure validation logic in `src/domain/validators/markdown-validator.ts`.

**Files**:
- `src/domain/validators/markdown-validator.ts`

**Validation Rules**:
- H1 heading for name
- H2 sections required
- H3 for job titles
- No H4+ headings
- Date format validation
- No personal pronouns

**Acceptance Criteria**:
- All 10 validation rules from data-model.md
- Returns ValidationError codes
- Suggestion generation

**Dependencies**: T004

---

## Phase 3.4: Infrastructure Layer Implementation

### T020: Implement MarkdownParser service
**Description**: Create markdown parser using markdown-it in `src/infrastructure/parsers/markdown-parser.ts`.

**Files**:
- `src/infrastructure/parsers/markdown-parser.ts`

**Dependencies**: markdown-it library

**Acceptance Criteria**:
- Parse markdown to AST
- Extract sections
- HTML sanitization
- CommonMark compliance

**Dependencies**: T002

---

### T021: Implement TemplateLoader service
**Description**: Create template loading service in `src/infrastructure/templates/template-loader.ts` for file-based templates.

**Files**:
- `src/infrastructure/templates/template-loader.ts`

**Acceptance Criteria**:
- Load template files from templates/ directory
- Load metadata.json for each template
- Template caching
- Template validation on load

**Dependencies**: T017

---

### T022: Implement DocxGenerator service
**Description**: Create DOCX generation service in `src/infrastructure/generators/docx-generator.ts` using docxtemplater and pizzip.

**Files**:
- `src/infrastructure/generators/docx-generator.ts`

**Dependencies**: docxtemplater, pizzip

**Acceptance Criteria**:
- Template variable substitution
- Loop constructs for arrays
- Proper XML escaping
- Base64 output encoding

**Dependencies**: T002, T020, T021

---

### T023: Implement PdfGenerator service
**Description**: Create PDF generation service in `src/infrastructure/generators/pdf-generator.ts` using Puppeteer.

**Files**:
- `src/infrastructure/generators/pdf-generator.ts`

**Dependencies**: puppeteer

**Acceptance Criteria**:
- HTML to PDF conversion
- Searchable text preservation
- A4/Letter page size support
- Metadata embedding
- Base64 output encoding

**Dependencies**: T002, T020

---

### T024 [P]: Implement HtmlGenerator service
**Description**: Create HTML generation service in `src/infrastructure/generators/html-generator.ts`.

**Files**:
- `src/infrastructure/generators/html-generator.ts`

**Dependencies**: markdown-it

**Acceptance Criteria**:
- Markdown to HTML conversion
- CSS template application
- Semantic HTML structure
- Proper DOCTYPE and meta tags

**Dependencies**: T002, T020

---

### T025: Implement ATS scoring modules
**Description**: Create ATS scoring modules in `src/domain/scoring/` with pluggable architecture.

**Files**:
- `src/domain/scoring/scoring-module.interface.ts`
- `src/domain/scoring/formatting-scorer.ts`
- `src/domain/scoring/keyword-scorer.ts`
- `src/domain/scoring/technical-scorer.ts`
- `src/domain/scoring/readability-scorer.ts`
- `src/domain/scoring/ats-scorer.ts`

**Scoring Weights**:
- Formatting: 30 points
- Keywords: 25 points
- Technical: 25 points
- Readability: 20 points

**Acceptance Criteria**:
- All 4 scoring modules implemented
- Weighted aggregation in ATSScorer
- Issue and recommendation generation
- Pluggable module interface

**Dependencies**: T018, T019, T020

---

## Phase 3.5: Application Layer Implementation

### T026: Implement TemplateService
**Description**: Create application service for template operations in `src/application/services/template-service.ts`.

**Files**:
- `src/application/services/template-service.ts`

**Operations**:
- getTemplate(format)
- listTemplates(filters)
- validateTemplate(id)

**Acceptance Criteria**:
- Uses TemplateLoader from infrastructure
- Filtering logic for category/industry
- Template sorting (category, name)

**Dependencies**: T021

---

### T027: Implement GenerationService
**Description**: Create application service for document generation in `src/application/services/generation-service.ts`.

**Files**:
- `src/application/services/generation-service.ts`

**Operations**:
- generateDocx(resume, templateId)
- generatePdf(resume, templateId)
- generateHtml(resume, templateId)

**Acceptance Criteria**:
- Orchestrates parser + generator services
- Error handling with proper error codes
- Metadata generation
- Filename generation from resume name

**Dependencies**: T022, T023, T024

---

### T028: Implement ScoringService
**Description**: Create application service for ATS scoring in `src/application/services/scoring-service.ts`.

**Files**:
- `src/application/services/scoring-service.ts`

**Acceptance Criteria**:
- Uses ATSScorer from domain
- Detail level handling (basic/detailed/comprehensive)
- Job description targeting (optional)
- Results caching

**Dependencies**: T025

---

## Phase 3.6: MCP Tool Implementation

### T029: Implement validate-resume MCP tool
**Description**: Implement validate-resume tool in `src/application/tools/validate-resume.ts` to make T005 pass.

**Files**:
- `src/application/tools/validate-resume.ts`

**Acceptance Criteria**:
- Zod schema validation
- Uses MarkdownValidator from domain
- Returns ValidationResult matching contract
- All contract tests (T005) pass

**Dependencies**: T019, T020

---

### T030: Implement get-resume-template MCP tool
**Description**: Implement get-resume-template tool in `src/application/tools/get-resume-template.ts` to make T006 pass.

**Files**:
- `src/application/tools/get-resume-template.ts`

**Acceptance Criteria**:
- Returns markdown or JSON format
- Includes sections and rules metadata
- Version information
- All contract tests (T006) pass

**Dependencies**: T026

---

### T031: Implement list-resume-templates MCP tool
**Description**: Implement list-resume-templates tool in `src/application/tools/list-resume-templates.ts` to make T007 pass.

**Files**:
- `src/application/tools/list-resume-templates.ts`

**Acceptance Criteria**:
- Filtering by category and industryFocus
- Template sorting
- Count matches array length
- All contract tests (T007) pass

**Dependencies**: T026

---

### T032: Implement generate-resume MCP tool
**Description**: Implement generate-resume tool in `src/application/tools/generate-resume.ts` to make T008 pass.

**Files**:
- `src/application/tools/generate-resume.ts`

**Acceptance Criteria**:
- Format selection (docx/pdf/html)
- Template validation
- Content validation before generation
- Base64 encoding
- All contract tests (T008) pass

**Dependencies**: T027, T029

---

### T033: Implement analyze-ats-score MCP tool
**Description**: Implement analyze-ats-score tool in `src/application/tools/analyze-ats-score.ts` to make T009 pass.

**Files**:
- `src/application/tools/analyze-ats-score.ts`

**Acceptance Criteria**:
- Detail level handling
- Job description support
- Score breakdown validation
- All contract tests (T009) pass

**Dependencies**: T028

---

### T034: Implement MCP server
**Description**: Create MCP server in `src/infrastructure/mcp/server.ts` registering all tools.

**Files**:
- `src/infrastructure/mcp/server.ts`
- `src/index.ts`

**Acceptance Criteria**:
- All 5 tools registered
- Proper error handling
- Logging configured
- Server starts successfully

**Dependencies**: T029, T030, T031, T032, T033

---

## Phase 3.7: Template Creation

### T035 [P]: Create professional-classic template
**Description**: Create professional resume template in `templates/professional/`.

**Files**:
- `templates/professional/template.docx`
- `templates/professional/metadata.json`
- `templates/professional/preview.png`

**Acceptance Criteria**:
- DOCX template with placeholders
- Metadata with all required fields
- ATS-friendly layout validation

**Dependencies**: None

---

### T036 [P]: Create modern-tech template
**Description**: Create modern tech resume template in `templates/modern/`.

**Files**:
- `templates/modern/template.docx`
- `templates/modern/metadata.json`
- `templates/modern/preview.png`

**Acceptance Criteria**:
- Clean contemporary design
- Technology industry focus
- Metadata complete

**Dependencies**: None

---

### T037 [P]: Create additional templates
**Description**: Create 3+ additional templates (creative, academic, technical) in `templates/`.

**Files**:
- `templates/creative/`
- `templates/academic/`
- `templates/technical/`

**Acceptance Criteria**:
- At least 5 total templates
- Each with complete metadata
- Category and industry diversity

**Dependencies**: None

---

## Phase 3.8: Integration Tests

### T038 [P]: Integration test - Template retrieval workflow
**Description**: Write integration test for get-template and list-templates workflow in `tests/integration/template-workflow.test.ts`.

**Files**:
- `tests/integration/template-workflow.test.ts`

**Scenario**: From quickstart.md Workflow 1 & 2

**Acceptance Criteria**:
- Get template returns valid template
- List filters work correctly
- Template count matches expectations

**Dependencies**: T030, T031, T035, T036, T037

---

### T039 [P]: Integration test - Validation workflow
**Description**: Write integration test for validate-resume workflow in `tests/integration/validation-workflow.test.ts`.

**Files**:
- `tests/integration/validation-workflow.test.ts`

**Scenario**: From quickstart.md Workflow 3

**Acceptance Criteria**:
- Valid resume validates successfully
- Invalid resume returns specific errors
- Suggestions are actionable

**Dependencies**: T029

---

### T040 [P]: Integration test - Document generation workflow
**Description**: Write integration test for complete generation workflow in `tests/integration/generation-workflow.test.ts`.

**Files**:
- `tests/integration/generation-workflow.test.ts`

**Scenario**: From quickstart.md Workflow 4

**Acceptance Criteria**:
- DOCX generation produces valid file
- PDF generation produces searchable PDF
- HTML generation produces valid HTML
- Content preservation verified

**Dependencies**: T032, T035

---

### T041 [P]: Integration test - ATS scoring workflow
**Description**: Write integration test for ATS scoring workflow in `tests/integration/scoring-workflow.test.ts`.

**Files**:
- `tests/integration/scoring-workflow.test.ts`

**Scenario**: From quickstart.md Workflow 5

**Acceptance Criteria**:
- Excellent resume scores >= 85
- Poor resume scores <= 40
- Recommendations are prioritized
- Score breakdown validates

**Dependencies**: T033

---

## Phase 3.9: Polish & Documentation

### T042: Run complete quickstart validation
**Description**: Execute all workflows from quickstart.md manually and verify success criteria.

**Reference**: `specs/001-feature-resume-builder/quickstart.md`

**Acceptance Criteria**:
- All 5 workflows complete successfully
- Performance benchmarks met (<2s generation)
- Error scenarios handled correctly
- All success criteria checkboxes ticked

**Dependencies**: T038, T039, T040, T041

---

## Dependencies Graph

```
Setup Phase:
✅ T001 → ✅ T002 → T002b, T003, ✅ T004

Contract Tests (parallel after setup):
T003 → T005, T006, T007, T008, T009

Domain Layer (parallel after setup):
T004 → T010, T011, T014, T017, T018, T019
T011 → T012, T013, T015
T010, T011, T012, T013, T014, T015 → T016

Infrastructure Layer:
T002 → T020, T022, T023, T024
T017 → T021
T020, T021 → T022
T020 → T023, T024
T018, T019, T020 → T025

Application Layer:
T021 → T026
T022, T023, T024 → T027
T025 → T028

MCP Tools:
T019, T020 → T029
T026 → T030, T031
T027, T029 → T032
T028 → T033
T029, T030, T031, T032, T033 → T034

Templates (parallel, independent):
None → T035, T036, T037

Integration Tests:
T030, T031, T035, T036, T037 → T038
T029 → T039
T032, T035 → T040
T033 → T041

Final Validation:
T038, T039, T040, T041 → T042
```

---

## Parallel Execution Examples

### Example 1: Contract Tests (After T003)
All contract tests can run in parallel since they're independent:

```bash
# Launch all contract test creation in parallel
Task: "Write contract test for validate-resume in tests/contract/validate-resume.test.ts"
Task: "Write contract test for get-resume-template in tests/contract/get-resume-template.test.ts"
Task: "Write contract test for list-resume-templates in tests/contract/list-resume-templates.test.ts"
Task: "Write contract test for generate-resume in tests/contract/generate-resume.test.ts"
Task: "Write contract test for analyze-ats-score in tests/contract/analyze-ats-score.test.ts"
```

### Example 2: Value Objects (After T011)
Value objects that don't depend on each other:

```bash
Task: "Implement WorkExperience value object in src/domain/models/work-experience.ts"
Task: "Implement Education value object in src/domain/models/education.ts"
Task: "Implement Certification, Project, Award in src/domain/models/"
```

### Example 3: Templates (Anytime)
Template creation is completely independent:

```bash
Task: "Create professional-classic template in templates/professional/"
Task: "Create modern-tech template in templates/modern/"
Task: "Create additional templates (creative, academic, technical)"
```

### Example 4: Integration Tests (After implementations)
Integration tests can run in parallel:

```bash
Task: "Integration test template retrieval workflow"
Task: "Integration test validation workflow"
Task: "Integration test document generation workflow"
Task: "Integration test ATS scoring workflow"
```

---

## Validation Checklist

### Gate Checks (Before marking tasks.md complete):

- [x] All contracts have corresponding tests (T005-T009)
- [x] All entities from data-model.md have tasks (Resume, Template, ATSScore, value objects)
- [x] All 5 MCP tools have implementation tasks (T029-T033)
- [x] All tests come before implementation (T005-T009 before T029-T033)
- [x] Parallel tasks are truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Contract files mapped to contract tests (5 contracts → 5 test tasks)
- [x] Entities mapped to model tasks (Resume + 8 value objects)
- [x] All endpoints (MCP tools) implemented (5 tools)
- [x] Dependencies properly ordered (Setup → Tests → Models → Services → Tools → Integration)

### Completed Tasks:

- [x] T001: TypeScript project initialized
- [x] T002: Core MCP dependencies installed
- [x] T003: Test directory structure configured
- [x] T004: ESLint configured

---

## Notes

- **TDD Emphasis**: Contract tests (T005-T009) MUST be completed and MUST FAIL before starting implementations (T029-T033)
- **Parallel Execution**: Tasks marked [P] can be worked on simultaneously by different agents or developers
- **File Paths**: All file paths are absolute from repository root
- **Test-First**: All contract tests written before implementations to follow TDD
- **Acceptance Criteria**: Each task has specific, measurable acceptance criteria
- **Clean Architecture**: Tasks ordered to maintain dependency inversion (domain → application → infrastructure)
- **Test Framework**: Project uses Node.js native test runner (not Jest) - all contract tests updated accordingly
- **Resume Dependencies**: Still need to install: docxtemplater, pizzip, puppeteer, markdown-it (T002b)

---

**Status**: ✅ UPDATED - 4 tasks completed, ready for /implement command execution
