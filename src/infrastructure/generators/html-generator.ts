/**
 * HTML Generator Service
 * 
 * Generates HTML documents from resume data with CSS template application.
 * Provides semantic HTML structure, proper DOCTYPE, and meta tags.
 */

import MarkdownIt from 'markdown-it';
import type { Resume } from '../../domain/models/resume.js';
import type { Template } from '../../domain/models/template.js';
import type { TemplateLoader } from '../templates/template-loader.js';

export type HtmlGenerationOptions = {
  templateId: string;
  filename?: string;
  includeMetadata?: boolean;
  customVariables?: Record<string, any>;
  cssPath?: string;
  inlineStyles?: boolean;
  minify?: boolean;
}

export type HtmlGenerationResult = {
  success: boolean;
  data?: string; // HTML content
  filename: string;
  size: number;
  error?: string;
}

export type HtmlTemplate = {
  html: string;
  css: string;
  metadata: {
    title: string;
    description: string;
    author: string;
    keywords: Array<string>;
  };
}

export class HtmlGenerator {
  private readonly templateLoader: TemplateLoader;
  private readonly md: MarkdownIt;

  constructor(templateLoader: TemplateLoader) {
    this.templateLoader = templateLoader;
    
    // Initialize markdown-it
    this.md = new MarkdownIt({
      html: true, // Allow HTML tags
      linkify: true, // Convert URLs to links
      typographer: true, // Smart quotes and typography
      breaks: false // Don't convert line breaks to <br>
    });
  }

  /**
   * Generates HTML document from resume data (simplified interface)
   */
  async generate(resume: Resume, templateId: string): Promise<string> {
    const result = await this.generateHtml(resume, { templateId });
    if (!result.success || !result.data) {
      throw new Error(result.error || 'HTML generation failed');
    }
    return result.data;
  }

  /**
   * Generates HTML document from resume data
   */
  async generateHtml(
    resume: Resume, 
    options: HtmlGenerationOptions
  ): Promise<HtmlGenerationResult> {
    try {
      // Load template
      const template = await this.templateLoader.loadTemplate(options.templateId);
      if (!template) {
        return {
          success: false,
          filename: options.filename || 'resume.html',
          size: 0,
          error: `Template '${options.templateId}' not found`
        };
      }

      // Load HTML template
      const htmlTemplate = await this.loadHtmlTemplate(template, options, resume);

      // Generate filename
      const filename = this.generateFilename(resume, options.filename);

      // Prepare template variables
      const variables = this.prepareTemplateVariables(resume, options);

      // Generate HTML content
      const htmlContent = this.processTemplate(htmlTemplate, variables);

      // Apply CSS styling
      const styledHtml = await this.applyCssStyling(htmlContent, template, options);

      // Minify if requested
      const finalHtml = options.minify ? this.minifyHtml(styledHtml) : styledHtml;

      return {
        success: true,
        data: finalHtml,
        filename,
        size: Buffer.byteLength(finalHtml, 'utf8')
      };

    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'resume.html',
        size: 0,
        error: `HTML generation failed: ${error}`
      };
    }
  }

  /**
   * Loads HTML template from template directory
   */
  private async loadHtmlTemplate(template: Template, options: HtmlGenerationOptions, resume: Resume): Promise<HtmlTemplate> {
    let htmlContent = '';
    let cssContent = '';

    // Load HTML template
    if (template.htmlPath) {
      const htmlBuffer = await this.templateLoader.readTemplateFile(template.id, 'html');
      if (htmlBuffer) {
        htmlContent = htmlBuffer.toString('utf-8');
      }
    }

    // Load CSS template
    if (template.cssPath) {
      const cssBuffer = await this.templateLoader.readTemplateFile(template.id, 'css');
      if (cssBuffer) {
        cssContent = cssBuffer.toString('utf-8');
      }
    }

    // Use custom CSS path if provided
    if (options.cssPath) {
      try {
        const customCssBuffer = await this.templateLoader.readTemplateFile(template.id, 'css');
        if (customCssBuffer) {
          cssContent = customCssBuffer.toString('utf-8');
        }
      } catch {
        // Ignore custom CSS loading errors
      }
    }

    // Use default template if no HTML template found
    if (!htmlContent) {
      htmlContent = this.getDefaultHtmlTemplate();
    }

    // Use default CSS if no CSS template found
    if (!cssContent) {
      cssContent = this.getDefaultCssTemplate();
    }

    return {
      html: htmlContent,
      css: cssContent,
      metadata: {
        title: `${resume.contact.fullName} - Resume`,
        description: `Professional resume for ${resume.contact.fullName}`,
        author: resume.contact.fullName,
        keywords: this.extractKeywords(resume)
      }
    };
  }

  /**
   * Processes template with variables
   */
  private processTemplate(template: HtmlTemplate, variables: Record<string, any>): string {
    let html = template.html;

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(placeholder, this.escapeHtml(String(value)));
    }

    // Process loops for arrays
    html = this.processLoops(html, variables);

    // Process conditionals
    html = this.processConditionals(html, variables);

    // Add CSS
    if (template.css) {
      html = html.replace('{{CSS}}', template.css);
    }

    // Add metadata
    html = html.replace('{{TITLE}}', template.metadata.title);
    html = html.replace('{{DESCRIPTION}}', template.metadata.description);
    html = html.replace('{{AUTHOR}}', template.metadata.author);
    html = html.replace('{{KEYWORDS}}', template.metadata.keywords.join(', '));

    return html;
  }

  /**
   * Processes loop constructs in template
   */
  private processLoops(html: string, variables: Record<string, any>): string {
    // Process {{#each array}}...{{/each}} loops
    const loopRegex = /{{#each\s+(\w+)}}(.*?){{\/each}}/gs;
    
    return html.replace(loopRegex, (match, arrayName, loopContent) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) {
        return '';
      }

      return array.map(item => {
        let itemHtml = loopContent;
        
        // Replace item properties
        for (const [key, value] of Object.entries(item)) {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          itemHtml = itemHtml.replace(placeholder, this.escapeHtml(String(value)));
        }

        // Process nested loops
        itemHtml = this.processLoops(itemHtml, item);

        return itemHtml;
      }).join('');
    });
  }

  /**
   * Processes conditional constructs in template
   */
  private processConditionals(html: string, variables: Record<string, any>): string {
    // Process {{#if condition}}...{{/if}} conditionals
    const ifRegex = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs;
    
    return html.replace(ifRegex, (match, condition, content) => {
      const value = variables[condition];
      if (value && value !== '' && value !== false && value !== 0) {
        return content;
      }
      return '';
    });
  }

  /**
   * Applies CSS styling to HTML
   */
  private async applyCssStyling(
    html: string, 
    template: Template, 
    options: HtmlGenerationOptions
  ): Promise<string> {
    if (options.inlineStyles) {
      // Inline styles are already applied in the template
      return html;
    }

    // Add CSS link or style tag
    if (template.cssPath) {
      const cssLink = `<link rel="stylesheet" href="${template.cssPath}">`;
      html = html.replace('</head>', `  ${cssLink}\n</head>`);
    }

    return html;
  }

  /**
   * Prepares template variables from resume data
   */
  private prepareTemplateVariables(resume: Resume, options: HtmlGenerationOptions): Record<string, any> {
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
      truncate: (text: string, length: number) => text.length > length ? text.substring(0, length) + '...' : text,
      markdown: (text: string) => this.md.render(text)
    };

    return variables;
  }

  /**
   * Generates filename for the HTML document
   */
  private generateFilename(resume: Resume, customFilename?: string): string {
    if (customFilename) {
      return customFilename.endsWith('.html') ? customFilename : `${customFilename}.html`;
    }

    // Generate filename from name
    const name = resume.contact.fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    return `${name}-resume.html`;
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
   * Extracts keywords from resume for metadata
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
   * Escapes HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return text.replace(/[&<>"']/g, (m) => map[m] || m);
  }

  /**
   * Minifies HTML content
   */
  private minifyHtml(html: string): string {
    return html
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .replace(/\s+>/g, '>') // Remove spaces before closing tags
      .replace(/<\s+/g, '<') // Remove spaces after opening tags
      .trim();
  }

  /**
   * Gets default HTML template
   */
  private getDefaultHtmlTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <meta name="description" content="{{DESCRIPTION}}">
    <meta name="author" content="{{AUTHOR}}">
    <meta name="keywords" content="{{KEYWORDS}}">
    <style>{{CSS}}</style>
</head>
<body>
    <div class="resume">
        <header class="header">
            <h1 class="name">{{name}}</h1>
            <div class="contact">
                <span class="email">{{email}}</span>
                <span class="phone">{{phone}}</span>
                {{#if location}}<span class="location">{{location}}</span>{{/if}}
                {{#if linkedin}}<a href="{{linkedin}}" class="linkedin">LinkedIn</a>{{/if}}
                {{#if github}}<a href="{{github}}" class="github">GitHub</a>{{/if}}
                {{#if portfolio}}<a href="{{portfolio}}" class="portfolio">Portfolio</a>{{/if}}
                {{#if website}}<a href="{{website}}" class="website">Website</a>{{/if}}
            </div>
        </header>

        {{#if summary}}
        <section class="summary">
            <h2>Professional Summary</h2>
            <p>{{summary}}</p>
        </section>
        {{/if}}

        <section class="experience">
            <h2>Work Experience</h2>
            {{#each experience}}
            <div class="experience-item">
                <h3>{{title}} at {{company}}</h3>
                <div class="experience-meta">
                    <span class="dates">{{startDate}} - {{endDate}}</span>
                    {{#if location}}<span class="location">{{location}}</span>{{/if}}
                </div>
                <ul class="responsibilities">
                    {{#each responsibilities}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
                {{#if achievements}}
                <div class="achievements">
                    <h4>Key Achievements:</h4>
                    <ul>
                        {{#each achievements}}
                        <li>{{this}}</li>
                        {{/each}}
                    </ul>
                </div>
                {{/if}}
                {{#if technologies}}
                <div class="technologies">
                    <strong>Technologies:</strong> {{helpers.join technologies}}
                </div>
                {{/if}}
            </div>
            {{/each}}
        </section>

        <section class="education">
            <h2>Education</h2>
            {{#each education}}
            <div class="education-item">
                <h3>{{degree}}</h3>
                <div class="education-meta">
                    <span class="institution">{{institution}}</span>
                    <span class="graduation-date">{{graduationDate}}</span>
                    {{#if gpa}}<span class="gpa">GPA: {{gpa}}</span>{{/if}}
                </div>
                {{#if honors}}
                <div class="honors">
                    <strong>Honors:</strong> {{helpers.join honors}}
                </div>
                {{/if}}
                {{#if relevantCourses}}
                <div class="courses">
                    <strong>Relevant Courses:</strong> {{helpers.join relevantCourses}}
                </div>
                {{/if}}
            </div>
            {{/each}}
        </section>

        <section class="skills">
            <h2>Skills</h2>
            {{#each skills}}
            <div class="skill-category">
                <h3>{{category}}</h3>
                <p>{{helpers.join skills}}</p>
            </div>
            {{/each}}
        </section>

        {{#if certifications}}
        <section class="certifications">
            <h2>Certifications</h2>
            {{#each certifications}}
            <div class="certification-item">
                <h3>{{name}}</h3>
                <div class="certification-meta">
                    <span class="issuer">{{issuer}}</span>
                    <span class="issue-date">{{issueDate}}</span>
                    {{#if credentialId}}<span class="credential-id">{{credentialId}}</span>{{/if}}
                </div>
            </div>
            {{/each}}
        </section>
        {{/if}}

        {{#if projects}}
        <section class="projects">
            <h2>Projects</h2>
            {{#each projects}}
            <div class="project-item">
                <h3>{{name}}</h3>
                <div class="project-meta">
                    {{#if role}}<span class="role">{{role}}</span>{{/if}}
                    <span class="dates">{{startDate}} - {{endDate}}</span>
                </div>
                <p class="project-description">{{description}}</p>
                {{#if highlights}}
                <ul class="project-highlights">
                    {{#each highlights}}
                    <li>{{this}}</li>
                    {{/each}}
                </ul>
                {{/if}}
                <div class="project-technologies">
                    <strong>Technologies:</strong> {{helpers.join technologies}}
                </div>
                {{#if url}}<a href="{{url}}" class="project-url">View Project</a>{{/if}}
            </div>
            {{/each}}
        </section>
        {{/if}}

        {{#if awards}}
        <section class="awards">
            <h2>Awards</h2>
            {{#each awards}}
            <div class="award-item">
                <h3>{{title}}</h3>
                <div class="award-meta">
                    <span class="issuer">{{issuer}}</span>
                    <span class="date">{{date}}</span>
                </div>
                {{#if description}}<p class="award-description">{{description}}</p>{{/if}}
            </div>
            {{/each}}
        </section>
        {{/if}}
    </div>
</body>
</html>`;
  }

  /**
   * Gets default CSS template
   */
  private getDefaultCssTemplate(): string {
    return `
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
        }

        .resume {
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 40px;
            border-radius: 8px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .name {
            font-size: 2.5em;
            margin: 0;
            color: #2c3e50;
            font-weight: 300;
        }

        .contact {
            margin-top: 15px;
            font-size: 1.1em;
        }

        .contact span, .contact a {
            margin: 0 10px;
            color: #7f8c8d;
        }

        .contact a {
            text-decoration: none;
            color: #3498db;
        }

        .contact a:hover {
            text-decoration: underline;
        }

        section {
            margin-bottom: 30px;
        }

        h2 {
            color: #2c3e50;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
            font-size: 1.5em;
            margin-bottom: 20px;
        }

        h3 {
            color: #34495e;
            margin-bottom: 5px;
            font-size: 1.2em;
        }

        .experience-item, .education-item, .certification-item, .project-item, .award-item {
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ecf0f1;
        }

        .experience-item:last-child, .education-item:last-child, .certification-item:last-child, .project-item:last-child, .award-item:last-child {
            border-bottom: none;
        }

        .experience-meta, .education-meta, .certification-meta, .project-meta, .award-meta {
            color: #7f8c8d;
            font-style: italic;
            margin-bottom: 10px;
        }

        .responsibilities, .project-highlights {
            margin: 10px 0;
            padding-left: 20px;
        }

        .responsibilities li, .project-highlights li {
            margin-bottom: 5px;
        }

        .technologies, .honors, .courses, .project-technologies {
            margin-top: 10px;
            font-size: 0.9em;
            color: #7f8c8d;
        }

        .skill-category {
            margin-bottom: 15px;
        }

        .skill-category h3 {
            margin-bottom: 5px;
            color: #2c3e50;
        }

        .project-url {
            display: inline-block;
            margin-top: 10px;
            color: #3498db;
            text-decoration: none;
        }

        .project-url:hover {
            text-decoration: underline;
        }

        .summary p {
            font-size: 1.1em;
            line-height: 1.7;
            color: #555;
        }

        @media print {
            body {
                max-width: none;
                margin: 0;
                padding: 0;
            }
            
            .resume {
                box-shadow: none;
                padding: 0;
            }
        }

        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .resume {
                padding: 20px;
            }
            
            .name {
                font-size: 2em;
            }
            
            .contact {
                font-size: 1em;
            }
            
            .contact span, .contact a {
                display: block;
                margin: 5px 0;
            }
        }
    `;
  }

  /**
   * Gets supported HTML features
   */
  getSupportedFeatures(): Array<string> {
    return [
      'Semantic HTML structure',
      'Responsive design',
      'Print-friendly styles',
      'Template variable substitution',
      'Array loops',
      'Conditional sections',
      'Markdown rendering',
      'CSS template support',
      'Metadata injection',
      'HTML minification',
      'Accessibility features'
    ];
  }
}
