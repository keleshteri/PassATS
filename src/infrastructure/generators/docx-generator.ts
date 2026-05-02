/**
 * DOCX Generator Service
 * 
 * Generates DOCX documents from resume data using docxtemplater and pizzip.
 * Handles template variable substitution, loop constructs, and proper XML escaping.
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Template } from '../../domain/models/template.js';
import type { Resume } from '../../domain/models/resume.js';
import type { TemplateLoader } from '../templates/template-loader.js';

export type DocxGenerationOptions = {
  templateId: string;
  filename?: string;
  includeMetadata?: boolean;
  customVariables?: Record<string, any>;
}

export type DocxGenerationResult = {
  success: boolean;
  data?: string; // Base64 encoded DOCX
  filename: string;
  size: number;
  error?: string;
}

export type TemplateVariable = {
  name: string;
  value: any;
  type: 'string' | 'array' | 'object' | 'boolean' | 'number';
}

export class DocxGenerator {
  private readonly templateLoader: TemplateLoader;

  constructor(templateLoader: TemplateLoader) {
    this.templateLoader = templateLoader;
  }

  /**
   * Generates DOCX document from resume data (simplified interface)
   */
  async generate(resume: Resume, templateId: string): Promise<string> {
    const result = await this.generateDocx(resume, { templateId });
    if (!result.success || !result.data) {
      throw new Error(result.error || 'DOCX generation failed');
    }
    return result.data;
  }

  /**
   * Generates DOCX document from resume data
   */
  async generateDocx(
    resume: Resume, 
    options: DocxGenerationOptions
  ): Promise<DocxGenerationResult> {
    try {
      // Load template
      const template = await this.templateLoader.loadTemplate(options.templateId);
      if (!template) {
        return {
          success: false,
          filename: options.filename || 'resume.docx',
          size: 0,
          error: `Template '${options.templateId}' not found`
        };
      }

      // Load template file
      const templateBuffer = await this.templateLoader.readTemplateFile(options.templateId, 'docx');
      if (!templateBuffer) {
        return {
          success: false,
          filename: options.filename || 'resume.docx',
          size: 0,
          error: `Template file not found for '${options.templateId}'`
        };
      }

      // Generate filename
      const filename = this.generateFilename(resume, options.filename);

      // Prepare template variables
      const variables = this.prepareTemplateVariables(resume, options);

      // Generate DOCX
      const docxBuffer = await this.processTemplate(templateBuffer, variables);

      // Encode to base64
      const base64Data = docxBuffer.toString('base64');

      return {
        success: true,
        data: base64Data,
        filename,
        size: docxBuffer.length
      };

    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'resume.docx',
        size: 0,
        error: `DOCX generation failed: ${error}`
      };
    }
  }

  /**
   * Processes template with variables using docxtemplater
   */
  private async processTemplate(templateBuffer: Buffer, variables: Record<string, any>): Promise<Buffer> {
    try {
      // Load template with PizZip
      const zip = new PizZip(templateBuffer);
      
      // Create docxtemplater instance
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{{',
          end: '}}'
        }
      });

      // Set template variables
      doc.setData(variables);

      // Render document
      doc.render();

      // Generate output buffer
      const buffer = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6
        }
      });

      return buffer;

    } catch (error) {
      throw new Error(`Template processing failed: ${error}`);
    }
  }

  /**
   * Prepares template variables from resume data
   */
  private prepareTemplateVariables(resume: Resume, options: DocxGenerationOptions): Record<string, any> {
    const variables: Record<string, any> = {};

    // Basic contact information
    variables.name = resume.contact.fullName;
    variables.email = resume.contact.email;
    variables.phone = resume.contact.phone;
    variables.location = resume.contact.location || '';
    variables.linkedin = resume.contact.linkedin || '';
    variables.github = resume.contact.github || '';
    variables.portfolio = resume.contact.portfolio || '';
    variables.website = resume.contact.website || '';

    // Professional summary
    variables.summary = resume.summary || '';

    // Work experience
    variables.experience = resume.experience.map(exp => ({
      title: exp.title,
      company: exp.company,
      location: exp.location || '',
      startDate: exp.startDate.format(),
      endDate: exp.endDate ? exp.endDate.format() : 'Present',
      current: exp.current,
      duration: exp.getDurationInMonths(),
      durationText: this.formatDuration(exp.getDurationInMonths()),
      responsibilities: exp.responsibilities,
      achievements: exp.achievements || [],
      technologies: exp.technologies || []
    }));

    // Education
    variables.education = resume.education.map(edu => ({
      degree: edu.degree,
      institution: edu.institution,
      location: edu.location || '',
      graduationDate: edu.graduationDate.format(),
      gpa: edu.gpa ? edu.gpa.toString() : '',
      honors: edu.honors || [],
      relevantCourses: edu.relevantCourses || []
    }));

    // Skills
    variables.skills = resume.skills.map(skill => ({
      category: skill.category,
      skills: skill.skills
    }));

    // Certifications
    if (resume.certifications && resume.certifications.length > 0) {
      variables.certifications = resume.certifications.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        issueDate: cert.issueDate.format(),
        expiryDate: cert.expiryDate ? cert.expiryDate.format() : '',
        credentialId: cert.credentialId || '',
        credentialUrl: cert.url || ''
      }));
    }

    // Projects
    if (resume.projects && resume.projects.length > 0) {
      variables.projects = resume.projects.map(proj => ({
        name: proj.name,
        description: proj.description,
        role: proj.role || '',
        startDate: proj.startDate?.format() || '',
        endDate: proj.endDate ? proj.endDate.format() : 'Present',
        technologies: proj.technologies,
        highlights: proj.highlights,
        url: proj.url || ''
      }));
    }

    // Awards
    if (resume.awards && resume.awards.length > 0) {
      variables.awards = resume.awards.map(award => ({
        title: award.title,
        issuer: award.issuer,
        date: award.date.format(),
        description: award.description || ''
      }));
    }

    // Metadata
    if (options.includeMetadata !== false) {
      variables.metadata = {
        generatedAt: new Date().toISOString(),
        resumeId: resume.id,
        resumeVersion: resume.version,
        totalExperience: this.formatDuration(resume.getTotalExperienceInMonths()),
        wordCount: resume.getWordCount(),
        sections: {
          hasSummary: !!resume.summary,
          hasCertifications: !!(resume.certifications && resume.certifications.length > 0),
          hasProjects: !!(resume.projects && resume.projects.length > 0),
          hasAwards: !!(resume.awards && resume.awards.length > 0)
        }
      };
    }

    // Custom variables
    if (options.customVariables) {
      Object.assign(variables, options.customVariables);
    }

    // Helper functions for templates
    variables.helpers = {
      formatDate: (date: string) => this.formatDate(date),
      formatDuration: (months: number) => this.formatDuration(months),
      join: (array: Array<string>, separator = ', ') => array.join(separator),
      capitalize: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
      truncate: (text: string, length: number) => text.length > length ? text.substring(0, length) + '...' : text
    };

    return variables;
  }

  /**
   * Generates filename for the document
   */
  private generateFilename(resume: Resume, customFilename?: string): string {
    if (customFilename) {
      return customFilename.endsWith('.docx') ? customFilename : `${customFilename}.docx`;
    }

    // Generate filename from name
    const name = resume.contact.fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    return `${name}-resume.docx`;
  }

  /**
   * Formats duration in months to human-readable text
   */
  private formatDuration(months: number): string {
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }

    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  /**
   * Formats date string for display
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Validates template variables
   */
  validateTemplateVariables(variables: Record<string, any>): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    // Check required fields
    const requiredFields = ['name', 'email', 'phone', 'experience', 'education', 'skills'];
    for (const field of requiredFields) {
      if (!variables[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }

    // Validate experience array
    if (variables.experience && Array.isArray(variables.experience)) {
      variables.experience.forEach((exp: any, index: number) => {
        if (!exp.title || !exp.company) {
          errors.push(`Experience entry ${index + 1} is missing title or company`);
        }
      });
    }

    // Validate education array
    if (variables.education && Array.isArray(variables.education)) {
      variables.education.forEach((edu: any, index: number) => {
        if (!edu.degree || !edu.institution) {
          errors.push(`Education entry ${index + 1} is missing degree or institution`);
        }
      });
    }

    // Validate skills array
    if (variables.skills && Array.isArray(variables.skills)) {
      variables.skills.forEach((skill: any, index: number) => {
        if (!skill.category || !skill.skills || !Array.isArray(skill.skills)) {
          errors.push(`Skill category ${index + 1} is missing category or skills array`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets template variable schema
   */
  getTemplateVariableSchema(): Record<string, TemplateVariable> {
    return {
      name: { name: 'name', value: '', type: 'string' },
      email: { name: 'email', value: '', type: 'string' },
      phone: { name: 'phone', value: '', type: 'string' },
      location: { name: 'location', value: '', type: 'string' },
      linkedin: { name: 'linkedin', value: '', type: 'string' },
      github: { name: 'github', value: '', type: 'string' },
      portfolio: { name: 'portfolio', value: '', type: 'string' },
      website: { name: 'website', value: '', type: 'string' },
      summary: { name: 'summary', value: '', type: 'string' },
      experience: { name: 'experience', value: [], type: 'array' },
      education: { name: 'education', value: [], type: 'array' },
      skills: { name: 'skills', value: [], type: 'array' },
      certifications: { name: 'certifications', value: [], type: 'array' },
      projects: { name: 'projects', value: [], type: 'array' },
      awards: { name: 'awards', value: [], type: 'array' },
      metadata: { name: 'metadata', value: {}, type: 'object' }
    };
  }

  /**
   * Estimates document size before generation
   */
  estimateDocumentSize(resume: Resume): number {
    let estimatedSize = 50000; // Base template size

    // Add size based on content
    estimatedSize += resume.contact.fullName.length * 2;
    estimatedSize += (resume.summary?.length || 0) * 2;
    
    // Experience
    for (const exp of resume.experience) {
      estimatedSize += exp.title.length * 2;
      estimatedSize += exp.company.length * 2;
      estimatedSize += exp.responsibilities.join(' ').length * 2;
    }

    // Education
    for (const edu of resume.education) {
      estimatedSize += edu.degree.length * 2;
      estimatedSize += edu.institution.length * 2;
    }

    // Skills
    for (const skill of resume.skills) {
      estimatedSize += skill.category.length * 2;
      estimatedSize += skill.skills.join(' ').length * 2;
    }

    return Math.min(estimatedSize, 10 * 1024 * 1024); // Cap at 10MB
  }

  /**
   * Gets supported template features
   */
  getSupportedFeatures(): Array<string> {
    return [
      'Variable substitution',
      'Array loops',
      'Conditional sections',
      'Date formatting',
      'Duration formatting',
      'Text helpers',
      'Metadata injection',
      'Custom variables',
      'Base64 encoding',
      'File size estimation'
    ];
  }
}
