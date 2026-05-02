import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const listResumeTemplatesModule: RegisterableModule = {
  type: "tool",
  name: "list-resume-templates",
  description: "List available resume templates with filtering and sorting options",
  register(server: McpServer) {
    server.tool(
      "list-resume-templates",
      "List available resume templates with filtering and sorting options",
      {
        category: z.string().optional().describe("Filter by template category (e.g., professional, creative, academic)"),
        industryFocus: z.string().optional().describe("Filter by industry focus (e.g., technology, healthcare, finance)"),
        status: z.enum(['active', 'deprecated', 'beta']).optional().describe("Filter by template status"),
        sortBy: z.enum(['name', 'category', 'version']).optional().default('category').describe("Sort templates by field"),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc').describe("Sort order"),
        limit: z.number().min(1).max(100).optional().default(50).describe("Maximum number of templates to return")
      },
      async (args) => {
        try {
          const { category, industryFocus, status, sortBy, sortOrder, limit } = args;
          
          // Mock template data - in real implementation, this would come from template service
          const allTemplates = [
            {
              id: 'professional-classic',
              name: 'Professional Classic',
              description: 'A clean, traditional resume template perfect for corporate environments',
              category: 'professional',
              industryFocus: 'general',
              status: 'active',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true },
                { name: 'Professional Summary', required: true },
                { name: 'Work Experience', required: true },
                { name: 'Education', required: true },
                { name: 'Skills', required: true }
              ]
            },
            {
              id: 'modern-tech',
              name: 'Modern Tech',
              description: 'A contemporary resume template for technology professionals',
              category: 'modern',
              industryFocus: 'technology',
              status: 'active',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true },
                { name: 'Professional Summary', required: true },
                { name: 'Work Experience', required: true },
                { name: 'Education', required: true },
                { name: 'Skills', required: true },
                { name: 'Projects', required: false },
                { name: 'Certifications', required: false }
              ]
            },
            {
              id: 'creative-portfolio',
              name: 'Creative Portfolio',
              description: 'A visually appealing template for creative professionals',
              category: 'creative',
              industryFocus: 'design',
              status: 'active',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true },
                { name: 'Professional Summary', required: true },
                { name: 'Work Experience', required: true },
                { name: 'Education', required: true },
                { name: 'Skills', required: true },
                { name: 'Portfolio', required: false },
                { name: 'Awards', required: false }
              ]
            },
            {
              id: 'academic-scholar',
              name: 'Academic Scholar',
              description: 'A comprehensive template for academic and research positions',
              category: 'academic',
              industryFocus: 'education',
              status: 'active',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true },
                { name: 'Professional Summary', required: true },
                { name: 'Work Experience', required: true },
                { name: 'Education', required: true },
                { name: 'Skills', required: true },
                { name: 'Publications', required: false },
                { name: 'Research', required: false },
                { name: 'Teaching Experience', required: false }
              ]
            },
            {
              id: 'technical-specialist',
              name: 'Technical Specialist',
              description: 'A detailed template for technical and engineering roles',
              category: 'technical',
              industryFocus: 'engineering',
              status: 'active',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true },
                { name: 'Professional Summary', required: true },
                { name: 'Work Experience', required: true },
                { name: 'Education', required: true },
                { name: 'Skills', required: true },
                { name: 'Technical Projects', required: false },
                { name: 'Certifications', required: false },
                { name: 'Patents', required: false }
              ]
            }
          ];
          
          // Apply filters
          let filteredTemplates = allTemplates;
          
          if (category) {
            filteredTemplates = filteredTemplates.filter(t => t.category === category);
          }
          
          if (industryFocus) {
            filteredTemplates = filteredTemplates.filter(t => t.industryFocus === industryFocus);
          }
          
          if (status) {
            filteredTemplates = filteredTemplates.filter(t => t.status === status);
          }
          
          // Apply sorting
          let sortedTemplates = [...filteredTemplates];
          
          if (sortBy === 'name') {
            sortedTemplates.sort((a, b) => {
              const comparison = a.name.localeCompare(b.name);
              return sortOrder === 'desc' ? -comparison : comparison;
            });
          } else if (sortBy === 'version') {
            sortedTemplates.sort((a, b) => {
              const comparison = compareVersions(a.version, b.version);
              return sortOrder === 'desc' ? -comparison : comparison;
            });
          } else { // category (default)
            sortedTemplates.sort((a, b) => {
              const comparison = a.category.localeCompare(b.category);
              return sortOrder === 'desc' ? -comparison : comparison;
            });
          }
          
          // Apply limit
          const limitedTemplates = sortedTemplates.slice(0, limit);
          
          // Transform templates to match output schema
          const transformedTemplates = limitedTemplates.map(template => ({
            id: template.id,
            name: template.name,
            description: template.description,
            category: template.category,
            industryFocus: template.industryFocus,
            status: template.status,
            version: template.version,
            sections: template.sections.map(section => ({
              name: section.name,
              required: section.required,
              description: (section as any).description
            })),
            tags: generateTemplateTags(template),
            preview: generateTemplatePreview(template)
          }));
          
          // Get available filters
          const categories = [...new Set(allTemplates.map(t => t.category))];
          const industryFocuses = [...new Set(allTemplates.map(t => t.industryFocus))];
          const statuses = [...new Set(allTemplates.map(t => t.status))];
          
          const result = {
            templates: transformedTemplates,
            total: filteredTemplates.length,
            filters: {
              categories,
              industryFocuses,
              statuses
            },
            pagination: {
              limit,
              hasMore: filteredTemplates.length > limit
            },
            generatedAt: new Date().toISOString()
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error listing resume templates: ${error}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
};

function compareVersions(version1: string, version2: string): number {
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

function generateTemplateTags(template: any): Array<string> {
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

function generateTemplatePreview(template: any): string {
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

export default listResumeTemplatesModule;
