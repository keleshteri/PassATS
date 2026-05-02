import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { TemplateService } from '../../build/application/services/template-service.js';
import { TemplateLoader } from '../../build/infrastructure/templates/template-loader.js';

describe('Integration Test: Template Retrieval Workflow', () => {
  let templateService: TemplateService;
  let templateLoader: TemplateLoader;

  before(async () => {
    templateLoader = new TemplateLoader();
    templateService = new TemplateService(templateLoader);
  });

  it('should successfully get default template in markdown format', async () => {
    const result = await templateService.getTemplate('markdown');
    
    assert(typeof result === 'string', 'Template should be returned as string');
    assert(result.includes('# Your Name'), 'Template should contain name heading');
    assert(result.includes('## Contact Information'), 'Template should contain contact section');
    assert(result.includes('## Work Experience'), 'Template should contain work experience section');
    assert(result.includes('## Education'), 'Template should contain education section');
    assert(result.includes('## Skills'), 'Template should contain skills section');
    assert(result.includes('## Formatting Rules'), 'Template should contain formatting rules');
  });

  it('should successfully get template in JSON format', async () => {
    const result = await templateService.getTemplate('json');
    
    assert(typeof result === 'string', 'Template should be returned as string');
    
    const template = JSON.parse(result);
    assert(template.name, 'Template should have name property');
    assert(template.category, 'Template should have category property');
    assert(template.version, 'Template should have version property');
    assert(Array.isArray(template.sections), 'Template should have sections array');
    assert(template.sections.length > 0, 'Template should have at least one section');
  });

  it('should successfully list all templates', async () => {
    const result = await templateService.listTemplates();
    
    assert(Array.isArray(result.templates), 'Should return templates array');
    assert(result.total >= 5, 'Should have at least 5 templates');
    assert(result.templates.length > 0, 'Should return at least one template');
    
    // Check template structure
    const template = result.templates[0];
    assert(template.id, 'Template should have id');
    assert(template.name, 'Template should have name');
    assert(template.category, 'Template should have category');
    assert(template.status, 'Template should have status');
    assert(Array.isArray(template.sections), 'Template should have sections');
  });

  it('should filter templates by category', async () => {
    const result = await templateService.listTemplates({ category: 'professional' });
    
    assert(Array.isArray(result.templates), 'Should return templates array');
    assert(result.templates.length > 0, 'Should return at least one professional template');
    
    // All returned templates should be professional category
    result.templates.forEach(template => {
      assert.strictEqual(template.category, 'professional', 'All templates should be professional category');
    });
  });

  it('should filter templates by industry focus', async () => {
    const result = await templateService.listTemplates({ industryFocus: 'technology' });
    
    assert(Array.isArray(result.templates), 'Should return templates array');
    
    // All returned templates should have technology industry focus
    result.templates.forEach(template => {
      if (template.industryFocus) {
        assert.strictEqual(template.industryFocus, 'technology', 'All templates should have technology industry focus');
      }
    });
  });

  it('should filter templates by status', async () => {
    const result = await templateService.listTemplates({ status: 'active' });
    
    assert(Array.isArray(result.templates), 'Should return templates array');
    assert(result.templates.length > 0, 'Should return at least one active template');
    
    // All returned templates should be active status
    result.templates.forEach(template => {
      assert.strictEqual(template.status, 'active', 'All templates should be active status');
    });
  });

  it('should combine multiple filters', async () => {
    const result = await templateService.listTemplates({ 
      category: 'professional',
      status: 'active'
    });
    
    assert(Array.isArray(result.templates), 'Should return templates array');
    
    // All returned templates should match both filters
    result.templates.forEach(template => {
      assert.strictEqual(template.category, 'professional', 'All templates should be professional category');
      assert.strictEqual(template.status, 'active', 'All templates should be active status');
    });
  });

  it('should sort templates by category then name', async () => {
    const result = await templateService.listTemplates();
    
    assert(Array.isArray(result.templates), 'Should return templates array');
    assert(result.templates.length >= 2, 'Should have at least 2 templates for sorting test');
    
    // Check sorting order
    for (let i = 1; i < result.templates.length; i++) {
      const prev = result.templates[i - 1];
      const curr = result.templates[i];
      
      // Categories should be in alphabetical order, or if same category, names should be in alphabetical order
      if (prev.category === curr.category) {
        assert(curr.name >= prev.name, `Templates with same category should be sorted by name: ${prev.name} <= ${curr.name}`);
      } else {
        assert(curr.category >= prev.category, `Templates should be sorted by category: ${prev.category} <= ${curr.category}`);
      }
    }
  });

  it('should return available categories and industry focuses', async () => {
    const result = await templateService.listTemplates();
    
    assert(Array.isArray(result.categories), 'Should return categories array');
    assert(Array.isArray(result.industryFocuses), 'Should return industryFocuses array');
    assert(result.categories.length > 0, 'Should have at least one category');
    
    // Check that categories are unique and sorted
    const uniqueCategories = [...new Set(result.categories)];
    assert.strictEqual(result.categories.length, uniqueCategories.length, 'Categories should be unique');
    
    const sortedCategories = [...result.categories].sort();
    assert.deepStrictEqual(result.categories, sortedCategories, 'Categories should be sorted');
  });

  it('should validate template by ID', async () => {
    const templates = await templateService.listTemplates();
    const templateId = templates.templates[0].id;
    
    const validation = await templateService.validateTemplate(templateId);
    
    assert(typeof validation.valid === 'boolean', 'Validation should return boolean valid flag');
    assert(Array.isArray(validation.errors), 'Validation should return errors array');
    
    // For existing templates, validation should pass
    assert.strictEqual(validation.valid, true, 'Valid template should pass validation');
    assert.strictEqual(validation.errors.length, 0, 'Valid template should have no errors');
  });

  it('should return null for non-existent template ID', async () => {
    const template = await templateService.getTemplateById('non-existent-template');
    
    assert.strictEqual(template, null, 'Non-existent template should return null');
  });

  it('should get template statistics', async () => {
    const stats = await templateService.getTemplateStats();
    
    assert(typeof stats.totalTemplates === 'number', 'Should return total templates count');
    assert(stats.totalTemplates >= 5, 'Should have at least 5 templates');
    assert(typeof stats.templatesByCategory === 'object', 'Should return templates by category object');
    assert(typeof stats.templatesByStatus === 'object', 'Should return templates by status object');
    assert(typeof stats.averageSections === 'number', 'Should return average sections count');
    
    // Check that category counts sum to total
    const categorySum = Object.values(stats.templatesByCategory).reduce((sum, count) => sum + count, 0);
    assert.strictEqual(categorySum, stats.totalTemplates, 'Category counts should sum to total templates');
    
    // Check that status counts sum to total
    const statusSum = Object.values(stats.templatesByStatus).reduce((sum, count) => sum + count, 0);
    assert.strictEqual(statusSum, stats.totalTemplates, 'Status counts should sum to total templates');
  });

  it('should handle template retrieval workflow from quickstart', async () => {
    // This test simulates the workflow from quickstart.md
    
    // Step 1: List available templates
    const templates = await templateService.listTemplates({ category: 'professional' });
    assert(templates.templates.length > 0, 'Should find professional templates');
    
    // Step 2: Get specific template
    const templateId = templates.templates[0].id;
    const template = await templateService.getTemplateById(templateId);
    assert(template !== null, 'Should retrieve template by ID');
    
    // Step 3: Get template in markdown format
    const markdownTemplate = await templateService.getTemplate('markdown');
    assert(typeof markdownTemplate === 'string', 'Should get markdown template');
    assert(markdownTemplate.length > 100, 'Markdown template should have substantial content');
    
    // Step 4: Validate template
    const validation = await templateService.validateTemplate(templateId);
    assert(validation.valid, 'Template should be valid');
    
    console.log('✅ Template retrieval workflow completed successfully');
  });
});
