# Data Model: Resume Builder

**Feature**: Resume Builder MCP Server
**Date**: 2025-10-04

## Overview
This document defines the core domain entities, value objects, and their relationships for the Resume Builder feature. All entities follow TypeScript strict typing and support the MCP tool operations defined in the specification.

---

## Domain Entities

### 1. Resume
**Purpose**: Represents a complete resume with all sections and content

**Properties**:
```typescript
interface Resume {
  // Metadata
  id: string;                    // UUID v4
  version: string;               // Semantic version (1.0.0)
  createdAt: Date;
  updatedAt: Date;

  // Contact Information
  contact: ContactInfo;

  // Resume Sections
  summary?: string;              // Optional professional summary
  experience: WorkExperience[];  // Work history (chronological)
  education: Education[];        // Educational background
  skills: SkillCategory[];       // Categorized skills
  certifications?: Certification[]; // Optional certifications
  projects?: Project[];          // Optional projects
  awards?: Award[];              // Optional awards/honors

  // Metadata
  templateId?: string;           // Associated template (if any)
  language: string;              // ISO 639-1 code (default: 'en')
  lastValidated?: Date;          // Last validation timestamp
}
```

**Validation Rules**:
- `id` must be valid UUID v4
- `experience` array must not be empty
- `education` array must have at least one entry
- `skills` array must not be empty
- `contact.email` must be valid email format
- `contact.phone` must be valid phone format (E.164)
- Total content length must not exceed 50,000 characters

**Business Rules**:
- Experience entries must be in reverse chronological order
- Education entries must be in reverse chronological order
- Each section must follow markdown template structure
- No personal pronouns (I, me, my) in any section

---

### 2. Template
**Purpose**: Defines a resume template with styling and structure configuration

**Properties**:
```typescript
interface Template {
  // Identification
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Human-readable name
  version: string;               // Template version (semver)

  // Metadata
  description: string;           // Brief description
  category: TemplateCategory;    // Category classification
  industryFocus: string[];       // Target industries
  formalityLevel: FormalityLevel; // Formality rating

  // Structure
  sections: SectionConfig[];     // Supported sections
  features: string[];            // Template features

  // Assets
  docxPath: string;              // Path to DOCX template file
  htmlPath?: string;             // Optional HTML template
  previewPath?: string;          // Preview image path
  cssPath?: string;              // Custom CSS for HTML/PDF

  // Status
  isActive: boolean;             // Available for use
  createdAt: Date;
  updatedAt: Date;
}
```

**Type Definitions**:
```typescript
type TemplateCategory = 'professional' | 'modern' | 'creative' | 'academic' | 'technical';
type FormalityLevel = 'formal' | 'business' | 'casual';

interface SectionConfig {
  name: string;                  // Section identifier
  required: boolean;             // Is section mandatory
  order: number;                 // Display order
  heading: string;               // Default heading text
}
```

**Validation Rules**:
- `id` must be unique across all templates
- `id` must be kebab-case format
- `docxPath` must point to existing file
- `sections` must include at minimum: contact, experience, education, skills
- `version` must follow semver format
- `industryFocus` must not be empty array

**Business Rules**:
- Templates must be validated for ATS compliance before activation
- Template files must be immutable (versioned changes only)
- Section order determines rendering sequence

---

### 3. ATSScore
**Purpose**: Represents ATS compatibility analysis results

**Properties**:
```typescript
interface ATSScore {
  // Identification
  resumeId: string;              // Associated resume ID
  timestamp: Date;               // Analysis timestamp

  // Overall Score
  score: number;                 // 0-100 scale
  rating: ScoreRating;           // Categorical rating

  // Breakdown
  breakdown: ScoreBreakdown;     // Sub-scores by category

  // Issues
  issues: ATSIssue[];            // Identified problems

  // Recommendations
  recommendations: Recommendation[]; // Improvement suggestions

  // Metadata
  analyzerVersion: string;       // Scoring algorithm version
}
```

**Type Definitions**:
```typescript
type ScoreRating = 'poor' | 'fair' | 'good' | 'excellent';

interface ScoreBreakdown {
  formatting: number;            // 0-30 points
  keywords: number;              // 0-25 points
  technical: number;             // 0-25 points
  readability: number;           // 0-20 points
}

interface ATSIssue {
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  location?: string;             // Section or line reference
  impact: number;                // Points deducted
}

type IssueCategory =
  | 'formatting'
  | 'structure'
  | 'keywords'
  | 'compatibility'
  | 'readability';

type IssueSeverity = 'critical' | 'warning' | 'info';

interface Recommendation {
  title: string;
  description: string;
  category: IssueCategory;
  potentialGain: number;         // Points that could be gained
  priority: 'high' | 'medium' | 'low';
}
```

**Validation Rules**:
- `score` must be between 0 and 100 (inclusive)
- `breakdown` scores must sum to `score`
- Each breakdown score must not exceed its maximum
- `issues` array must have at least one item if score < 100
- `recommendations` must be sorted by potentialGain (descending)

**Business Rules**:
- Score rating mapping:
  - 0-40: poor
  - 41-70: fair
  - 71-85: good
  - 86-100: excellent
- Critical issues must have potentialGain >= 10
- Issues must be deduplicated

---

## Value Objects

### ContactInfo
**Purpose**: Encapsulates contact information

```typescript
interface ContactInfo {
  fullName: string;              // First + Last name
  email: string;                 // Valid email address
  phone: string;                 // E.164 format
  location?: string;             // City, State/Country
  linkedin?: string;             // LinkedIn URL
  github?: string;               // GitHub URL
  portfolio?: string;            // Portfolio URL
  website?: string;              // Personal website URL
}
```

**Validation**:
- `fullName` must be 2-100 characters
- `email` must match RFC 5322 format
- `phone` must be E.164 format (e.g., +1234567890)
- All URLs must be valid HTTPS URLs
- LinkedIn URL must match pattern: `https://linkedin.com/in/*`
- GitHub URL must match pattern: `https://github.com/*`

---

### WorkExperience
**Purpose**: Represents a single work experience entry

```typescript
interface WorkExperience {
  title: string;                 // Job title
  company: string;               // Company name
  location?: string;             // City, State/Country
  startDate: DatePeriod;         // Start month/year
  endDate?: DatePeriod;          // End month/year (null if current)
  current: boolean;              // Currently employed
  responsibilities: string[];    // Bullet points
  achievements?: string[];       // Optional achievements
  technologies?: string[];       // Technologies used
}

interface DatePeriod {
  month: number;                 // 1-12
  year: number;                  // YYYY
}
```

**Validation**:
- `title` must be 2-100 characters
- `company` must be 2-100 characters
- `responsibilities` must have at least 2 items
- Each responsibility must start with action verb
- `startDate` must be before `endDate` (if present)
- `current` must be true if `endDate` is null

**Formatting Rules**:
- Dates formatted as "MM/YYYY" or "Month YYYY"
- Current positions show "Present" for end date
- No personal pronouns in responsibilities

---

### Education
**Purpose**: Represents educational background entry

```typescript
interface Education {
  degree: string;                // Degree type and major
  institution: string;           // University/School name
  location?: string;             // City, State/Country
  graduationDate: DatePeriod;    // Month/Year or Year only
  gpa?: number;                  // 0.0-4.0 scale
  honors?: string[];             // Honors/Awards
  relevantCourses?: string[];    // Relevant coursework
}
```

**Validation**:
- `degree` must be 2-150 characters
- `institution` must be 2-150 characters
- `gpa` must be between 0.0 and 4.0
- `honors` items must be 2-100 characters each
- `graduationDate.year` must be reasonable (1950-2030)

---

### SkillCategory
**Purpose**: Categorized grouping of skills

```typescript
interface SkillCategory {
  category: string;              // Category name
  skills: string[];              // List of skills
  proficiencyLevel?: ProficiencyLevel; // Optional proficiency
}

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
```

**Validation**:
- `category` must be 2-50 characters
- `skills` must have at least 1 item
- Each skill must be 2-50 characters
- No duplicate skills within category

**Common Categories**:
- Technical Skills
- Programming Languages
- Frameworks & Libraries
- Tools & Technologies
- Soft Skills
- Languages (Human)

---

### Certification
**Purpose**: Professional certification or license

```typescript
interface Certification {
  name: string;                  // Certification name
  issuer: string;                // Issuing organization
  issueDate: DatePeriod;         // Issue month/year
  expiryDate?: DatePeriod;       // Expiry (if applicable)
  credentialId?: string;         // Credential ID
  url?: string;                  // Verification URL
}
```

**Validation**:
- `name` must be 2-150 characters
- `issuer` must be 2-150 characters
- `issueDate` must be in the past
- `expiryDate` must be after `issueDate`
- `url` must be valid HTTPS URL

---

### Project
**Purpose**: Personal or professional project

```typescript
interface Project {
  name: string;                  // Project name
  description: string;           // Brief description
  role?: string;                 // Your role
  technologies: string[];        // Technologies used
  url?: string;                  // Project URL
  startDate?: DatePeriod;        // Start date
  endDate?: DatePeriod;          // End date
  highlights: string[];          // Key achievements
}
```

**Validation**:
- `name` must be 2-100 characters
- `description` must be 10-500 characters
- `technologies` must have at least 1 item
- `highlights` must have at least 1 item
- Each highlight must be 10-200 characters

---

### Award
**Purpose**: Award or honor received

```typescript
interface Award {
  title: string;                 // Award title
  issuer: string;                // Issuing organization
  date: DatePeriod;              // Date received
  description?: string;          // Optional description
}
```

**Validation**:
- `title` must be 2-150 characters
- `issuer` must be 2-150 characters
- `date` must be in the past
- `description` must be 10-500 characters (if provided)

---

## Markdown Resume Structure

### Required Format
```markdown
# [Full Name]

**Email**: [email] | **Phone**: [phone] | **Location**: [location]
[LinkedIn] | [GitHub] | [Portfolio]

## Professional Summary
[Brief summary paragraph]

## Work Experience

### [Job Title] at [Company]
**[Location]** | **[Start Date] - [End Date/Present]**

- [Responsibility/achievement 1]
- [Responsibility/achievement 2]
- [Responsibility/achievement 3]

### [Job Title] at [Company]
...

## Education

### [Degree] - [Institution]
**[Location]** | **Graduated: [Date]**
GPA: [X.XX] (if applicable)

## Skills

**[Category 1]**: [Skill 1], [Skill 2], [Skill 3]
**[Category 2]**: [Skill 1], [Skill 2], [Skill 3]

## Certifications (Optional)

- [Certification Name] - [Issuer] ([Date])
- [Certification Name] - [Issuer] ([Date])

## Projects (Optional)

### [Project Name]
[Description]
**Technologies**: [Tech 1], [Tech 2]
**Link**: [URL]
```

### Validation Rules for Markdown
1. Must start with H1 heading (name)
2. Contact info must be on second line
3. Must have H2 sections for: Experience, Education, Skills
4. Work experience uses H3 for each position
5. Bullet points use `-` or `*` character
6. Dates in bold: `**MM/YYYY - MM/YYYY**`
7. No H4+ headings allowed
8. No images or embedded content
9. No tables (except for skills formatting)
10. Links must be valid and HTTPS

---

## Generated Document Models

### DocxDocument
**Purpose**: Represents generated DOCX output

```typescript
interface DocxDocument {
  content: Buffer;               // Binary DOCX content
  filename: string;              // Generated filename
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  size: number;                  // File size in bytes
  templateId: string;            // Source template
  generatedAt: Date;
  metadata: DocumentMetadata;
}
```

---

### PdfDocument
**Purpose**: Represents generated PDF output

```typescript
interface PdfDocument {
  content: Buffer;               // Binary PDF content
  filename: string;              // Generated filename
  mimeType: 'application/pdf';
  size: number;                  // File size in bytes
  templateId: string;            // Source template
  generatedAt: Date;
  metadata: DocumentMetadata;
}
```

---

### HtmlDocument
**Purpose**: Represents generated HTML output

```typescript
interface HtmlDocument {
  content: string;               // HTML string
  filename: string;              // Generated filename
  mimeType: 'text/html';
  size: number;                  // Content size in bytes
  templateId: string;            // Source template
  generatedAt: Date;
  metadata: DocumentMetadata;
}
```

---

### DocumentMetadata
**Purpose**: Common metadata for all document types

```typescript
interface DocumentMetadata {
  title: string;                 // Resume owner name
  author: string;                // Generated by system
  subject: string;               // "Professional Resume"
  keywords: string[];            // Key skills/technologies
  creator: string;               // "PassATS Resume Builder"
  producer: string;              // Tool version
  creationDate: Date;
}
```

---

## Relationships

### Entity Relationship Diagram

```
Resume 1:1 ContactInfo
Resume 1:N WorkExperience
Resume 1:N Education
Resume 1:N SkillCategory
Resume 1:N Certification (optional)
Resume 1:N Project (optional)
Resume 1:N Award (optional)

Resume N:1 Template (optional)
Resume 1:N ATSScore

Template 1:N SectionConfig

ATSScore 1:N ATSIssue
ATSScore 1:N Recommendation
ATSScore 1:1 ScoreBreakdown

Resume 1:3 GeneratedDocument (DOCX | PDF | HTML)
```

---

## Data Flow

### 1. Validation Flow
```
Markdown Input
  → Parse to Resume entity
  → Validate structure
  → Validate content
  → Return ValidationResult
```

### 2. Generation Flow
```
Resume entity
  → Select Template
  → Populate Template
  → Render Format (DOCX/PDF/HTML)
  → Return GeneratedDocument
```

### 3. Scoring Flow
```
Resume entity
  → Parse Structure
  → Run Scoring Modules
  → Aggregate Results
  → Return ATSScore
```

---

## Invariants

### Resume Invariants
1. A resume must always have at least one work experience entry
2. A resume must always have at least one education entry
3. A resume must always have contact information with email and phone
4. Experience and education must be in reverse chronological order
5. Total resume length must not exceed 50,000 characters

### Template Invariants
1. A template must support all required sections: contact, experience, education, skills
2. Template files must exist at specified paths
3. Templates must be ATS-compliant (validated before activation)
4. Template versions must follow semver

### ATSScore Invariants
1. Score must be between 0-100 inclusive
2. Breakdown scores must sum to total score
3. Rating must match score range:
   - 0-40 = poor
   - 41-70 = fair
   - 71-85 = good
   - 86-100 = excellent
4. Issues with severity=critical must have impact >= 10

---

## Error States

### Validation Errors
```typescript
type ValidationError =
  | 'MISSING_REQUIRED_SECTION'
  | 'INVALID_MARKDOWN_STRUCTURE'
  | 'INVALID_DATE_FORMAT'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_URL'
  | 'CONTENT_TOO_LONG'
  | 'EMPTY_SECTION'
  | 'INVALID_HEADING_HIERARCHY';
```

### Generation Errors
```typescript
type GenerationError =
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_LOAD_FAILED'
  | 'RENDERING_FAILED'
  | 'INVALID_FORMAT'
  | 'FILE_SIZE_EXCEEDED';
```

### Scoring Errors
```typescript
type ScoringError =
  | 'INVALID_RESUME_STRUCTURE'
  | 'SCORING_MODULE_FAILED'
  | 'INVALID_SCORE_RANGE';
```

---

**Status**: ✅ COMPLETE - Data model defined, ready for contract generation
