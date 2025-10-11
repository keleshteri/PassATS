# Project Context

## Purpose
PassATS is an AI-powered ATS (Applicant Tracking System) resume builder that helps users create optimized resumes tailored for specific job applications. The core mission is to maximize resume success rates by ensuring ATS compatibility while providing AI-driven analysis and recommendations.

### Core Goals
- Enable users to manage comprehensive professional information in one place
- Generate ATS-optimized resumes using pre-built templates with dynamic content injection
- Provide AI-powered ATS analysis with scoring and optimization recommendations
- Export resumes in multiple formats (DOCX, PDF) with maximum ATS compatibility
- Optimize resumes for specific job titles and descriptions using AI analysis

## Tech Stack

### Frontend Framework
- **Nuxt 3** - Vue.js meta-framework for server-side rendering and static site generation
- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vue Router** - Official routing library for Vue.js
- **Tailwind CSS** - Utility-first CSS framework for styling

### Nuxt Modules & Tools
- **@nuxt/eslint** - Code linting and formatting
- **@nuxt/test-utils** - Testing utilities for Nuxt applications
- **@nuxt/image** - Optimized image component
- **@nuxt/icon** - Icon management system
- **@nuxt/fonts** - Font optimization and loading
- **@nuxtjs/tailwindcss** - Tailwind CSS integration

### State Management & Data
- **Pinia** - Official Vue state management library
- **Zod** - TypeScript-first schema validation
- **@vueuse/core** - Collection of Vue composition utilities

### Document Generation
- **Puppeteer** - Headless browser for HTML-to-PDF conversion (server-side)
  - Generates ATS-optimized PDF resumes from HTML templates
  - Ensures pixel-perfect rendering with full Tailwind CSS support
- **docx** - Library for programmatic DOCX file creation
  - Generates native Word documents with full formatting control
  - Ensures maximum ATS compatibility
- **docxtemplater + pizzip** - Template-based DOCX generation (alternative approach)
  - Uses pre-built .docx templates with placeholder replacement

### AI Integration
- API integration for AI-powered resume analysis
  - ATS scoring and optimization recommendations
  - Grammar and content improvement suggestions
  - Job-specific keyword analysis and tailoring

## Project Conventions

### Code Style
- **TypeScript** - Type-safe code throughout the application
- **ESLint** - Code quality and consistency enforcement with Nuxt ESLint configuration
- **Tailwind utility classes** - Consistent styling across templates and components
- **Composition API** - Vue 3 composables for reusable logic

### Architecture Patterns
- **Component-driven architecture** - Modular, reusable Vue components
- **API Routes** - Nuxt server routes for document generation and AI processing
- **Template Architecture**:
  - HTML/CSS-based resume templates using Tailwind classes
  - Server-side rendering for PDF generation via Puppeteer
  - Programmatic DOCX creation mirroring HTML templates
  - Placeholder-based content injection for user data
  - ATS-friendly formatting rules enforced across all templates

### Testing Strategy
- **@nuxt/test-utils** for Nuxt-specific testing utilities
- Focus on ATS compatibility testing for generated documents
- Template rendering validation
- AI integration testing for resume analysis

### Git Workflow
- Main branch development with feature branches
- TypeScript compilation validation before commits
- ESLint checks integrated into development workflow

## Domain Context

### User Information Management
Users can add and manage comprehensive professional information:
- Contact Information
- Work Experience
- Education
- Certifications
- Skills
- Professional Summary
- Projects
- Coursework
- Involvement/Activities

### Resume Generation Process
1. Users provide job title and job description
2. System selects appropriate template
3. User data populates template placeholders
4. AI analysis optimizes content for ATS compatibility
5. Export in DOCX or PDF format

### ATS Analysis & Scoring
The AI system evaluates resumes based on:
- **Formatting** - Structure and layout optimization
- **Grammar** - Language quality and clarity
- **Keyword optimization** - Job-specific keyword matching
- **Structure** - Logical information organization
- **ATS parsing factors** - Technical compatibility with ATS systems

## Important Constraints

### ATS Compatibility Requirements
- Templates must follow ATS-friendly formatting rules
- No complex layouts, tables, or graphics that confuse ATS parsers
- Consistent font usage and standard section headers
- Proper document structure for both DOCX and PDF formats

### Document Generation Constraints
- PDF generation requires server-side Puppeteer processing
- DOCX generation must maintain formatting compatibility across Word versions
- Templates must render consistently across different export formats

### Performance Considerations
- Server-side document generation may require processing time limits
- AI analysis API calls need proper error handling and timeouts
- Large user data sets require efficient state management

## External Dependencies

### AI Services
- External AI API for resume analysis and ATS scoring
- Natural language processing for content optimization
- Keyword analysis and job description matching services

### Document Processing
- Puppeteer dependency for headless browser PDF generation
- External font resources managed through @nuxt/fonts
- Template assets and styling dependencies

### Development Tools
- ESLint configuration and rule sets
- Tailwind CSS framework and plugins
- Vue 3 and Nuxt 3 ecosystem dependencies
