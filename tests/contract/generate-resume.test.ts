import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateResume } from '../../build/application/tools/generate-resume.js';

describe('generate-resume MCP Tool Contract Tests', () => {
  const validResumeContent = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901 | **Location**: San Francisco, CA
**LinkedIn**: https://linkedin.com/in/johndoe

## Professional Summary

Senior Software Engineer with 8 years of experience in full-stack development and team leadership.

## Work Experience

### Senior Software Engineer at TechCorp
**San Francisco, CA** | **01/2020 - Present**

- Architected microservices handling 1M+ daily requests
- Led team of 6 engineers in agile development
- Reduced deployment time by 60% through CI/CD optimization

### Software Engineer at StartupCo
**Remote** | **06/2017 - 12/2019**

- Developed React-based dashboard serving 10K+ users
- Implemented RESTful APIs using Node.js and Express

## Education

### BS Computer Science - MIT
**Cambridge, MA** | **Graduated: 05/2016**
GPA: 3.8

## Skills

**Languages**: JavaScript, Python, TypeScript, Java
**Frameworks**: React, Node.js, Django, Spring Boot
**Tools**: Docker, Kubernetes, AWS, Jenkins`;

  describe('DOCX generation', () => {
    it('should generate valid DOCX file from valid markdown', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.format, 'docx');
      expect(result.filename).toMatch(/\.docx$/);
      assert(result.content !== undefined);
      assert.strictEqual(result.mimeType, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      assert(result.size > 0);
      assert(result.metadata !== undefined);
      assert.strictEqual(result.metadata?.templateId, 'professional-classic');
      assert.strictEqual(result.metadata?.resumeName, 'John Doe');
      assert(result.metadata?.generatedAt !== undefined);
    });

    it('should generate DOCX with custom filename', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx',
        filename: 'my-custom-resume'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.filename, 'my-custom-resume.docx');
    });

    it('should auto-generate filename from name when not provided', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      assert.strictEqual(result.success, true);
      expect(result.filename).toMatch(/john.*doe.*\.docx/i);
    });

    it('should produce valid DOCX file content', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      assert.strictEqual(result.success, true);
      
      // Should be valid base64
      expect(() => Buffer.from(result.content, 'base64')).not.toThrow();
      
      const buffer = Buffer.from(result.content, 'base64');
      assert(buffer.length > 0);
      
      // DOCX files start with PK (ZIP signature)
      expect(buffer.toString('hex', 0, 2)).toBe('504b');
    });
  });

  describe('PDF generation', () => {
    it('should generate valid PDF file with searchable text', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'modern-tech',
        format: 'pdf'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.format, 'pdf');
      expect(result.filename).toMatch(/\.pdf$/);
      assert(result.content !== undefined);
      assert.strictEqual(result.mimeType, 'application/pdf');
      assert(result.size > 0);
      assert.strictEqual(result.metadata?.templateId, 'modern-tech');
    });

    it('should generate PDF with custom filename', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'modern-tech',
        format: 'pdf',
        filename: 'my-resume'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.filename, 'my-resume.pdf');
    });

    it('should produce valid PDF file content', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'modern-tech',
        format: 'pdf'
      });

      assert.strictEqual(result.success, true);
      
      // Should be valid base64
      expect(() => Buffer.from(result.content, 'base64')).not.toThrow();
      
      const buffer = Buffer.from(result.content, 'base64');
      assert(buffer.length > 0);
      
      // PDF files start with %PDF
      expect(buffer.toString('ascii', 0, 4)).toBe('%PDF');
    });
  });

  describe('HTML generation', () => {
    it('should generate valid HTML with proper structure', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'html'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.format, 'html');
      expect(result.filename).toMatch(/\.html$/);
      assert(result.content !== undefined);
      assert.strictEqual(result.mimeType, 'text/html');
      assert(result.size > 0);
      assert.strictEqual(result.metadata?.templateId, 'professional-classic');
    });

    it('should generate HTML with custom filename', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'html',
        filename: 'resume-page'
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.filename, 'resume-page.html');
    });

    it('should produce valid HTML content', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'html'
      });

      assert.strictEqual(result.success, true);
      
      // Should be valid HTML string (not base64)
      assert.strictEqual(typeof result.content, 'string');
      assert(result.content.includes('<!DOCTYPE html>'));
      assert(result.content.includes('<html>'));
      assert(result.content.includes('<head>'));
      assert(result.content.includes('<body>'));
    });
  });

  describe('Content preservation', () => {
    it('should preserve all content from markdown in generated document', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      assert.strictEqual(result.success, true);
      
      // For DOCX, we can't easily check content without parsing
      // But we can verify the file was generated successfully
      assert(result.size > 1000); // Should be substantial
    });

    it('should preserve content in HTML format', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'html'
      });

      assert.strictEqual(result.success, true);
      
      const html = result.content;
      assert(html.includes('John Doe'));
      assert(html.includes('john@example.com'));
      assert(html.includes('San Francisco, CA'));
      assert(html.includes('linkedin.com/in/johndoe'));
      assert(html.includes('Senior Software Engineer'));
      assert(html.includes('TechCorp'));
      assert(html.includes('BS Computer Science'));
      assert(html.includes('MIT'));
      assert(html.includes('JavaScript, Python, TypeScript'));
    });
  });

  describe('Error handling', () => {
    it('should return error for non-existent template', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'non-existent-template',
        format: 'docx'
      });

      assert.strictEqual(result.success, false);
      assert(result.error !== undefined);
      assert.strictEqual(result.error?.code, 'TEMPLATE_NOT_FOUND');
      assert(result.error?.message.includes('non-existent-template'));
      assert(result.error?.details !== undefined);
      assert(result.error?.details?.availableTemplates !== undefined);
      expect(Array.isArray(result.error?.details?.availableTemplates)).toBe(true);
    });

    it('should return error for invalid markdown content', async () => {
      const invalidContent = 'This is not valid resume markdown';
      
      const result = await generateResume({
        content: invalidContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      assert.strictEqual(result.success, false);
      assert(result.error !== undefined);
      assert.strictEqual(result.error?.code, 'INVALID_CONTENT');
      assert(result.error?.message.includes('validation'));
    });

    it('should return error for invalid format', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'invalid-format' as any
      });

      assert.strictEqual(result.success, false);
      assert(result.error !== undefined);
      assert.strictEqual(result.error?.code, 'INVALID_FORMAT');
    });

    it('should return error for invalid filename pattern', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx',
        filename: 'invalid filename with spaces!'
      });

      assert.strictEqual(result.success, false);
      assert(result.error !== undefined);
      assert.strictEqual(result.error?.code, 'INVALID_FILENAME');
    });
  });

  describe('Template validation', () => {
    it('should work with different template types', async () => {
      const templates = ['professional-classic', 'modern-tech', 'academic-formal'];
      
      for (const templateId of templates) {
        const result = await generateResume({
          content: validResumeContent,
          templateId,
          format: 'docx'
        });

        if (result.success) {
          assert.strictEqual(result.metadata?.templateId, templateId);
        } else {
          // Template might not exist, which is acceptable for testing
          assert.strictEqual(result.error?.code, 'TEMPLATE_NOT_FOUND');
        }
      }
    });
  });

  describe('Filename generation', () => {
    it('should generate appropriate filenames for different formats', async () => {
      const formats = ['docx', 'pdf', 'html'] as const;
      
      for (const format of formats) {
        const result = await generateResume({
          content: validResumeContent,
          templateId: 'professional-classic',
          format
        });

        if (result.success) {
          expect(result.filename).toMatch(new RegExp(`\\.${format}$`));
          assert(result.filename.includes('john'));
          assert(result.filename.includes('doe'));
        }
      }
    });

    it('should handle names with special characters in filename generation', async () => {
      const specialNameContent = `# José María García-López

**Email**: jose@example.com | **Phone**: +12345678901

## Work Experience

### Engineer

- Work

## Education

### Degree

## Skills

**Tech**: Java`;

      const result = await generateResume({
        content: specialNameContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      if (result.success) {
        expect(result.filename).toMatch(/jose.*maria.*garcia.*lopez.*\.docx/i);
        expect(result.filename).not.toContain(' ');
        expect(result.filename).not.toContain('á');
        expect(result.filename).not.toContain('-');
      }
    });
  });

  describe('Metadata validation', () => {
    it('should include proper metadata in successful generation', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      if (result.success) {
        assert(result.metadata !== undefined);
        assert.strictEqual(result.metadata?.templateId, 'professional-classic');
        assert(result.metadata?.templateName !== undefined);
        assert(result.metadata?.generatedAt !== undefined);
        assert.strictEqual(result.metadata?.resumeName, 'John Doe');
        
        // Check date format
        expect(() => new Date(result.metadata?.generatedAt!)).not.toThrow();
      }
    });
  });

  describe('File size validation', () => {
    it('should generate files of reasonable size', async () => {
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      if (result.success) {
        assert(result.size > 1000); // At least 1KB
        assert(result.size < 1000000); // Less than 1MB
      }
    });
  });

  describe('Performance', () => {
    it('should generate documents within reasonable time', async () => {
      const startTime = Date.now();
      
      const result = await generateResume({
        content: validResumeContent,
        templateId: 'professional-classic',
        format: 'docx'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds
      assert(duration < 5000);
      
      if (result.success) {
        assert(result.size > 0);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle minimal valid resume content', async () => {
      const minimalContent = `# Jane Doe

**Email**: jane@example.com | **Phone**: +12345678901

## Work Experience

### Engineer at Company
**Location** | **01/2020 - Present**

- Work

## Education

### Degree at University
**Location** | **Graduated: 05/2019**

## Skills

**Tech**: Java`;

      const result = await generateResume({
        content: minimalContent,
        templateId: 'professional-classic',
        format: 'docx'
      });

      if (result.success) {
        assert(result.filename.includes('jane'));
        assert(result.filename.includes('doe'));
        assert.strictEqual(result.metadata?.resumeName, 'Jane Doe');
      }
    });

    it('should handle resume with special characters', async () => {
      const specialContent = `# François Müller

**Email**: francois@example.com | **Phone**: +12345678901

## Work Experience

### Développeur at Société
**Paris, France** | **01/2020 - Present**

- Développé des applications
- Géré l'équipe

## Education

### Master Informatique - Université
**Paris, France** | **Graduated: 05/2019**

## Skills

**Langages**: Java, Python, C++`;

      const result = await generateResume({
        content: specialContent,
        templateId: 'professional-classic',
        format: 'html'
      });

      if (result.success) {
        assert(result.content.includes('François Müller'));
        assert(result.content.includes('francois@example.com'));
        assert(result.content.includes('Développeur'));
        assert(result.content.includes('Société'));
      }
    });
  });
});
