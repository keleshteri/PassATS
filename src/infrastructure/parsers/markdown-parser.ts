/**
 * Markdown Parser Service
 * 
 * Parses markdown resume content into structured data using markdown-it.
 * Provides AST parsing, section extraction, and HTML sanitization.
 */

import MarkdownIt from 'markdown-it';
import { Award } from '../../domain/models/award.js';
import { Certification } from '../../domain/models/certification.js';
import { ContactInfo } from '../../domain/models/contact-info.js';
import { DatePeriod } from '../../domain/models/date-period.js';
import { Education } from '../../domain/models/education.js';
import { Project } from '../../domain/models/project.js';
import { Resume } from '../../domain/models/resume.js';
import { SkillCategory } from '../../domain/models/skill-category.js';
import { WorkExperience } from '../../domain/models/work-experience.js';
import type { ResumeData } from '../../domain/models/resume.js';

export type ParsedSection = {
  type: 'heading' | 'paragraph' | 'list' | 'text';
  level?: number;
  content: string;
  children?: Array<ParsedSection>;
}

export type ParsedResume = {
  name: string;
  contact: ContactInfo;
  summary?: string;
  experience: Array<WorkExperience>;
  education: Array<Education>;
  skills: Array<SkillCategory>;
  certifications?: Array<Certification>;
  projects?: Array<Project>;
  awards?: Array<Award>;
  sections: Record<string, Array<ParsedSection>>;
}

export type ParseOptions = {
  strict: boolean;
  validateStructure: boolean;
  extractMetadata: boolean;
}

export class MarkdownParser {
  private readonly md: MarkdownIt;
  private readonly options: ParseOptions;

  constructor(options: Partial<ParseOptions> = {}) {
    this.options = {
      strict: false,
      validateStructure: true,
      extractMetadata: true,
      ...options
    };

    // Initialize markdown-it with CommonMark compliance
    this.md = new MarkdownIt({
      html: false, // Disable HTML tags for security
      linkify: true, // Automatically convert URLs to links
      typographer: true, // Enable smart quotes and other typographic replacements
      breaks: false // Don't convert line breaks to <br>
    });
  }

  /**
   * Parses markdown content into structured resume data
   */
  parse(markdown: string): ParsedResume {
    const lines = markdown.split('\n');
    const ast = this.md.parse(markdown, {});
    
    // Extract basic structure
    const name = this.extractName(lines);
    const contact = this.extractContactInfo(lines);
    const summary = this.extractSummary(lines);
    
    // Extract sections
    const sections = this.extractSections(lines, ast);
    
    // Parse structured data
    const experience = this.parseWorkExperience(sections['Work Experience'] || []);
    const education = this.parseEducation(sections.Education || []);
    const skills = this.parseSkills(sections.Skills || []);
    const certifications = this.parseCertifications(sections.Certifications || []);
    const projects = this.parseProjects(sections.Projects || []);
    const awards = this.parseAwards(sections.Awards || []);

    return {
      name,
      contact,
      summary,
      experience,
      education,
      skills,
      certifications: certifications.length > 0 ? certifications : undefined,
      projects: projects.length > 0 ? projects : undefined,
      awards: awards.length > 0 ? awards : undefined,
      sections
    };
  }

  /**
   * Parses markdown and converts to Resume entity
   */
  parseToResume(markdown: string): Resume {
    const parsed = this.parse(markdown);
    return this.toResume(parsed);
  }

  /**
   * Converts parsed resume to Resume entity
   */
  toResume(parsed: ParsedResume): Resume {
    const resumeData: ResumeData = {
      contact: parsed.contact,
      summary: parsed.summary,
      experience: parsed.experience,
      education: parsed.education,
      skills: parsed.skills,
      certifications: parsed.certifications,
      projects: parsed.projects,
      awards: parsed.awards
    };

    return new Resume(resumeData);
  }

  /**
   * Parses markdown to HTML with sanitization
   */
  toHtml(markdown: string): string {
    return this.md.render(markdown);
  }

  /**
   * Extracts AST from markdown
   */
  getAst(markdown: string): Array<any> {
    return this.md.parse(markdown, {});
  }

  /**
   * Extracts sections from markdown content
   */
  extractSections(lines: Array<string>, ast: Array<any>): Record<string, Array<ParsedSection>> {
    const sections: Record<string, Array<ParsedSection>> = {};
    let currentSection = '';
    let currentContent: Array<ParsedSection> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for H2 section headers
      if (line && line.startsWith('## ')) {
        // Save previous section
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent;
        }
        
        // Start new section
        currentSection = line.substring(3).trim();
        currentContent = [];
        continue;
      }

      // Add content to current section
      if (currentSection && line && line.trim()) {
        const section = this.parseLineToSection(line, i);
        if (section) {
          currentContent.push(section);
        }
      }
    }

    // Save last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent;
    }

    return sections;
  }

  /**
   * Extracts name from H1 heading
   */
  private extractName(lines: Array<string>): string {
    const nameLine = lines.find(line => line.startsWith('# '));
    if (!nameLine) {
      throw new Error('Resume must start with H1 heading containing name');
    }
    return nameLine.substring(2).trim();
  }

  /**
   * Extracts contact information from second line
   */
  private extractContactInfo(lines: Array<string>): ContactInfo {
    const contactLine = lines.find(line => line.includes('**Email**:'));
    if (!contactLine) {
      throw new Error('Contact information must be on the second line');
    }

    // Extract email
    const emailMatch = /\*\*Email\*\*:\s*([^\s|]+)/.exec(contactLine);
    if (!emailMatch) {
      throw new Error('Email address is required in contact section');
    }
    const email = emailMatch[1];

    // Extract phone
    const phoneMatch = /\*\*Phone\*\*:\s*([^\s|]+)/.exec(contactLine);
    if (!phoneMatch) {
      throw new Error('Phone number is required in contact section');
    }
    const phone = phoneMatch[1];

    // Extract optional fields
    const locationMatch = /\*\*Location\*\*:\s*([^|]+)/.exec(contactLine);
    const linkedinMatch = /\*\*LinkedIn\*\*:\s*([^\s|]+)/.exec(contactLine);
    const githubMatch = /\*\*GitHub\*\*:\s*([^\s|]+)/.exec(contactLine);
    const portfolioMatch = /\*\*Portfolio\*\*:\s*([^\s|]+)/.exec(contactLine);
    const websiteMatch = /\*\*Website\*\*:\s*([^\s|]+)/.exec(contactLine);

    return new ContactInfo({
      fullName: this.extractName(lines),
      email: email || '',
      phone: phone || '',
      location: locationMatch?.[1]?.trim(),
      linkedin: linkedinMatch?.[1],
      github: githubMatch?.[1],
      portfolio: portfolioMatch?.[1],
      website: websiteMatch?.[1]
    });
  }

  /**
   * Extracts professional summary
   */
  private extractSummary(lines: Array<string>): string | undefined {
    const summarySection = this.findSectionContent(lines, 'Professional Summary');
    if (!summarySection) return undefined;

    return summarySection.join('\n').trim();
  }

  /**
   * Parses work experience section
   */
  private parseWorkExperience(sections: Array<ParsedSection>): Array<WorkExperience> {
    const experiences: Array<WorkExperience> = [];
    let currentExp: any = {};

    for (const section of sections) {
      if (section.type === 'heading' && section.level === 3) {
        // Save previous experience
        if (currentExp.title) {
          experiences.push(this.createWorkExperience(currentExp));
        }
        
        // Start new experience
        currentExp = this.parseJobTitle(section.content);
      } else if (section.type === 'list' && currentExp.title) {
        // Parse responsibilities
        currentExp.responsibilities = this.parseListItems(section.content);
      } else if (section.type === 'paragraph' && currentExp.title) {
        // Parse additional content (achievements, technologies)
        this.parseExperienceContent(section.content, currentExp);
      }
    }

    // Save last experience
    if (currentExp.title) {
      experiences.push(this.createWorkExperience(currentExp));
    }

    return experiences;
  }

  /**
   * Parses education section
   */
  private parseEducation(sections: Array<ParsedSection>): Array<Education> {
    const educations: Array<Education> = [];
    let currentEdu: any = {};

    for (const section of sections) {
      if (section.type === 'heading' && section.level === 3) {
        // Save previous education
        if (currentEdu.degree) {
          educations.push(this.createEducation(currentEdu));
        }
        
        // Start new education
        currentEdu = this.parseDegreeTitle(section.content);
      } else if (section.type === 'list' && currentEdu.degree) {
        // Parse honors or courses
        if (section.content.includes('Honors') || section.content.includes('GPA')) {
          currentEdu.honors = this.parseListItems(section.content);
        } else {
          currentEdu.relevantCourses = this.parseListItems(section.content);
        }
      } else if (section.type === 'paragraph' && currentEdu.degree) {
        // Parse additional content
        this.parseEducationContent(section.content, currentEdu);
      }
    }

    // Save last education
    if (currentEdu.degree) {
      educations.push(this.createEducation(currentEdu));
    }

    return educations;
  }

  /**
   * Parses skills section
   */
  private parseSkills(sections: Array<ParsedSection>): Array<SkillCategory> {
    const skills: Array<SkillCategory> = [];

    for (const section of sections) {
      if (section.type === 'heading' && section.level === 3) {
        // Category heading
        const categoryName = section.content;
        const skillItems = this.findNextListItems(sections, sections.indexOf(section));
        
        if (skillItems.length > 0) {
          skills.push(new SkillCategory({
            category: categoryName,
            skills: skillItems
          }));
        }
      }
    }

    return skills;
  }

  /**
   * Parses certifications section
   */
  private parseCertifications(sections: Array<ParsedSection>): Array<Certification> {
    const certifications: Array<Certification> = [];

    for (const section of sections) {
      if (section.type === 'heading' && section.level === 3) {
        const certData = this.parseCertificationTitle(section.content);
        certifications.push(new Certification(certData));
      }
    }

    return certifications;
  }

  /**
   * Parses projects section
   */
  private parseProjects(sections: Array<ParsedSection>): Array<Project> {
    const projects: Array<Project> = [];
    let currentProject: any = {};

    for (const section of sections) {
      if (section.type === 'heading' && section.level === 3) {
        // Save previous project
        if (currentProject.name) {
          projects.push(this.createProject(currentProject));
        }
        
        // Start new project
        currentProject = this.parseProjectTitle(section.content);
      } else if (section.type === 'list' && currentProject.name) {
        // Parse highlights or technologies
        if (section.content.includes('Technologies')) {
          currentProject.technologies = this.parseListItems(section.content);
        } else {
          currentProject.highlights = this.parseListItems(section.content);
        }
      } else if (section.type === 'paragraph' && currentProject.name) {
        // Parse description
        currentProject.description = section.content;
      }
    }

    // Save last project
    if (currentProject.name) {
      projects.push(this.createProject(currentProject));
    }

    return projects;
  }

  /**
   * Parses awards section
   */
  private parseAwards(sections: Array<ParsedSection>): Array<Award> {
    const awards: Array<Award> = [];

    for (const section of sections) {
      if (section.type === 'heading' && section.level === 3) {
        const awardData = this.parseAwardTitle(section.content);
        awards.push(new Award(awardData));
      }
    }

    return awards;
  }

  /**
   * Parses a line into a ParsedSection
   */
  private parseLineToSection(line: string, lineNumber: number): ParsedSection | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('### ')) {
      return {
        type: 'heading',
        level: 3,
        content: trimmed.substring(4).trim()
      };
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return {
        type: 'list',
        content: trimmed
      };
    } else {
      return {
        type: 'paragraph',
        content: trimmed
      };
    }
  }

  /**
   * Finds section content between headers
   */
  private findSectionContent(lines: Array<string>, sectionName: string): Array<string> | null {
    const sectionIndex = lines.findIndex(line => 
      line.startsWith('## ') && line.toLowerCase().includes(sectionName.toLowerCase())
    );
    
    if (sectionIndex === -1) return null;

    const content: Array<string> = [];
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      if (line.startsWith('## ')) break; // Next section
      if (line.trim()) content.push(line);
    }

    return content.length > 0 ? content : null;
  }

  /**
   * Parses job title line (e.g., "Software Engineer at Company | 2020-2023")
   */
  private parseJobTitle(titleLine: string): any {
    const parts = titleLine.split(' | ');
    const titleCompany = parts[0] || '';
    const dateRange = parts[1] || '';

    // Extract title and company
    const atIndex = titleCompany.lastIndexOf(' at ');
    const title = atIndex > 0 ? titleCompany.substring(0, atIndex) : titleCompany;
    const company = atIndex > 0 ? titleCompany.substring(atIndex + 4) : '';

    // Parse date range
    const dates = this.parseDateRange(dateRange);

    return {
      title: title.trim(),
      company: company.trim(),
      startDate: dates.start,
      endDate: dates.end,
      current: dates.current,
      responsibilities: [],
      achievements: [],
      technologies: []
    };
  }

  /**
   * Parses degree title line (e.g., "Bachelor of Science in Computer Science | University | 2020")
   */
  private parseDegreeTitle(titleLine: string): any {
    const parts = titleLine.split(' | ');
    const degree = parts[0] || '';
    const institution = parts[1] || '';
    const graduationDate = parts[2] || '';

    return {
      degree: degree.trim(),
      institution: institution.trim(),
      graduationDate: this.parseDate(graduationDate),
      location: undefined,
      gpa: undefined,
      honors: [],
      relevantCourses: []
    };
  }

  /**
   * Parses certification title line
   */
  private parseCertificationTitle(titleLine: string): any {
    const parts = titleLine.split(' | ');
    const name = parts[0] || '';
    const issuer = parts[1] || '';
    const date = parts[2] || '';

    return {
      name: name.trim(),
      issuer: issuer.trim(),
      issueDate: this.parseDate(date),
      expiryDate: undefined,
      credentialId: undefined,
      credentialUrl: undefined
    };
  }

  /**
   * Parses project title line
   */
  private parseProjectTitle(titleLine: string): any {
    const parts = titleLine.split(' | ');
    const name = parts[0] || '';
    const role = parts[1] || '';
    const dateRange = parts[2] || '';

    const dates = this.parseDateRange(dateRange);

    return {
      name: name.trim(),
      description: '',
      role: role.trim() || undefined,
      startDate: dates.start,
      endDate: dates.end,
      technologies: [],
      highlights: [],
      url: undefined
    };
  }

  /**
   * Parses award title line
   */
  private parseAwardTitle(titleLine: string): any {
    const parts = titleLine.split(' | ');
    const title = parts[0] || '';
    const issuer = parts[1] || '';
    const date = parts[2] || '';

    return {
      title: title.trim(),
      issuer: issuer.trim(),
      date: this.parseDate(date),
      description: undefined
    };
  }

  /**
   * Parses date range (e.g., "2020-2023", "2020-Present")
   */
  private parseDateRange(dateRange: string): { start: DatePeriod; end: DatePeriod | undefined; current: boolean } {
    const trimmed = dateRange.trim();
    if (!trimmed) {
      throw new Error('Date range is required');
    }

    const parts = trimmed.split('-');
    if (parts.length !== 2) {
      throw new Error('Invalid date range format');
    }

    const startStr = parts[0]?.trim() || '';
    const endStr = parts[1]?.trim() || '';
    const current = endStr.toLowerCase() === 'present' || endStr.toLowerCase() === 'current';

    const start = this.parseDate(startStr);
    const end = current ? undefined : this.parseDate(endStr);

    return { start, end, current };
  }

  /**
   * Parses date string (e.g., "2020", "01/2020", "Jan 2020")
   */
  private parseDate(dateStr: string): DatePeriod {
    const trimmed = dateStr.trim();
    if (!trimmed) {
      throw new Error('Date is required');
    }

    // Handle different date formats
    if (/^\d{4}$/.test(trimmed)) {
      // Year only (e.g., "2020")
      return new DatePeriod({ month: 1, year: parseInt(trimmed) });
    } else if (/^\d{1,2}\/\d{4}$/.test(trimmed)) {
      // MM/YYYY format
      const [month, year] = trimmed.split('/');
      return new DatePeriod({ month: parseInt(month || '1'), year: parseInt(year || '2000') });
    } else if (/^[A-Za-z]{3}\s+\d{4}$/.test(trimmed)) {
      // Month Year format (e.g., "Jan 2020")
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                         'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const [monthStr, yearStr] = trimmed.toLowerCase().split(' ');
      const month = monthNames.indexOf(monthStr || '') + 1;
      return new DatePeriod({ month, year: parseInt(yearStr || '2000') });
    } else {
      throw new Error(`Invalid date format: ${trimmed}`);
    }
  }

  /**
   * Parses list items from markdown list
   */
  private parseListItems(listContent: string): Array<string> {
    return listContent
      .split('\n')
      .map(line => line.replace(/^[-*]\s+/, '').trim())
      .filter(item => item.length > 0);
  }

  /**
   * Finds next list items after a heading
   */
  private findNextListItems(sections: Array<ParsedSection>, startIndex: number): Array<string> {
    const items: Array<string> = [];
    
    for (let i = startIndex + 1; i < sections.length; i++) {
      const section = sections[i];
      if (!section) continue;
      
      if (section.type === 'list') {
        items.push(...this.parseListItems(section.content));
      } else if (section.type === 'heading') {
        break; // Next heading, stop collecting
      }
    }
    
    return items;
  }

  /**
   * Parses additional experience content
   */
  private parseExperienceContent(content: string, exp: any): void {
    if (content.includes('Technologies:')) {
      exp.technologies = this.parseListItems(content);
    } else if (content.includes('Achievements:')) {
      exp.achievements = this.parseListItems(content);
    }
  }

  /**
   * Parses additional education content
   */
  private parseEducationContent(content: string, edu: any): void {
    if (content.includes('GPA:')) {
      const gpaMatch = /GPA:\s*([0-9.]+)/.exec(content);
      if (gpaMatch?.[1]) {
        edu.gpa = parseFloat(gpaMatch[1]);
      }
    }
    if (content.includes('Location:')) {
      const locationMatch = /Location:\s*([^|]+)/.exec(content);
      if (locationMatch?.[1]) {
        edu.location = locationMatch[1].trim();
      }
    }
  }

  /**
   * Creates WorkExperience from parsed data
   */
  private createWorkExperience(data: any): WorkExperience {
    return new WorkExperience({
      title: data.title,
      company: data.company,
      startDate: data.startDate,
      endDate: data.endDate,
      current: data.current,
      location: data.location,
      responsibilities: data.responsibilities,
      achievements: data.achievements,
      technologies: data.technologies
    });
  }

  /**
   * Creates Education from parsed data
   */
  private createEducation(data: any): Education {
    return new Education({
      degree: data.degree,
      institution: data.institution,
      graduationDate: data.graduationDate,
      location: data.location,
      gpa: data.gpa,
      honors: data.honors,
      relevantCourses: data.relevantCourses
    });
  }

  /**
   * Creates Project from parsed data
   */
  private createProject(data: any): Project {
    return new Project({
      name: data.name,
      description: data.description,
      role: data.role,
      startDate: data.startDate,
      endDate: data.endDate,
      technologies: data.technologies,
      highlights: data.highlights,
      url: data.url
    });
  }
}
