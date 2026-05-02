import type { Template } from '../../domain/models/template.js';
import type { TemplateLoader } from '../../infrastructure/templates/template-loader.js';

export type TemplateFilters = {
  category?: string;
  industryFocus?: string;
  status?: 'active' | 'deprecated' | 'beta';
}

export type TemplateListResult = {
  templates: Array<Template>;
  total: number;
  categories: Array<string>;
  industryFocuses: Array<string>;
}

export class TemplateService {
  constructor(private readonly templateLoader: TemplateLoader) {}

  /**
   * Get a template in the specified format
   */
  async getTemplate(format: 'markdown' | 'json' = 'markdown'): Promise<string> {
    const templates = await this.templateLoader.listTemplates();
    const defaultTemplate = templates.find(t => t.id === 'professional-classic') || templates[0];
    
    if (!defaultTemplate) {
      throw new Error('No templates available');
    }

    if (format === 'json') {
      return JSON.stringify(defaultTemplate, null, 2);
    }

    // Return markdown format with template structure and rules
    return this.generateMarkdownTemplate(defaultTemplate);
  }

  /**
   * List templates with optional filtering
   */
  async listTemplates(filters: TemplateFilters = {}): Promise<TemplateListResult> {
    const allTemplates = await this.templateLoader.listTemplates();
    
    // Apply filters
    const filteredTemplates = allTemplates.filter(template => {
      if (filters.category && template.category !== filters.category) {
        return false;
      }
      if (filters.industryFocus && !template.industryFocus.includes(filters.industryFocus)) {
        return false;
      }
      if (filters.status && template.isActive !== (filters.status === 'active')) {
        return false;
      }
      return true;
    });

    // Sort by category then name
    filteredTemplates.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    // Extract unique categories and industry focuses
    const categories = [...new Set(allTemplates.map(t => t.category))].sort();
    const industryFocuses = [...new Set(allTemplates.flatMap(t => t.industryFocus).filter(Boolean))].sort();

    return {
      templates: filteredTemplates,
      total: filteredTemplates.length,
      categories,
      industryFocuses
    };
  }

  /**
   * Validate a template by ID
   */
  async validateTemplate(id: string): Promise<{ valid: boolean; errors: Array<string> }> {
    try {
      const template = await this.templateLoader.getTemplate(id);
      const errors: Array<string> = [];

      if (!template) {
        errors.push('Template not found');
        return { valid: false, errors };
      }

      // Validate template structure
      if (!template.name || template.name.trim().length === 0) {
        errors.push('Template name is required');
      }

      if (!template.category || template.category.trim().length === 0) {
        errors.push('Template category is required');
      }

      if (!template.version || !this.isValidVersion(template.version)) {
        errors.push('Template version must be a valid semver');
      }

      if (!template.sections || template.sections.length === 0) {
        errors.push('Template must have at least one section');
      }

      // Validate sections
      template.sections.forEach((section, index) => {
        if (!section.name || section.name.trim().length === 0) {
          errors.push(`Section ${index + 1} name is required`);
        }
        if (!section.required && typeof section.required !== 'boolean') {
          errors.push(`Section ${index + 1} required field must be boolean`);
        }
      });

      // Validate template file exists and is readable
      try {
        await this.templateLoader.getTemplateContent(id);
      } catch (error) {
        errors.push(`Template file is not accessible: ${error}`);
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Template not found or invalid: ${error}`]
      };
    }
  }

  /**
   * Get template metadata by ID
   */
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      return await this.templateLoader.getTemplate(id);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    templatesByStatus: Record<string, number>;
    averageSections: number;
  }> {
    const templates = await this.templateLoader.listTemplates();
    
    const templatesByCategory: Record<string, number> = {};
    const templatesByStatus: Record<string, number> = {};
    let totalSections = 0;

    templates.forEach(template => {
      // Count by category
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
      
      // Count by status
      const status = template.isActive ? 'active' : 'inactive';
      templatesByStatus[status] = (templatesByStatus[status] || 0) + 1;
      
      // Sum sections
      totalSections += template.sections.length;
    });

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      templatesByStatus,
      averageSections: templates.length > 0 ? Math.round(totalSections / templates.length) : 0
    };
  }

  /**
   * Generate markdown template with structure and rules
   */
  private generateMarkdownTemplate(template: Template): string {
    const sections = template.sections
      .map(section => {
        const required = section.required ? ' (required)' : ' (optional)';
        return `## ${section.name}${required}\n\n${section.description || 'Add your content here...'}\n`;
      })
      .join('\n');

    return `# Your Name
Email: your.email@example.com
Phone: +1 (555) 123-4567
Location: City, State
LinkedIn: https://linkedin.com/in/yourprofile
GitHub: https://github.com/yourusername

${sections}

## Formatting Rules

1. **Name**: Use H1 heading (# Your Name)
2. **Sections**: Use H2 headings (## Section Name)
3. **Job Titles**: Use H3 headings (### Job Title)
4. **Dates**: Use MM/YYYY format (e.g., 01/2023)
5. **No Personal Pronouns**: Avoid "I", "me", "my" - use action verbs
6. **Bullet Points**: Use - for lists
7. **Consistent Formatting**: Maintain same date format throughout
8. **Professional Language**: Use strong action verbs
9. **Quantify Achievements**: Include numbers and metrics
10. **ATS-Friendly**: Avoid graphics, tables, or complex formatting

## Template Information

- **Template**: ${template.name}
- **Category**: ${template.category}
- **Industry Focus**: ${template.industryFocus || 'General'}
- **Version**: ${template.version}
- **Description**: ${template.description}

## Required Sections

${template.sections.filter(s => s.required).map(s => `- ${s.name}`).join('\n')}

## Optional Sections

${template.sections.filter(s => !s.required).map(s => `- ${s.name}`).join('\n')}`;
  }

  /**
   * Validate semver version string
   */
  private isValidVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }
}
