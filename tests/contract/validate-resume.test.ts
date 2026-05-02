import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateResume } from '../../build/application/tools/validate-resume.js';

describe('validate-resume MCP Tool Contract Tests', () => {
  describe('Valid resume scenarios', () => {
    it('should validate a complete, well-formed resume', async () => {
      const validResume = `# Jane Smith

**Email**: jane@example.com | **Phone**: +19876543210 | **Location**: San Francisco, CA

## Professional Summary

Experienced software engineer with 8 years of experience in full-stack development.

## Work Experience

### Senior Engineer at BigCo
**San Francisco, CA** | **06/2021 - Present**

- Lead development of microservices architecture
- Mentor junior developers
- Implement CI/CD pipelines

### Engineer at StartupCo
**Remote** | **01/2019 - 05/2021**

- Built React-based dashboard
- Developed REST APIs using Node.js

## Education

### MS Computer Science - Stanford
**Stanford, CA** | **Graduated: 06/2018**

## Skills

**Languages**: TypeScript, Python, JavaScript
**Frameworks**: React, Node.js, Django`;

      const result = await validateResume({ content: validResume });

      assert.strictEqual(result.valid, true);
      expect(result.errors).toEqual([]);
      assert(result.structure?.sections.includes('Work Experience'));
      assert(result.structure?.sections.includes('Education'));
      assert(result.structure?.sections.includes('Skills'));
      assert(result.structure?.experienceCount > 0);
      assert(result.structure?.educationCount > 0);
    });

    it('should validate resume with minimal required content', async () => {
      const minimalResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901

## Work Experience

### Software Engineer at TechCorp
**Remote** | **01/2020 - Present**

- Developed features
- Led team

## Education

### BS Computer Science - MIT
**Cambridge, MA** | **Graduated: 05/2019**

## Skills

**Languages**: Python, JavaScript`;

      const result = await validateResume({ content: minimalResume });

      assert.strictEqual(result.valid, true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Invalid resume scenarios', () => {
    it('should reject resume with missing required section (Education)', async () => {
      const invalidResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901

## Work Experience

### Engineer at Company
**Location** | **01/2020 - Present**

- Did work

## Skills

**Tech**: JavaScript`;

      const result = await validateResume({ content: invalidResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors).toHaveLength(1);
      assert.strictEqual(result.errors[0].code, 'MISSING_REQUIRED_SECTION');
      assert(result.errors[0].message.includes('Education'));
      assert(result.errors[0].suggestion !== undefined);
    });

    it('should reject resume with invalid email format', async () => {
      const invalidResume = `# John Doe

**Email**: not-an-email | **Phone**: +12345678901

## Work Experience

### Engineer

- Work

## Education

### BS CS - University

## Skills

**Tech**: Python`;

      const result = await validateResume({ content: invalidResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors).toHaveLength(1);
      assert.strictEqual(result.errors[0].code, 'INVALID_EMAIL');
      assert(result.errors[0].message.includes('not-an-email'));
      assert(result.errors[0].suggestion !== undefined);
    });

    it('should reject resume with invalid phone format', async () => {
      const invalidResume = `# John Doe

**Email**: john@example.com | **Phone**: 123-456-7890

## Work Experience

### Engineer

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const result = await validateResume({ content: invalidResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors).toHaveLength(1);
      assert.strictEqual(result.errors[0].code, 'INVALID_PHONE');
      assert(result.errors[0].message.includes('E.164 format'));
      assert(result.errors[0].suggestion !== undefined);
    });

    it('should provide helpful suggestions for incomplete sections', async () => {
      const incompleteResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901

## Work Experience

## Education

## Skills`;

      const result = await validateResume({ content: incompleteResume });

      assert.strictEqual(result.valid, false);
      assert(result.errors.length >= 3);
      
      const emptySectionErrors = result.errors.filter(e => e.code === 'EMPTY_SECTION');
      assert(emptySectionErrors.length >= 3);
      
      // Check that suggestions are provided
      emptySectionErrors.forEach(error => {
        assert(error.suggestion !== undefined);
        assert(error.suggestion.length > 0);
      });
    });

    it('should detect missing contact information', async () => {
      const noContactResume = `# John Doe

## Work Experience

### Engineer

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const result = await validateResume({ content: noContactResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors.some(e => e.code === 'INVALID_EMAIL')).toBe(true);
    });

    it('should detect invalid markdown structure', async () => {
      const badStructureResume = `John Doe

Email: john@example.com

Work Experience
Engineer at Company
- Work

Education
Degree

Skills
Java`;

      const result = await validateResume({ content: badStructureResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors.some(e => e.code === 'INVALID_MARKDOWN_STRUCTURE')).toBe(true);
    });

    it('should detect invalid heading hierarchy', async () => {
      const badHierarchyResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901

#### Work Experience

### Engineer

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const result = await validateResume({ content: badHierarchyResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors.some(e => e.code === 'INVALID_HEADING_HIERARCHY')).toBe(true);
    });

    it('should detect content that is too long', async () => {
      const longContent = '# John Doe\n\n**Email**: john@example.com | **Phone**: +12345678901\n\n' +
        '## Work Experience\n\n### Engineer\n\n- Work\n\n## Education\n\n### Degree\n\n## Skills\n\n**Tech**: Java\n\n' +
        'A'.repeat(50000); // Exceed 50,000 character limit

      const result = await validateResume({ content: longContent });

      assert.strictEqual(result.valid, false);
      expect(result.errors.some(e => e.code === 'CONTENT_TOO_LONG')).toBe(true);
    });

    it('should detect invalid URL formats', async () => {
      const invalidUrlResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901
**LinkedIn**: not-a-url | **GitHub**: http://github.com/user

## Work Experience

### Engineer

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const result = await validateResume({ content: invalidUrlResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors.some(e => e.code === 'INVALID_URL')).toBe(true);
    });

    it('should detect invalid date formats', async () => {
      const invalidDateResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901

## Work Experience

### Engineer at Company
**Location** | **2020 - now**

- Work

## Education

### Degree
**Graduated: sometime**

## Skills

**Tech**: Java`;

      const result = await validateResume({ content: invalidDateResume });

      assert.strictEqual(result.valid, false);
      expect(result.errors.some(e => e.code === 'INVALID_DATE_FORMAT')).toBe(true);
    });
  });

  describe('Strict validation mode', () => {
    it('should apply stricter validation rules when strict=true', async () => {
      const resumeWithWarnings = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901

## Work Experience

### Engineer at Company
**Location** | **01/2020 - Present**

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const normalResult = await validateResume({ content: resumeWithWarnings });
      const strictResult = await validateResume({ content: resumeWithWarnings, strict: true });

      // Strict mode should catch more issues
      assert(strictResult.errors.length >= normalResult.errors.length);
    });
  });

  describe('Structure analysis', () => {
    it('should provide accurate structure analysis', async () => {
      const resume = `# Test User

**Email**: test@example.com | **Phone**: +12345678901

## Work Experience

### Job 1 at Company A
**Location** | **01/2020 - Present**

- Task 1
- Task 2

### Job 2 at Company B
**Location** | **01/2018 - 12/2019**

- Task 3

## Education

### BS Computer Science - University A
**Location** | **Graduated: 05/2017**

### MS Computer Science - University B
**Location** | **Graduated: 05/2019**

## Skills

**Languages**: Java, Python
**Frameworks**: Spring, Django`;

      const result = await validateResume({ content: resume });

      assert(result.structure !== undefined);
      assert(result.structure?.sections.includes('Work Experience'));
      assert(result.structure?.sections.includes('Education'));
      assert(result.structure?.sections.includes('Skills'));
      assert.strictEqual(result.structure?.experienceCount, 2);
      assert.strictEqual(result.structure?.educationCount, 2);
      assert(result.structure?.wordCount > 0);
    });
  });

  describe('Error message quality', () => {
    it('should provide actionable error messages with suggestions', async () => {
      const invalidResume = `# John Doe

**Email**: invalid-email | **Phone**: 123-456-7890

## Work Experience

## Education

## Skills`;

      const result = await validateResume({ content: invalidResume });

      assert.strictEqual(result.valid, false);
      assert(result.errors.length > 0);

      result.errors.forEach(error => {
        assert(error.code !== undefined);
        assert(error.message !== undefined);
        assert(error.suggestion !== undefined);
        assert(error.message.length > 10);
        assert(error.suggestion.length > 10);
      });
    });

    it('should include line numbers and sections in error details when available', async () => {
      const resumeWithLineErrors = `# John Doe

**Email**: invalid-email | **Phone**: +12345678901

## Work Experience

### Engineer

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const result = await validateResume({ content: resumeWithLineErrors });

      assert.strictEqual(result.valid, false);
      
      // Some errors should have line or section information
      const errorsWithLocation = result.errors.filter(e => e.line !== undefined || e.section !== undefined);
      assert(errorsWithLocation.length > 0);
    });
  });
});
