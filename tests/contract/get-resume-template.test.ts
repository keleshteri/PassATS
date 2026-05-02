import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getResumeTemplate } from '../../build/application/tools/get-resume-template.js';

describe('get-resume-template MCP Tool Contract Tests', () => {
  describe('Default markdown format', () => {
    it('should return markdown template by default', async () => {
      const result = await getResumeTemplate({});

      assert(result.template !== undefined);
      assert(result.template.includes('# [Full Name]'));
      assert.strictEqual(result.version, '1.0.0');
      assert(result.sections !== undefined);
      expect(Array.isArray(result.sections)).toBe(true);
      assert(result.rules !== undefined);
      expect(Array.isArray(result.rules)).toBe(true);
    });

    it('should return complete markdown template with all required sections', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      assert(result.template.includes('# [Full Name]'));
      assert(result.template.includes('**Email**: [email]'));
      assert(result.template.includes('**Phone**: [+1234567890]'));
      assert(result.template.includes('## Professional Summary'));
      assert(result.template.includes('## Work Experience'));
      assert(result.template.includes('## Education'));
      assert(result.template.includes('## Skills'));
      assert(result.template.includes('## Certifications (Optional))');
      assert(result.template.includes('## Projects (Optional))');
    });

    it('should include proper markdown formatting examples', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      assert(result.template.includes('### [Job Title] at [Company Name]'));
      assert(result.template.includes('**[City, State]** | **[MM/YYYY] - [MM/YYYY or Present]**'));
      assert(result.template.includes('- [Achievement/responsibility starting with action verb]'));
      assert(result.template.includes('### [Degree] - [Major] - [Institution]'));
      assert(result.template.includes('**[Category 1]**: [Skill 1], [Skill 2], [Skill 3]'));
    });
  });

  describe('JSON format', () => {
    it('should return JSON template when format=json', async () => {
      const result = await getResumeTemplate({ format: 'json' });

      assert(result.template !== undefined);
      assert.strictEqual(result.version, '1.0.0');
      
      // Should be valid JSON
      expect(() => JSON.parse(result.template)).not.toThrow();
      
      const parsedTemplate = JSON.parse(result.template);
      expect(parsedTemplate).toHaveProperty('name');
      expect(parsedTemplate).toHaveProperty('contact');
      expect(parsedTemplate).toHaveProperty('experience');
      expect(parsedTemplate).toHaveProperty('education');
      expect(parsedTemplate).toHaveProperty('skills');
    });

    it('should return valid JSON structure with all required fields', async () => {
      const result = await getResumeTemplate({ format: 'json' });
      const parsedTemplate = JSON.parse(result.template);

      assert.strictEqual(parsedTemplate.name, '[Full Name]');
      expect(parsedTemplate.contact).toHaveProperty('email');
      expect(parsedTemplate.contact).toHaveProperty('phone');
      expect(parsedTemplate.contact).toHaveProperty('location');
      expect(parsedTemplate.contact).toHaveProperty('linkedin');
      expect(parsedTemplate.contact).toHaveProperty('github');
      
      expect(Array.isArray(parsedTemplate.experience)).toBe(true);
      expect(Array.isArray(parsedTemplate.education)).toBe(true);
      expect(Array.isArray(parsedTemplate.skills)).toBe(true);
      
      // Check experience structure
      if (parsedTemplate.experience.length > 0) {
        const experience = parsedTemplate.experience[0];
        expect(experience).toHaveProperty('title');
        expect(experience).toHaveProperty('company');
        expect(experience).toHaveProperty('location');
        expect(experience).toHaveProperty('startDate');
        expect(experience).toHaveProperty('endDate');
        expect(experience).toHaveProperty('responsibilities');
      }
      
      // Check education structure
      if (parsedTemplate.education.length > 0) {
        const education = parsedTemplate.education[0];
        expect(education).toHaveProperty('degree');
        expect(education).toHaveProperty('institution');
        expect(education).toHaveProperty('location');
        expect(education).toHaveProperty('graduationDate');
        expect(education).toHaveProperty('gpa');
      }
      
      // Check skills structure
      if (parsedTemplate.skills.length > 0) {
        const skill = parsedTemplate.skills[0];
        expect(skill).toHaveProperty('category');
        expect(skill).toHaveProperty('skills');
      }
    });
  });

  describe('Sections metadata', () => {
    it('should include all required sections in metadata', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      const requiredSections = result.sections.filter((s: any) => s.required === true);
      const optionalSections = result.sections.filter((s: any) => s.required === false);

      assert(requiredSections.length >= 3);
      assert(optionalSections.length >= 1);

      // Check for required sections
      const sectionNames = result.sections.map((s: any) => s.name);
      assert(sectionNames.includes('Contact Information'));
      assert(sectionNames.includes('Work Experience'));
      assert(sectionNames.includes('Education'));
      assert(sectionNames.includes('Skills'));

      // Check for optional sections
      assert(sectionNames.includes('Professional Summary'));
      assert(sectionNames.includes('Certifications'));
      assert(sectionNames.includes('Projects'));
    });

    it('should provide detailed section descriptions', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      result.sections.forEach((section: any) => {
        assert(section.name !== undefined);
        assert(section.required !== undefined);
        assert.strictEqual(typeof section.required, 'boolean');
        assert(section.description !== undefined);
        assert(section.description.length > 10);
      });
    });

    it('should include examples for sections when available', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      const sectionsWithExamples = result.sections.filter((s: any) => s.example);
      assert(sectionsWithExamples.length > 0);

      sectionsWithExamples.forEach((section: any) => {
        assert(section.example !== undefined);
        assert(section.example.length > 5);
      });
    });
  });

  describe('Formatting rules', () => {
    it('should include comprehensive formatting rules', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      assert(result.rules.length >= 10);
      
      const ruleTexts = result.rules.join(' ');
      
      // Check for key formatting rules
      assert(ruleTexts.includes('H1 heading'));
      assert(ruleTexts.includes('Contact info'));
      assert(ruleTexts.includes('H2'));
      assert(ruleTexts.includes('H3'));
      assert(ruleTexts.includes('E.164'));
      assert(ruleTexts.includes('personal pronouns'));
      assert(ruleTexts.includes('50,000 characters'));
      assert(ruleTexts.includes('reverse chronological'));
    });

    it('should provide clear and actionable formatting rules', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      result.rules.forEach((rule: string) => {
        assert(rule !== undefined);
        assert(rule.length > 10);
        assert(rule.length < 200); // Not too verbose
      });
    });

    it('should include rules for all major formatting aspects', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      const ruleTexts = result.rules.join(' ').toLowerCase();
      
      // Structure rules
      assert(ruleTexts.includes('heading'));
      assert(ruleTexts.includes('section'));
      
      // Contact rules
      assert(ruleTexts.includes('email'));
      assert(ruleTexts.includes('phone'));
      assert(ruleTexts.includes('url'));
      
      // Content rules
      assert(ruleTexts.includes('pronoun'));
      assert(ruleTexts.includes('chronological'));
      assert(ruleTexts.includes('character'));
      
      // Format rules
      assert(ruleTexts.includes('bold'));
      assert(ruleTexts.includes('bullet'));
    });
  });

  describe('Version and metadata', () => {
    it('should return valid semantic version', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      assert(result.version !== undefined);
      expect(result.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
    });

    it('should be consistent across different format requests', async () => {
      const markdownResult = await getResumeTemplate({ format: 'markdown' });
      const jsonResult = await getResumeTemplate({ format: 'json' });

      assert.strictEqual(markdownResult.version, jsonResult.version);
      expect(markdownResult.sections).toEqual(jsonResult.sections);
      expect(markdownResult.rules).toEqual(jsonResult.rules);
    });
  });

  describe('Template completeness', () => {
    it('should provide complete template with all placeholders', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      // Check for key placeholders
      assert(result.template.includes('[Full Name]'));
      assert(result.template.includes('[email]'));
      assert(result.template.includes('[+1234567890]'));
      assert(result.template.includes('[City, State]'));
      assert(result.template.includes('[Job Title]'));
      assert(result.template.includes('[Company Name]'));
      assert(result.template.includes('[MM/YYYY]'));
      assert(result.template.includes('[Degree]'));
      assert(result.template.includes('[Institution]'));
      assert(result.template.includes('[Category 1]'));
      assert(result.template.includes('[Skill 1]'));
    });

    it('should include proper markdown syntax throughout', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      // Check markdown syntax
      assert(result.template.includes('**')); // Bold formatting
      assert(result.template.includes('###')); // H3 headings
      assert(result.template.includes('##')); // H2 headings
      assert(result.template.includes('#')); // H1 heading
      assert(result.template.includes('- ')); // Bullet points
    });

    it('should provide realistic examples and guidance', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      // Check for helpful examples
      assert(result.template.includes('action verb'));
      assert(result.template.includes('quantifiable result'));
      assert(result.template.includes('technology or skill'));
      assert(result.template.includes('professional background'));
    });
  });

  describe('Error handling', () => {
    it('should handle invalid format gracefully', async () => {
      // This test assumes the tool will default to markdown for invalid formats
      const result = await getResumeTemplate({ format: 'invalid' as any });

      assert(result.template !== undefined);
      assert(result.version !== undefined);
      assert(result.sections !== undefined);
      assert(result.rules !== undefined);
    });

    it('should return consistent structure regardless of format', async () => {
      const markdownResult = await getResumeTemplate({ format: 'markdown' });
      const jsonResult = await getResumeTemplate({ format: 'json' });

      // Both should have the same metadata structure
      assert.strictEqual(markdownResult.version, jsonResult.version);
      expect(markdownResult.sections).toEqual(jsonResult.sections);
      expect(markdownResult.rules).toEqual(jsonResult.rules);
      
      // Only the template content should differ
      expect(markdownResult.template).not.toBe(jsonResult.template);
    });
  });

  describe('Template validation', () => {
    it('should provide template that can be used as a starting point', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      // Template should be substantial enough to be useful
      assert(result.template.length > 500);
      assert(result.template.length < 5000); // Not too verbose
    });

    it('should include all necessary sections for a complete resume', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      const template = result.template;
      
      // Should have all major sections
      assert(template.includes('## Professional Summary'));
      assert(template.includes('## Work Experience'));
      assert(template.includes('## Education'));
      assert(template.includes('## Skills'));
      assert(template.includes('## Certifications'));
      assert(template.includes('## Projects'));
    });

    it('should provide clear instructions for each section', async () => {
      const result = await getResumeTemplate({ format: 'markdown' });

      const template = result.template;
      
      // Should include helpful instructions
      assert(template.includes('2-3 sentence summary'));
      assert(template.includes('starting with action verb'));
      assert(template.includes('quantifiable result'));
      assert(template.includes('if 3.5+'));
      assert(template.includes('Brief description'));
    });
  });
});
