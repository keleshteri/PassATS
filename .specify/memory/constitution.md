# PassATS Constitution

## Core Principles

### I. TypeScript & Clean Architecture
Written in TypeScript (Node.js) with strict typing enabled; Follow clean architecture with clear separation of concerns (domain, application, infrastructure layers); Dependency inversion principle - depend on abstractions, not implementations; Domain logic isolated from framework and external dependencies

### II. Modular & Scalable Design
Every feature module must be self-contained and independently testable; Clear interfaces between modules (template processing, markdown conversion, document generation, ATS scoring); Use dependency injection for loose coupling; Plugin architecture for extensibility (new templates, formats, scoring algorithms)

### III. ATS-First Optimization
All resume templates must be ATS-friendly by default (proper heading structure, standard sections, parseable formatting); Scoring algorithm validates against common ATS requirements (keywords, formatting, structure); Job description analysis extracts key requirements for targeted optimization; Minimum ATS score threshold enforced before document generation

### IV. Document Generation Pipeline
Markdown as the intermediate format (template → markdown → docx/pdf); DOCX generation must preserve ATS compatibility (no complex layouts, proper semantic structure); PDF generation optimized for parsing (searchable text, proper font embedding, no images for text); Validation at each pipeline stage with clear error messages

### V. Template System
Templates defined as reusable, configurable components; Support for multiple resume formats (chronological, functional, hybrid); Template validation ensures ATS compliance before use; Version control for templates with migration support

## Technical Standards

### Code Quality
ESLint and Prettier configurations enforced; Unit test coverage minimum 80%; Integration tests for critical paths (template processing, document generation, ATS scoring); Type safety - no `any` types without explicit justification; Error handling with custom error types and meaningful messages

### Performance
Document generation < 2 seconds for standard resume; ATS scoring < 1 second; Async operations for I/O (file reading, external API calls); Memory efficient for batch processing

### Data Handling
No sensitive PII stored permanently; Input validation for all user data; Sanitization before document generation; Clear data retention policies

## Development Workflow

### Feature Development
TDD approach: tests first, implementation second; Feature branches with descriptive names; Code reviews required before merge; Documentation updated with code changes

### Quality Gates
All tests must pass; No TypeScript compilation errors; ESLint warnings addressed; ATS scoring validation suite passes

## Governance

This constitution defines the core technical and architectural principles for PassATS. All development decisions must align with these principles. Exceptions require explicit documentation and approval.

**Version**: 1.0.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2025-10-04