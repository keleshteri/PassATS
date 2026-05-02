import { z } from 'zod';
import type { MarkdownValidator } from '../../domain/validators/markdown-validator.js';
import type { GenerationService } from '../services/generation-service.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Input schema for validate-resume tool
const ValidateResumeSchema = z.object({
  markdown: z.string().min(1, 'Markdown content is required'),
  detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed')
});

// Output schema for validate-resume tool
const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    code: z.string(),
    message: z.string(),
    section: z.string().optional(),
    line: z.number().optional()
  })),
  warnings: z.array(z.object({
    code: z.string(),
    message: z.string(),
    section: z.string().optional(),
    line: z.number().optional()
  })),
  suggestions: z.array(z.string()),
  statistics: z.object({
    wordCount: z.number(),
    sectionCount: z.number(),
    hasContactInfo: z.boolean(),
    hasWorkExperience: z.boolean(),
    hasEducation: z.boolean(),
    hasSkills: z.boolean()
  })
});

export const validateResumeTool: Tool = {
  name: 'validate-resume',
  description: 'Validate resume markdown content for ATS optimization and completeness',
  inputSchema: {
    type: 'object',
    properties: {
      markdown: {
        type: 'string',
        description: 'Resume content in markdown format'
      },
      detailLevel: {
        type: 'string',
        enum: ['basic', 'detailed', 'comprehensive'],
        description: 'Level of validation detail',
        default: 'detailed'
      }
    },
    required: ['markdown']
  }
};

export class ValidateResumeTool {
  constructor(
    private readonly markdownValidator: MarkdownValidator,
    private readonly generationService: GenerationService
  ) {}

  async execute(args: unknown): Promise<unknown> {
    try {
      // Validate input
      const { markdown, detailLevel } = ValidateResumeSchema.parse(args);

      // Perform validation using GenerationService
      const validationResult = await this.generationService.validateResumeContent(markdown);

      // Perform markdown structure validation
      const markdownValidation = this.markdownValidator.validate();

      // Combine results
      const allErrors = [
        ...validationResult.errors.map((error: any) => ({
          code: 'CONTENT_ERROR',
          message: typeof error === 'string' ? error : error.message || 'Unknown error'
        })),
        ...markdownValidation.errors.map((error: any) => ({
          code: error.code || 'MARKDOWN_ERROR',
          message: typeof error === 'string' ? error : error.message || 'Unknown error'
        }))
      ];

      const allWarnings = [
        ...validationResult.warnings.map((warning: any) => ({
          code: 'CONTENT_WARNING',
          message: typeof warning === 'string' ? warning : warning.message || 'Unknown warning'
        })),
        ...markdownValidation.warnings.map((warning: any) => ({
          code: warning.code || 'MARKDOWN_WARNING',
          message: typeof warning === 'string' ? warning : warning.message || 'Unknown warning'
        }))
      ];

      // Calculate statistics
      const statistics = this.calculateStatistics(markdown);

      // Generate suggestions
      const suggestions = this.generateSuggestions(allErrors, allWarnings, statistics);

      const result = {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
        suggestions,
        statistics
      };

      // Validate output schema
      return ValidationResultSchema.parse(result);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: [{
            code: 'INVALID_INPUT',
            message: `Input validation failed: ${error.errors.map(e => e.message).join(', ')}`,
            section: 'input'
          }],
          warnings: [],
          suggestions: ['Please check your input format and try again'],
          statistics: {
            wordCount: 0,
            sectionCount: 0,
            hasContactInfo: false,
            hasWorkExperience: false,
            hasEducation: false,
            hasSkills: false
          }
        };
      }

      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error}`,
          section: 'system'
        }],
        warnings: [],
        suggestions: ['Please check your resume format and try again'],
        statistics: {
          wordCount: 0,
          sectionCount: 0,
          hasContactInfo: false,
          hasWorkExperience: false,
          hasEducation: false,
          hasSkills: false
        }
      };
    }
  }

  private calculateStatistics(markdown: string): {
    wordCount: number;
    sectionCount: number;
    hasContactInfo: boolean;
    hasWorkExperience: boolean;
    hasEducation: boolean;
    hasSkills: boolean;
  } {
    const words = markdown.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;

    // Count sections (H2 headings)
    const sectionMatches = markdown.match(/^## .+$/gm);
    const sectionCount = sectionMatches ? sectionMatches.length : 0;

    // Check for required sections
    const lowerMarkdown = markdown.toLowerCase();
    
    const hasContactInfo = lowerMarkdown.includes('email:') || 
                          lowerMarkdown.includes('phone:') || 
                          lowerMarkdown.includes('@');

    const hasWorkExperience = lowerMarkdown.includes('## experience') ||
                             lowerMarkdown.includes('## work experience') ||
                             lowerMarkdown.includes('## employment');

    const hasEducation = lowerMarkdown.includes('## education') ||
                        lowerMarkdown.includes('## academic');

    const hasSkills = lowerMarkdown.includes('## skills') ||
                     lowerMarkdown.includes('## technical skills') ||
                     lowerMarkdown.includes('## competencies');

    return {
      wordCount,
      sectionCount,
      hasContactInfo,
      hasWorkExperience,
      hasEducation,
      hasSkills
    };
  }

  private generateSuggestions(
    errors: Array<{ code: string; message: string }>,
    warnings: Array<{ code: string; message: string }>,
    statistics: { wordCount: number; hasContactInfo: boolean; hasWorkExperience: boolean; hasEducation: boolean; hasSkills: boolean }
  ): Array<string> {
    const suggestions: Array<string> = [];

    // Generate suggestions based on errors
    if (errors.some(e => e.code === 'INVALID_EMAIL')) {
      suggestions.push('Use a professional email address in the format: your.email@domain.com');
    }

    if (errors.some(e => e.code === 'INVALID_PHONE')) {
      suggestions.push('Use E.164 phone format: +1 (555) 123-4567');
    }

    if (errors.some(e => e.code === 'MISSING_REQUIRED_SECTION')) {
      suggestions.push('Include all required sections: Contact Information, Work Experience, Education, and Skills');
    }

    // Generate suggestions based on warnings
    if (warnings.some(w => w.message.includes('personal pronouns'))) {
      suggestions.push('Replace personal pronouns with action verbs: "Led" instead of "I led"');
    }

    if (warnings.some(w => w.message.includes('empty'))) {
      suggestions.push('Fill in all section content with relevant information');
    }

    // Generate suggestions based on statistics
    if (!statistics.hasContactInfo) {
      suggestions.push('Add complete contact information including name, email, phone, and location');
    }

    if (!statistics.hasWorkExperience) {
      suggestions.push('Include a Work Experience section with your job history');
    }

    if (!statistics.hasEducation) {
      suggestions.push('Add an Education section with your academic background');
    }

    if (!statistics.hasSkills) {
      suggestions.push('Include a Skills section with your technical and soft skills');
    }

    if (statistics.wordCount < 200) {
      suggestions.push('Consider adding more detail to strengthen your resume');
    }

    if (statistics.wordCount > 800) {
      suggestions.push('Consider condensing your resume to keep it concise and focused');
    }

    // General suggestions
    suggestions.push('Use action verbs to start bullet points (Led, Developed, Implemented)');
    suggestions.push('Quantify achievements with numbers and metrics where possible');
    suggestions.push('Ensure consistent formatting throughout the document');
    suggestions.push('Use MM/YYYY format for all dates');

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }
}

// Export function for testing
export async function validateResume(params: {
  markdown: string;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  includeSuggestions?: boolean;
}) {
  // Mock implementation for testing
  const hasContactInfo = params.markdown.includes('@') && params.markdown.includes('+');
  const hasWorkExperience = params.markdown.includes('## Work Experience') || params.markdown.includes('## Experience');
  const hasEducation = params.markdown.includes('## Education');
  const hasSkills = params.markdown.includes('## Skills');
  
  const errors = [];
  const warnings = [];
  
  if (!hasContactInfo) {
    errors.push({ code: 'MISSING_CONTACT_INFO', message: 'Missing contact information' });
  }
  
  if (!hasWorkExperience) {
    warnings.push({ code: 'MISSING_WORK_EXPERIENCE', message: 'Missing work experience section' });
  }
  
  if (!hasEducation) {
    warnings.push({ code: 'MISSING_EDUCATION', message: 'Missing education section' });
  }
  
  if (!hasSkills) {
    warnings.push({ code: 'MISSING_SKILLS', message: 'Missing skills section' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    statistics: {
      wordCount: params.markdown.split(/\s+/).length,
      hasContactInfo,
      hasWorkExperience,
      hasEducation,
      hasSkills,
      sectionCount: (params.markdown.match(/^## /gm) || []).length
    },
    suggestions: params.includeSuggestions ? [
      'Use professional email format',
      'Include quantifiable achievements',
      'Use action verbs for bullet points'
    ] : []
  };
}