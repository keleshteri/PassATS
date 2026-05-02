import { describe, it } from 'node:test';
import assert from 'node:assert';
import { listResumeTemplates } from '../../build/application/tools/list-resume-templates.js';

describe('list-resume-templates MCP Tool Contract Tests', () => {
  describe('List all templates', () => {
    it('should return all templates when no filters applied', async () => {
      const result = await listResumeTemplates({});

      assert(result.templates !== undefined);
      expect(Array.isArray(result.templates)).toBe(true);
      assert.strictEqual(result.count, result.templates.length);
      assert(result.count >= 5);
    });

    it('should return templates with all required fields', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        assert(template.id !== undefined);
        assert(template.name !== undefined);
        assert(template.description !== undefined);
        assert(template.category !== undefined);
        assert(template.formalityLevel !== undefined);
        assert(template.features !== undefined);
        assert(template.version !== undefined);
        
        assert.strictEqual(typeof template.id, 'string');
        assert.strictEqual(typeof template.name, 'string');
        assert.strictEqual(typeof template.description, 'string');
        assert.strictEqual(typeof template.category, 'string');
        assert.strictEqual(typeof template.formalityLevel, 'string');
        expect(Array.isArray(template.features)).toBe(true);
        assert.strictEqual(typeof template.version, 'string');
      });
    });

    it('should have unique template IDs', async () => {
      const result = await listResumeTemplates({});

      const ids = result.templates.map(t => t.id);
      const uniqueIds = new Set(ids);
      assert.strictEqual(uniqueIds.size, ids.length);
    });

    it('should return templates sorted by category then name', async () => {
      const result = await listResumeTemplates({});

      const templates = result.templates;
      
      // Check sorting by category (alphabetically)
      for (let i = 1; i < templates.length; i++) {
        const prevCategory = templates[i - 1].category;
        const currentCategory = templates[i].category;
        
        if (prevCategory === currentCategory) {
          // Within same category, should be sorted by name
          expect(templates[i - 1].name.localeCompare(templates[i].name)).toBeLessThanOrEqual(0);
        } else {
          // Categories should be in alphabetical order
          expect(prevCategory.localeCompare(currentCategory)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('Filter by category', () => {
    it('should filter templates by category=professional', async () => {
      const result = await listResumeTemplates({ category: 'professional' });

      assert(result.templates.length >= 1);
      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert.strictEqual(template.category, 'professional');
      });
    });

    it('should filter templates by category=modern', async () => {
      const result = await listResumeTemplates({ category: 'modern' });

      assert(result.templates.length >= 1);
      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert.strictEqual(template.category, 'modern');
      });
    });

    it('should filter templates by category=creative', async () => {
      const result = await listResumeTemplates({ category: 'creative' });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert.strictEqual(template.category, 'creative');
      });
    });

    it('should filter templates by category=academic', async () => {
      const result = await listResumeTemplates({ category: 'academic' });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert.strictEqual(template.category, 'academic');
      });
    });

    it('should filter templates by category=technical', async () => {
      const result = await listResumeTemplates({ category: 'technical' });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert.strictEqual(template.category, 'technical');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const result = await listResumeTemplates({ category: 'non-existent' as any });

      expect(result.templates).toEqual([]);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('Filter by industry focus', () => {
    it('should filter templates by industryFocus=technology', async () => {
      const result = await listResumeTemplates({ industryFocus: 'technology' });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert(template.industryFocus.includes('technology'));
      });
    });

    it('should filter templates by industryFocus=finance', async () => {
      const result = await listResumeTemplates({ industryFocus: 'finance' });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert(template.industryFocus.includes('finance'));
      });
    });

    it('should filter templates by industryFocus=healthcare', async () => {
      const result = await listResumeTemplates({ industryFocus: 'healthcare' });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert(template.industryFocus.includes('healthcare'));
      });
    });

    it('should return empty array for non-existent industry focus', async () => {
      const result = await listResumeTemplates({ industryFocus: 'non-existent-industry' });

      expect(result.templates).toEqual([]);
      assert.strictEqual(result.count, 0);
    });
  });

  describe('Combined filters', () => {
    it('should filter by both category and industry focus', async () => {
      const result = await listResumeTemplates({ 
        category: 'professional', 
        industryFocus: 'technology' 
      });

      assert.strictEqual(result.count, result.templates.length);
      
      result.templates.forEach(template => {
        assert.strictEqual(template.category, 'professional');
        assert(template.industryFocus.includes('technology'));
      });
    });

    it('should return empty array when no templates match both filters', async () => {
      const result = await listResumeTemplates({ 
        category: 'creative', 
        industryFocus: 'finance' 
      });

      // This might return empty if no creative templates are suitable for finance
      assert.strictEqual(result.count, result.templates.length);
    });
  });

  describe('Template metadata validation', () => {
    it('should have valid template IDs in kebab-case format', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        expect(template.id).toMatch(/^[a-z0-9-]+$/); // kebab-case format
        expect(template.id).not.toContain('_');
        expect(template.id).not.toContain(' ');
      });
    });

    it('should have valid semantic versions', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        expect(template.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version format
      });
    });

    it('should have valid category values', async () => {
      const result = await listResumeTemplates({});

      const validCategories = ['professional', 'modern', 'creative', 'academic', 'technical'];
      
      result.templates.forEach(template => {
        assert(validCategories.includes(template.category));
      });
    });

    it('should have valid formality level values', async () => {
      const result = await listResumeTemplates({});

      const validFormalityLevels = ['formal', 'business', 'casual'];
      
      result.templates.forEach(template => {
        assert(validFormalityLevels.includes(template.formalityLevel));
      });
    });

    it('should have non-empty features arrays', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        assert(template.features.length > 0);
        template.features.forEach(feature => {
          assert.strictEqual(typeof feature, 'string');
          assert(feature.length > 0);
        });
      });
    });

    it('should have non-empty industry focus arrays', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        expect(Array.isArray(template.industryFocus)).toBe(true);
        assert(template.industryFocus.length > 0);
        template.industryFocus.forEach(industry => {
          assert.strictEqual(typeof industry, 'string');
          assert(industry.length > 0);
        });
      });
    });

    it('should have meaningful template names and descriptions', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        assert(template.name.length > 5);
        assert(template.name.length < 100);
        assert(template.description.length > 20);
        assert(template.description.length < 500);
      });
    });
  });

  describe('Template diversity', () => {
    it('should provide templates across different categories', async () => {
      const result = await listResumeTemplates({});

      const categories = new Set(result.templates.map(t => t.category));
      assert(categories.size >= 3); // At least 3 different categories
    });

    it('should provide templates with different formality levels', async () => {
      const result = await listResumeTemplates({});

      const formalityLevels = new Set(result.templates.map(t => t.formalityLevel));
      assert(formalityLevels.size >= 2); // At least 2 different formality levels
    });

    it('should provide templates for different industries', async () => {
      const result = await listResumeTemplates({});

      const allIndustries = new Set();
      result.templates.forEach(template => {
        template.industryFocus.forEach(industry => allIndustries.add(industry));
      });
      
      assert(allIndustries.size >= 5); // At least 5 different industries
    });

    it('should provide templates with different features', async () => {
      const result = await listResumeTemplates({});

      const allFeatures = new Set();
      result.templates.forEach(template => {
        template.features.forEach(feature => allFeatures.add(feature));
      });
      
      assert(allFeatures.size >= 5); // At least 5 different features
    });
  });

  describe('Preview images', () => {
    it('should include preview images for templates', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        if (template.preview) {
          assert.strictEqual(typeof template.preview, 'string');
          assert(template.preview.length > 0);
          
          // Should be either a data URL or a regular URL
          const isDataUrl = template.preview.startsWith('data:');
          const isUrl = template.preview.startsWith('http');
          assert.strictEqual(isDataUrl || isUrl, true);
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid category gracefully', async () => {
      const result = await listResumeTemplates({ category: 'invalid-category' as any });

      expect(result.templates).toEqual([]);
      assert.strictEqual(result.count, 0);
    });

    it('should handle empty filters', async () => {
      const result = await listResumeTemplates({ category: '', industryFocus: '' });

      // Should return all templates (empty strings should be treated as no filter)
      assert(result.templates.length > 0);
      assert.strictEqual(result.count, result.templates.length);
    });

    it('should handle case-insensitive industry focus', async () => {
      const result1 = await listResumeTemplates({ industryFocus: 'technology' });
      const result2 = await listResumeTemplates({ industryFocus: 'Technology' });
      const result3 = await listResumeTemplates({ industryFocus: 'TECHNOLOGY' });

      // All should return the same results (case-insensitive)
      assert.strictEqual(result1.count, result2.count);
      assert.strictEqual(result2.count, result3.count);
    });
  });

  describe('Performance and consistency', () => {
    it('should return consistent results across multiple calls', async () => {
      const result1 = await listResumeTemplates({});
      const result2 = await listResumeTemplates({});

      assert.strictEqual(result1.count, result2.count);
      assert.strictEqual(result1.templates.length, result2.templates.length);
      
      // Template IDs should be the same
      const ids1 = result1.templates.map(t => t.id).sort();
      const ids2 = result2.templates.map(t => t.id).sort();
      expect(ids1).toEqual(ids2);
    });

    it('should return results quickly', async () => {
      const startTime = Date.now();
      await listResumeTemplates({});
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      assert(duration < 1000); // Should complete within 1 second
    });
  });

  describe('Template completeness', () => {
    it('should provide comprehensive template information', async () => {
      const result = await listResumeTemplates({});

      result.templates.forEach(template => {
        // All required fields should be present and meaningful
        assert(template.id.length > 3);
        assert(template.name.length > 5);
        assert(template.description.length > 20);
        assert(template.features.length > 0);
        assert(template.industryFocus.length > 0);
        
        // Optional fields should be present if they exist
        if (template.preview) {
          assert(template.preview.length > 10);
        }
      });
    });

    it('should provide templates suitable for different use cases', async () => {
      const result = await listResumeTemplates({});

      // Should have at least one professional template
      const professionalTemplates = result.templates.filter(t => t.category === 'professional');
      assert(professionalTemplates.length >= 1);

      // Should have at least one modern template
      const modernTemplates = result.templates.filter(t => t.category === 'modern');
      assert(modernTemplates.length >= 1);

      // Should have templates suitable for technology industry
      const techTemplates = result.templates.filter(t => 
        t.industryFocus.includes('technology') || t.industryFocus.includes('tech')
      );
      assert(techTemplates.length >= 1);
    });
  });
});
