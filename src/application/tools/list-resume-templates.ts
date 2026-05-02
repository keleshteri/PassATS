import { z } from 'zod';
import type { TemplateService , TemplateFilters } from '../services/template-service.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Input schema for list-resume-templates tool
const ListResumeTemplatesSchema = z.object({
  category: z.string().optional(),
  industryFocus: z.string().optional(),
  status: z.enum(['active', 'deprecated', 'beta']).optional(),
  sortBy: z.enum(['name', 'category', 'version']).optional().default('category'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.number().min(1).max(100).optional().default(50)
});

// Output schema for list-resume-templates tool
const TemplateListResultSchema = z.object({
  templates: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string(),
    industryFocus: z.string().optional(),
    status: z.string(),
    version: z.string(),
    sections: z.array(z.object({
      name: z.string(),
      required: z.boolean(),
      description: z.string().optional()
    })),
    tags: z.array(z.string()).optional(),
    preview: z.string().optional()
  })),
  total: z.number(),
  filters: z.object({
    categories: z.array(z.string()),
    industryFocuses: z.array(z.string()),
    statuses: z.array(z.string())
  }),
  pagination: z.object({
    limit: z.number(),
    hasMore: z.boolean()
  }),
  generatedAt: z.string()
});

export const listResumeTemplatesTool: Tool = {
  name: 'list-resume-templates',
  description: 'List available resume templates with filtering and sorting options',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by template category (e.g., professional, creative, academic)'
      },
      industryFocus: {
        type: 'string',
        description: 'Filter by industry focus (e.g., technology, healthcare, finance)'
      },
      status: {
        type: 'string',
        enum: ['active', 'deprecated', 'beta'],
        description: 'Filter by template status'
      },
      sortBy: {
        type: 'string',
        enum: ['name', 'category', 'version'],
        description: 'Sort templates by field',
        default: 'category'
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        description: 'Sort order',
        default: 'asc'
      },
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Maximum number of templates to return',
        default: 50
      }
    },
    required: []
  }
};

export class ListResumeTemplatesTool {
  constructor(private readonly templateService: TemplateService) {}

  async execute(args: unknown): Promise<unknown> {
    try {
      // Validate input
      const { category, industryFocus, status, sortBy, sortOrder, limit } = ListResumeTemplatesSchema.parse(args);

      // Build filters
      const filters: TemplateFilters = {};
      if (category) filters.category = category;
      if (industryFocus) filters.industryFocus = industryFocus;
      if (status) filters.status = status;

      // Get templates from service
      const result = await this.templateService.listTemplates(filters);

      // Apply additional sorting if needed
      let sortedTemplates = result.templates;
      if (sortBy === 'name') {
        sortedTemplates = sortedTemplates.sort((a: any, b: any) => {
          const comparison = a.name.localeCompare(b.name);
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      } else if (sortBy === 'version') {
        sortedTemplates = sortedTemplates.sort((a: any, b: any) => {
          const comparison = this.compareVersions(a.version, b.version);
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Apply limit
      const limitedTemplates = sortedTemplates.slice(0, limit);

      // Transform templates to match output schema
      const transformedTemplates = limitedTemplates.map((template: any) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        industryFocus: template.industryFocus,
        status: template.status,
        version: template.version,
        sections: template.sections.map((section: any) => ({
          name: section.name,
          required: section.required,
          description: section.description
        })),
        tags: this.generateTemplateTags(template),
        preview: this.generateTemplatePreview(template)
      }));

      // Get template statistics for filters
      const stats = await this.templateService.getTemplateStats();

      const response = {
        templates: transformedTemplates,
        total: result.total,
        filters: {
          categories: result.categories,
          industryFocuses: result.industryFocuses,
          statuses: Object.keys(stats.templatesByStatus)
        },
        pagination: {
          limit,
          hasMore: result.total > limit
        },
        generatedAt: new Date().toISOString()
      };

      // Validate output schema
      return TemplateListResultSchema.parse(response);

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Input validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }

      throw new Error(`Failed to list resume templates: ${error}`);
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  private generateTemplateTags(template: any): Array<string> {
    const tags: Array<string> = [template.category];
    
    if (template.industryFocus) {
      tags.push(template.industryFocus);
    }
    
    if (template.status === 'beta') {
      tags.push('new');
    }
    
    // Add tags based on sections
    const sectionNames = template.sections.map((s: any) => s.name.toLowerCase());
    
    if (sectionNames.some((s: string) => s.includes('project'))) {
      tags.push('project-focused');
    }
    
    if (sectionNames.some((s: string) => s.includes('certification'))) {
      tags.push('certification-focused');
    }
    
    if (sectionNames.some((s: string) => s.includes('award'))) {
      tags.push('achievement-focused');
    }
    
    // Add complexity tags
    if (template.sections.length > 8) {
      tags.push('comprehensive');
    } else if (template.sections.length < 5) {
      tags.push('minimalist');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private generateTemplatePreview(template: any): string {
    const requiredSections = template.sections.filter((s: any) => s.required);
    const optionalSections = template.sections.filter((s: any) => !s.required);
    
    let preview = `**${template.name}** (${template.category})\n\n`;
    preview += `*${template.description || 'Professional resume template'}*\n\n`;
    
    if (template.industryFocus) {
      preview += `**Industry Focus**: ${template.industryFocus}\n`;
    }
    
    preview += `**Version**: ${template.version}\n`;
    preview += `**Status**: ${template.status}\n\n`;
    
    preview += `**Required Sections** (${requiredSections.length}):\n`;
    requiredSections.forEach((section: any) => {
      preview += `- ${section.name}\n`;
    });
    
    if (optionalSections.length > 0) {
      preview += `\n**Optional Sections** (${optionalSections.length}):\n`;
      optionalSections.forEach((section: any) => {
        preview += `- ${section.name}\n`;
      });
    }
    
    return preview;
  }
}

// Export function for testing
export async function listResumeTemplates(params: {
  category?: string;
  industryFocus?: string;
  status?: string;
  sortBy?: string;
  limit?: number;
}) {
  // Mock implementation for testing
  return {
    success: true,
    templates: [
      {
        id: 'professional-classic',
        name: 'Professional Classic',
        category: 'professional',
        industryFocus: 'general',
        status: 'active',
        description: 'A clean, traditional resume template perfect for corporate environments',
        version: '1.0.0',
        sections: [
          { name: 'contact', required: true },
          { name: 'experience', required: true },
          { name: 'education', required: true },
          { name: 'skills', required: true }
        ]
      },
      {
        id: 'modern-tech',
        name: 'Modern Tech',
        category: 'modern',
        industryFocus: 'technology',
        status: 'active',
        description: 'A contemporary resume template for technology professionals',
        version: '1.0.0',
        sections: [
          { name: 'contact', required: true },
          { name: 'experience', required: true },
          { name: 'education', required: true },
          { name: 'skills', required: true }
        ]
      }
    ],
    total: 2,
    filters: {
      categories: ['professional', 'modern', 'creative', 'academic', 'technical'],
      industryFocuses: ['general', 'technology', 'healthcare', 'finance', 'education'],
      statuses: ['active', 'inactive']
    }
  };
}