import type { Resume } from '../../domain/models/resume.js';
import type { DocxGenerator } from '../../infrastructure/generators/docx-generator.js';
import type { HtmlGenerator } from '../../infrastructure/generators/html-generator.js';
import type { PdfGenerator } from '../../infrastructure/generators/pdf-generator.js';
import type { MarkdownParser } from '../../infrastructure/parsers/markdown-parser.js';
import type { TemplateLoader } from '../../infrastructure/templates/template-loader.js';

export type GenerationOptions = {
  templateId?: string;
  filename?: string;
  includeMetadata?: boolean;
}

export type GenerationResult = {
  content: string; // Base64 encoded
  filename: string;
  mimeType: string;
  size: number;
  metadata?: {
    template: string;
    generatedAt: string;
    format: string;
    pageCount?: number;
  };
}

export type ResumeGenerationData = {
  resume?: Resume;
  markdown: string;
}

export class GenerationService {
  constructor(
    private readonly docxGenerator: DocxGenerator,
    private readonly pdfGenerator: PdfGenerator,
    private readonly htmlGenerator: HtmlGenerator,
    private readonly markdownParser: MarkdownParser,
    private readonly templateLoader: TemplateLoader
  ) {}

  /**
   * Generate DOCX document from resume data
   */
  async generateDocx(
    resumeData: ResumeGenerationData,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const templateId = options.templateId || 'professional-classic';
    
    // Validate template exists
    await this.validateTemplate(templateId);

    // Parse markdown to resume object if needed
    const resume = resumeData.resume || await this.markdownParser.parseToResume(resumeData.markdown);

    // Generate filename
    const filename = this.generateFilename(resume.contact.fullName, 'docx', options.filename);

    // Generate DOCX content
    const docxContent = await this.docxGenerator.generate(resume, templateId);

    // Decode and get file size
    const buffer = Buffer.from(docxContent, 'base64');
    const size = buffer.length;

    const result: GenerationResult = {
      content: docxContent,
      filename,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size,
      metadata: options.includeMetadata ? {
        template: templateId,
        generatedAt: new Date().toISOString(),
        format: 'docx',
        pageCount: await this.estimatePageCount(buffer.length)
      } : undefined
    };

    return result;
  }

  /**
   * Generate PDF document from resume data
   */
  async generatePdf(
    resumeData: ResumeGenerationData,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const templateId = options.templateId || 'professional-classic';
    
    // Validate template exists
    await this.validateTemplate(templateId);

    // Parse markdown to resume object if needed
    const resume = resumeData.resume || await this.markdownParser.parseToResume(resumeData.markdown);

    // Generate filename
    const filename = this.generateFilename(resume.contact.fullName, 'pdf', options.filename);

    // Generate PDF content
    const pdfContent = await this.pdfGenerator.generate(resume, templateId);

    // Decode and get file size
    const buffer = Buffer.from(pdfContent, 'base64');
    const size = buffer.length;

    const result: GenerationResult = {
      content: pdfContent,
      filename,
      mimeType: 'application/pdf',
      size,
      metadata: options.includeMetadata ? {
        template: templateId,
        generatedAt: new Date().toISOString(),
        format: 'pdf',
        pageCount: await this.estimatePdfPageCount(buffer.length)
      } : undefined
    };

    return result;
  }

  /**
   * Generate HTML document from resume data
   */
  async generateHtml(
    resumeData: ResumeGenerationData,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const templateId = options.templateId || 'professional-classic';
    
    // Validate template exists
    await this.validateTemplate(templateId);

    // Parse markdown to resume object if needed
    const resume = resumeData.resume || await this.markdownParser.parseToResume(resumeData.markdown);

    // Generate filename
    const filename = this.generateFilename(resume.contact.fullName, 'html', options.filename);

    // Generate HTML content
    const htmlContent = await this.htmlGenerator.generate(resume, templateId);

    // Get content size
    const size = Buffer.byteLength(htmlContent, 'utf8');

    const result: GenerationResult = {
      content: Buffer.from(htmlContent, 'utf8').toString('base64'),
      filename,
      mimeType: 'text/html',
      size,
      metadata: options.includeMetadata ? {
        template: templateId,
        generatedAt: new Date().toISOString(),
        format: 'html'
      } : undefined
    };

    return result;
  }

  /**
   * Generate all formats from resume data
   */
  async generateAll(
    resumeData: ResumeGenerationData,
    options: GenerationOptions = {}
  ): Promise<{
    docx: GenerationResult;
    pdf: GenerationResult;
    html: GenerationResult;
  }> {
    const [docx, pdf, html] = await Promise.all([
      this.generateDocx(resumeData, options),
      this.generatePdf(resumeData, options),
      this.generateHtml(resumeData, options)
    ]);

    return { docx, pdf, html };
  }

  /**
   * Validate resume content before generation
   */
  async validateResumeContent(markdown: string): Promise<{
    valid: boolean;
    errors: Array<string>;
    warnings: Array<string>;
  }> {
    const errors: Array<string> = [];
    const warnings: Array<string> = [];

    try {
      // Parse markdown to check for parsing errors
      const resume = await this.markdownParser.parseToResume(markdown);

      // Basic validation checks
      if (!resume.contact.fullName.trim()) {
        errors.push('Full name is required');
      }

      if (!resume.contact.email.trim()) {
        errors.push('Email address is required');
      }

      if (!resume.contact.phone.trim()) {
        errors.push('Phone number is required');
      }

      if (resume.experience.length === 0) {
        warnings.push('No work experience provided');
      }

      if (resume.education.length === 0) {
        warnings.push('No education provided');
      }

      if (resume.skills.length === 0) {
        warnings.push('No skills provided');
      }

      // Check for personal pronouns
      if (markdown.toLowerCase().includes(' i ') || 
          markdown.toLowerCase().includes(' me ') || 
          markdown.toLowerCase().includes(' my ')) {
        warnings.push('Resume contains personal pronouns - consider using action verbs instead');
      }

      // Check content length
      if (markdown.length > 50000) {
        warnings.push('Resume content exceeds recommended length (50,000 characters)');
      }

      // Check for empty sections
      const sectionRegex = /^## (.+)$/gm;
      let match;
      while ((match = sectionRegex.exec(markdown)) !== null) {
        const sectionName = match[1];
        const sectionStart = match.index + match[0].length;
        const nextMatch = sectionRegex.exec(markdown);
        const sectionEnd = nextMatch ? nextMatch.index : markdown.length;
        sectionRegex.lastIndex = sectionStart; // Reset for next iteration
        
        const sectionContent = markdown.substring(sectionStart, sectionEnd).trim();
        if (sectionContent.length < 10) {
          warnings.push(`Section "${sectionName}" appears to be empty or very short`);
        }
      }

    } catch (error) {
      errors.push(`Failed to parse resume content: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate filename from name and extension
   */
  private generateFilename(name: string, extension: string, customFilename?: string): string {
    if (customFilename) {
      // Ensure custom filename has correct extension
      const baseName = customFilename.replace(/\.[^/.]+$/, '');
      return `${baseName}.${extension}`;
    }

    // Generate filename from name
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${sanitizedName}-resume-${timestamp}.${extension}`;
  }

  /**
   * Validate template exists and is accessible
   */
  private async validateTemplate(templateId: string): Promise<void> {
    try {
      await this.templateLoader.getTemplate(templateId);
    } catch (error) {
      throw new Error(`Template '${templateId}' not found or not accessible: ${error}`);
    }
  }

  /**
   * Estimate page count for DOCX based on content size
   */
  private async estimatePageCount(sizeInBytes: number): Promise<number> {
    /*
     * Rough estimation: 1 page ≈ 2KB of content
     * This is a very rough estimate and may vary based on formatting
     */
    return Math.max(1, Math.ceil(sizeInBytes / 2048));
  }

  /**
   * Estimate page count for PDF based on content size
   */
  private async estimatePdfPageCount(sizeInBytes: number): Promise<number> {
    // Rough estimation: 1 page ≈ 3KB of PDF content
    return Math.max(1, Math.ceil(sizeInBytes / 3072));
  }

  /**
   * Get available templates for generation
   */
  async getAvailableTemplates(): Promise<Array<{ id: string; name: string; category: string }>> {
    const templates = await this.templateLoader.listTemplates();
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category
    }));
  }

  /**
   * Get generation statistics
   */
  async getGenerationStats(): Promise<{
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    lastGenerated?: string;
  }> {
    const templates = await this.templateLoader.listTemplates();
    
    const templatesByCategory: Record<string, number> = {};
    templates.forEach(template => {
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;
    });

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      lastGenerated: new Date().toISOString()
    };
  }
}
