/**
 * PDF Generator Service
 * 
 * Generates PDF documents from HTML using Puppeteer.
 * Handles HTML to PDF conversion with searchable text preservation and metadata embedding.
 */

import puppeteer from 'puppeteer';
import type { HtmlGenerator } from './html-generator.js';
import type { Resume } from '../../domain/models/resume.js';
import type { Template } from '../../domain/models/template.js';
import type { TemplateLoader } from '../templates/template-loader.js';
import type { Browser, Page } from 'puppeteer';

export type PdfGenerationOptions = {
  templateId: string;
  filename?: string;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  includeMetadata?: boolean;
  customVariables?: Record<string, any>;
  waitForNetworkIdle?: boolean;
  timeout?: number;
};

export type PdfGenerationResult = {
  success: boolean;
  data?: string; // Base64 encoded PDF
  filename: string;
  size: number;
  error?: string;
};

export type PdfMetadata = {
  title: string;
  author: string;
  subject: string;
  keywords: Array<string>;
  creator: string;
  producer: string;
  creationDate: Date;
  modificationDate: Date;
};

export class PdfGenerator {
  private readonly templateLoader: TemplateLoader;
  private readonly htmlGenerator: HtmlGenerator;
  private browser: Browser | null = null;
  private readonly defaultTimeout: number = 30000; // 30 seconds

  constructor(templateLoader: TemplateLoader, htmlGenerator: HtmlGenerator) {
    this.templateLoader = templateLoader;
    this.htmlGenerator = htmlGenerator;
  }

  /**
   * Generates PDF document from resume data (simplified interface)
   */
  async generate(resume: Resume, templateId: string): Promise<string> {
    const result = await this.generatePdf(resume, { templateId });
    if (!result.success || !result.data) {
      throw new Error(result.error || 'PDF generation failed');
    }
    return result.data;
  }

  /**
   * Generates PDF document from resume data
   */
  async generatePdf(
    resume: Resume, 
    options: PdfGenerationOptions
  ): Promise<PdfGenerationResult> {
    let page: Page | null = null;

    try {
      // Load template
      const template = await this.templateLoader.loadTemplate(options.templateId);
      if (!template) {
        return {
          success: false,
          filename: options.filename || 'resume.pdf',
          size: 0,
          error: `Template '${options.templateId}' not found`
        };
      }

      // Generate HTML first
      const htmlResult = await this.htmlGenerator.generateHtml(resume, {
        templateId: options.templateId,
        customVariables: options.customVariables
      });

      if (!htmlResult.success || !htmlResult.data) {
        return {
          success: false,
          filename: options.filename || 'resume.pdf',
          size: 0,
          error: `HTML generation failed: ${htmlResult.error}`
        };
      }

      // Generate filename
      const filename = this.generateFilename(resume, options.filename);

      // Initialize browser if needed
      if (!this.browser) {
        await this.initializeBrowser();
      }

      // Create new page
      page = await this.browser!.newPage();

      // Set page options
      await this.configurePage(page, options);

      // Set HTML content
      await page.setContent(htmlResult.data, {
        waitUntil: options.waitForNetworkIdle ? 'networkidle0' : 'domcontentloaded',
        timeout: options.timeout || this.defaultTimeout
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: options.pageSize || 'A4',
        landscape: options.orientation === 'landscape',
        margin: options.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: true,
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        tagged: true, // Enable accessibility tags
        outline: true, // Generate outline/bookmarks
        ...(options.includeMetadata !== false && {
          tagged: true,
          metadata: this.generatePdfMetadata(resume, options)
        })
      });

      // Encode to base64
      const base64Data = Buffer.from(pdfBuffer).toString('base64');

      return {
        success: true,
        data: base64Data,
        filename,
        size: pdfBuffer.length
      };

    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'resume.pdf',
        size: 0,
        error: `PDF generation failed: ${error}`
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Initializes Puppeteer browser
   */
  private async initializeBrowser(): Promise<void> {
    if (this.browser) return;

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }

  /**
   * Configures page settings for PDF generation
   */
  private async configurePage(page: Page, options: PdfGenerationOptions): Promise<void> {
    // Set viewport
    await page.setViewport({
      width: options.pageSize === 'Letter' ? 816 : 794, // A4 width in pixels
      height: options.pageSize === 'Letter' ? 1056 : 1123, // A4 height in pixels
      deviceScaleFactor: 1
    });

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Set timeout
    page.setDefaultTimeout(options.timeout || this.defaultTimeout);

    // Disable images if needed for faster generation
    if (options.waitForNetworkIdle) {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.resourceType() === 'image') {
          request.continue();
        } else {
          request.continue();
        }
      });
    }
  }

  /**
   * Generates PDF metadata
   */
  private generatePdfMetadata(resume: Resume, options: PdfGenerationOptions): PdfMetadata {
    const now = new Date();
    
    return {
      title: `${resume.contact.fullName} - Resume`,
      author: resume.contact.fullName,
      subject: 'Professional Resume',
      keywords: this.extractKeywords(resume),
      creator: 'PassATS Resume Builder',
      producer: 'PassATS PDF Generator',
      creationDate: now,
      modificationDate: now
    };
  }

  /**
   * Extracts keywords from resume for PDF metadata
   */
  private extractKeywords(resume: Resume): Array<string> {
    const keywords: Array<string> = [];

    // Add skills
    for (const skillCategory of resume.skills) {
      keywords.push(...skillCategory.skills);
    }

    // Add job titles
    for (const exp of resume.experience) {
      keywords.push(exp.title);
    }

    // Add technologies
    for (const exp of resume.experience) {
      if (exp.technologies) {
        keywords.push(...exp.technologies);
      }
    }

    // Add project technologies
    if (resume.projects) {
      for (const project of resume.projects) {
        keywords.push(...project.technologies);
      }
    }

    // Remove duplicates and limit
    return [...new Set(keywords)].slice(0, 20);
  }

  /**
   * Generates filename for the PDF
   */
  private generateFilename(resume: Resume, customFilename?: string): string {
    if (customFilename) {
      return customFilename.endsWith('.pdf') ? customFilename : `${customFilename}.pdf`;
    }

    // Generate filename from name
    const name = resume.contact.fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    return `${name}-resume.pdf`;
  }

  /**
   * Validates PDF generation options
   */
  validateOptions(options: PdfGenerationOptions): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    // Validate page size
    if (options.pageSize && !['A4', 'Letter'].includes(options.pageSize)) {
      errors.push('Page size must be A4 or Letter');
    }

    // Validate orientation
    if (options.orientation && !['portrait', 'landscape'].includes(options.orientation)) {
      errors.push('Orientation must be portrait or landscape');
    }

    // Validate margin format
    if (options.margin) {
      const marginKeys = ['top', 'right', 'bottom', 'left'];
      for (const key of marginKeys) {
        const value = options.margin[key as keyof typeof options.margin];
        if (value && !this.isValidMarginValue(value)) {
          errors.push(`Margin ${key} must be a valid CSS length value (e.g., '1cm', '20px')`);
        }
      }
    }

    // Validate timeout
    if (options.timeout && (options.timeout < 1000 || options.timeout > 120000)) {
      errors.push('Timeout must be between 1000ms and 120000ms');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates margin value format
   */
  private isValidMarginValue(value: string): boolean {
    // CSS length values: number + unit (px, cm, mm, in, pt, pc)
    const marginRegex = /^\d+(\.\d+)?(px|cm|mm|in|pt|pc)$/;
    return marginRegex.test(value);
  }

  /**
   * Estimates PDF size before generation
   */
  estimatePdfSize(resume: Resume, options: PdfGenerationOptions = { templateId: 'modern' }): number {
    let estimatedSize = 100000; // Base PDF size

    // Add size based on content
    estimatedSize += resume.contact.fullName.length * 10;
    estimatedSize += (resume.summary?.length || 0) * 5;
    
    // Experience
    for (const exp of resume.experience) {
      estimatedSize += exp.title.length * 10;
      estimatedSize += exp.company.length * 10;
      estimatedSize += exp.responsibilities.join(' ').length * 5;
    }

    // Education
    for (const edu of resume.education) {
      estimatedSize += edu.degree.length * 10;
      estimatedSize += edu.institution.length * 10;
    }

    // Skills
    for (const skill of resume.skills) {
      estimatedSize += skill.category.length * 10;
      estimatedSize += skill.skills.join(' ').length * 5;
    }

    // Add size for images and styling
    estimatedSize += 50000;

    return Math.min(estimatedSize, 5 * 1024 * 1024); // Cap at 5MB
  }

  /**
   * Gets supported PDF features
   */
  getSupportedFeatures(): Array<string> {
    return [
      'A4 and Letter page sizes',
      'Portrait and landscape orientations',
      'Custom margins',
      'Searchable text',
      'PDF metadata',
      'Accessibility tags',
      'Bookmarks/outline',
      'Background graphics',
      'Base64 encoding',
      'Size estimation'
    ];
  }

  /**
   * Gets default PDF options
   */
  getDefaultOptions(): Partial<PdfGenerationOptions> {
    return {
      pageSize: 'A4',
      orientation: 'portrait',
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      includeMetadata: true,
      waitForNetworkIdle: false,
      timeout: 30000
    };
  }

  /**
   * Closes browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Checks if browser is initialized
   */
  isBrowserInitialized(): boolean {
    return this.browser !== null;
  }

  /**
   * Gets browser version info
   */
  async getBrowserInfo(): Promise<{ version: string; userAgent: string } | null> {
    if (!this.browser) return null;

    try {
      const page = await this.browser.newPage();
      const version = await page.browser().version();
      const userAgent = await page.evaluate(() => navigator.userAgent);
      await page.close();
      
      return { version, userAgent };
    } catch {
      return null;
    }
  }

  /**
   * Performs health check on PDF generation
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser!.newPage();
      await page.setContent('<html><body><h1>Test</h1></body></html>');
      const pdf = await page.pdf({ format: 'A4' });
      await page.close();

      return { healthy: pdf.length > 0 };
    } catch (error) {
      return { healthy: false, error: String(error) };
    }
  }
}
