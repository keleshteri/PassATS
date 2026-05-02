/**
 * Markdown Validator
 * 
 * Validates markdown resume structure and content according to business rules.
 * Returns validation errors with specific error codes and suggestions.
 */

export type ValidationErrorCode = 
  | 'MISSING_REQUIRED_SECTION'
  | 'INVALID_MARKDOWN_STRUCTURE'
  | 'INVALID_DATE_FORMAT'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_URL'
  | 'CONTENT_TOO_LONG'
  | 'EMPTY_SECTION'
  | 'INVALID_HEADING_HIERARCHY';

export type ValidationError = {
  code: ValidationErrorCode;
  message: string;
  section?: string;
  line?: number;
  suggestion: string;
}

export type ValidationWarning = {
  message: string;
  section?: string;
}

export type ResumeStructure = {
  sections: Array<string>;
  wordCount: number;
  experienceCount: number;
  educationCount: number;
}

export type ValidationResult = {
  valid: boolean;
  errors: Array<ValidationError>;
  warnings: Array<ValidationWarning>;
  structure: ResumeStructure;
}

export class MarkdownValidator {
  private readonly content: string;
  private readonly lines: Array<string>;
  private readonly strict: boolean;

  constructor(content: string, strict = false) {
    this.content = content;
    this.lines = content.split('\n');
    this.strict = strict;
  }

  /**
   * Validates the entire markdown resume
   */
  validate(): ValidationResult {
    const errors: Array<ValidationError> = [];
    const warnings: Array<ValidationWarning> = [];
    
    // Basic structure validation
    errors.push(...this.validateBasicStructure());
    
    // Required sections validation
    errors.push(...this.validateRequiredSections());
    
    // Contact information validation
    errors.push(...this.validateContactInfo());
    
    // Section content validation
    errors.push(...this.validateSectionContent());
    
    // Heading hierarchy validation
    errors.push(...this.validateHeadingHierarchy());
    
    // Content length validation
    errors.push(...this.validateContentLength());
    
    // Personal pronouns validation (if strict mode)
    if (this.strict) {
      errors.push(...this.validateNoPersonalPronouns());
    }
    
    // Generate warnings
    warnings.push(...this.generateWarnings());
    
    // Extract structure
    const structure = this.extractStructure();
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      structure
    };
  }

  /**
   * Validates basic markdown structure
   */
  private validateBasicStructure(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    
    // Must start with H1 heading (name)
    if (!this.lines[0]?.startsWith('# ')) {
      errors.push({
        code: 'INVALID_MARKDOWN_STRUCTURE',
        message: 'Resume must start with H1 heading containing your full name',
        line: 1,
        suggestion: 'Start with: # Your Full Name'
      });
    }
    
    // Must have contact info on second line
    if (this.lines.length < 2 || !this.lines[1]?.includes('**Email**:')) {
      errors.push({
        code: 'INVALID_MARKDOWN_STRUCTURE',
        message: 'Contact information must be on the second line',
        line: 2,
        suggestion: 'Add: **Email**: your@email.com | **Phone**: +12345678901'
      });
    }
    
    return errors;
  }

  /**
   * Validates required sections are present
   */
  private validateRequiredSections(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    const requiredSections = ['Work Experience', 'Education', 'Skills'];
    
    for (const section of requiredSections) {
      const sectionLine = this.findSectionLine(section);
      if (sectionLine === -1) {
        errors.push({
          code: 'MISSING_REQUIRED_SECTION',
          message: `Required section '${section}' is missing`,
          suggestion: `Add a section: ## ${section}`
        });
      }
    }
    
    return errors;
  }

  /**
   * Validates contact information format
   */
  private validateContactInfo(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    
    // Find contact info line
    const contactLineIndex = this.lines.findIndex(line => line.includes('**Email**:'));
    if (contactLineIndex === -1) {
      return errors; // Already handled in basic structure validation
    }
    
    const contactLine = this.lines[contactLineIndex];
    
    if (!contactLine) {
      return errors;
    }
    
    // Extract email
    const emailMatch = contactLine.match(/\*\*Email\*\*:\s*([^\s|]+)/);
    if (!emailMatch) {
      errors.push({
        code: 'INVALID_EMAIL',
        message: 'Email address is required in contact section',
        section: 'contact',
        line: contactLineIndex + 1,
        suggestion: 'Add email in format: **Email**: your@email.com'
      });
    } else {
      const email = emailMatch[1];
      if (!email || !this.isValidEmail(email)) {
        errors.push({
          code: 'INVALID_EMAIL',
          message: `Invalid email format: ${email}`,
          section: 'contact',
          line: contactLineIndex + 1,
          suggestion: 'Use valid email format: user@domain.com'
        });
      }
    }
    
    // Extract phone
    const phoneMatch = contactLine.match(/\*\*Phone\*\*:\s*([^\s|]+)/);
    if (!phoneMatch) {
      errors.push({
        code: 'INVALID_PHONE',
        message: 'Phone number is required in contact section',
        section: 'contact',
        line: contactLineIndex + 1,
        suggestion: 'Add phone in format: **Phone**: +12345678901'
      });
    } else {
      const phone = phoneMatch[1];
      if (!phone || !this.isValidPhone(phone)) {
        errors.push({
          code: 'INVALID_PHONE',
          message: `Phone must be in E.164 format (e.g., +12345678901)`,
          section: 'contact',
          line: contactLineIndex + 1,
          suggestion: 'Use E.164 format: +12345678901'
        });
      }
    }
    
    // Extract URLs (LinkedIn, GitHub, etc.)
    const urls = contactLine.match(/https?:\/\/[^\s|]+/g) || [];
    for (const url of urls) {
      if (!this.isValidUrl(url)) {
        errors.push({
          code: 'INVALID_URL',
          message: `Invalid URL format: ${url}`,
          section: 'contact',
          line: contactLineIndex + 1,
          suggestion: 'Use valid HTTPS URL'
        });
      }
    }
    
    return errors;
  }

  /**
   * Validates section content is not empty
   */
  private validateSectionContent(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    const requiredSections = ['Work Experience', 'Education', 'Skills'];
    
    for (const section of requiredSections) {
      const sectionLine = this.findSectionLine(section);
      if (sectionLine === -1) continue;
      
      const nextSectionLine = this.findNextSectionLine(sectionLine);
      const sectionContent = this.lines.slice(sectionLine + 1, nextSectionLine);
      
      // Remove empty lines and check if there's actual content
      const nonEmptyLines = sectionContent.filter(line => line.trim().length > 0);
      
      if (nonEmptyLines.length === 0) {
        errors.push({
          code: 'EMPTY_SECTION',
          message: `Section '${section}' is empty`,
          section,
          line: sectionLine + 1,
          suggestion: this.getEmptySectionSuggestion(section)
        });
      }
    }
    
    return errors;
  }

  /**
   * Validates heading hierarchy (no H4+ headings)
   */
  private validateHeadingHierarchy(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      if (!line) continue;
      
      // Check for H4+ headings
      if (line.match(/^#{4,}\s+/)) {
        errors.push({
          code: 'INVALID_HEADING_HIERARCHY',
          message: 'H4+ headings are not allowed',
          line: i + 1,
          suggestion: 'Use H1 for name, H2 for sections, H3 for job titles'
        });
      }
    }
    
    return errors;
  }

  /**
   * Validates content length
   */
  private validateContentLength(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    
    if (this.content.length > 50000) {
      errors.push({
        code: 'CONTENT_TOO_LONG',
        message: 'Resume content exceeds 50,000 character limit',
        suggestion: 'Reduce content length by removing unnecessary details'
      });
    }
    
    return errors;
  }

  /**
   * Validates no personal pronouns are used
   */
  private validateNoPersonalPronouns(): Array<ValidationError> {
    const errors: Array<ValidationError> = [];
    const personalPronouns = ['i ', ' me ', ' my ', ' myself ', ' we ', ' us ', ' our ', ' ourselves '];
    
    for (let i = 0; i < this.lines.length; i++) {
      const lineContent = this.lines[i];
      if (!lineContent) continue;
      
      const line = lineContent.toLowerCase();
      
      for (const pronoun of personalPronouns) {
        if (line.includes(pronoun)) {
          errors.push({
            code: 'INVALID_MARKDOWN_STRUCTURE',
            message: `Personal pronoun "${pronoun.trim()}" found`,
            line: i + 1,
            suggestion: 'Use third person or action verbs instead of personal pronouns'
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Generates warnings for potential issues
   */
  private generateWarnings(): Array<ValidationWarning> {
    const warnings: Array<ValidationWarning> = [];
    
    // Check for missing professional summary
    const summaryLine = this.findSectionLine('Professional Summary');
    if (summaryLine === -1) {
      warnings.push({
        message: 'Consider adding a Professional Summary section',
        section: 'summary'
      });
    }
    
    // Check for missing optional sections
    const optionalSections = ['Certifications', 'Projects', 'Awards'];
    for (const section of optionalSections) {
      const sectionLine = this.findSectionLine(section);
      if (sectionLine === -1) {
        warnings.push({
          message: `Consider adding a ${section} section if applicable`,
          section: section.toLowerCase()
        });
      }
    }
    
    return warnings;
  }

  /**
   * Extracts resume structure information
   */
  private extractStructure(): ResumeStructure {
    const sections: Array<string> = [];
    let experienceCount = 0;
    let educationCount = 0;
    
    // Find all H2 sections
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (!line) continue;
      
      if (line.startsWith('## ')) {
        const sectionName = line.substring(3).trim();
        sections.push(sectionName);
        
        if (sectionName === 'Work Experience') {
          // Count H3 headings in work experience section
          const nextSectionLine = this.findNextSectionLine(i);
          for (let j = i + 1; j < nextSectionLine; j++) {
            const lineJ = this.lines[j];
            if (lineJ && lineJ.startsWith('### ')) {
              experienceCount++;
            }
          }
        } else if (sectionName === 'Education') {
          // Count H3 headings in education section
          const nextSectionLine = this.findNextSectionLine(i);
          for (let j = i + 1; j < nextSectionLine; j++) {
            const lineJ = this.lines[j];
            if (lineJ && lineJ.startsWith('### ')) {
              educationCount++;
            }
          }
        }
      }
    }
    
    const wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
      sections,
      wordCount,
      experienceCount,
      educationCount
    };
  }

  /**
   * Finds the line number of a section heading
   */
  private findSectionLine(sectionName: string): number {
    return this.lines.findIndex(line => 
      line && line.startsWith('## ') && line.toLowerCase().includes(sectionName.toLowerCase())
    );
  }

  /**
   * Finds the next section heading after the given line
   */
  private findNextSectionLine(currentLine: number): number {
    for (let i = currentLine + 1; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (line && line.startsWith('## ')) {
        return i;
      }
    }
    return this.lines.length;
  }

  /**
   * Gets suggestion for empty section
   */
  private getEmptySectionSuggestion(section: string): string {
    const suggestions: Record<string, string> = {
      'Work Experience': 'Add at least one work experience entry with job title, company, dates, and responsibilities',
      'Education': 'Add at least one education entry with degree, institution, and graduation date',
      'Skills': 'Add at least one skill category with relevant skills'
    };
    
    return suggestions[section] || 'Add relevant content to this section';
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  /**
   * Validates phone format (E.164)
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validates URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
