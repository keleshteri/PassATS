/**
 * Resume Entity
 * 
 * Represents a complete resume with all sections and content.
 * Aggregates all value objects and enforces business rules and invariants.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Award } from './award.js';
import type { Certification } from './certification.js';
import type { ContactInfo } from './contact-info.js';
import type { Education } from './education.js';
import type { Project } from './project.js';
import type { SkillCategory } from './skill-category.js';
import type { WorkExperience } from './work-experience.js';

export type ResumeData = {
  id?: string;
  version?: string;
  createdAt?: Date;
  updatedAt?: Date;
  contact: ContactInfo;
  summary?: string;
  experience: Array<WorkExperience>;
  education: Array<Education>;
  skills: Array<SkillCategory>;
  certifications?: Array<Certification>;
  projects?: Array<Project>;
  awards?: Array<Award>;
  templateId?: string;
  language?: string;
  lastValidated?: Date;
}

export class Resume {
  private readonly _id: string;
  private readonly _version: string;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;
  private readonly _contact: ContactInfo;
  private readonly _summary?: string;
  private readonly _experience: Array<WorkExperience>;
  private readonly _education: Array<Education>;
  private readonly _skills: Array<SkillCategory>;
  private readonly _certifications?: Array<Certification>;
  private readonly _projects?: Array<Project>;
  private readonly _awards?: Array<Award>;
  private readonly _templateId?: string;
  private readonly _language: string;
  private readonly _lastValidated?: Date;

  constructor(data: ResumeData) {
    this.validateData(data);
    
    this._id = data.id || uuidv4();
    this._version = data.version || '1.0.0';
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
    this._contact = data.contact;
    this._summary = data.summary;
    this._experience = [...data.experience];
    this._education = [...data.education];
    this._skills = [...data.skills];
    this._certifications = data.certifications ? [...data.certifications] : undefined;
    this._projects = data.projects ? [...data.projects] : undefined;
    this._awards = data.awards ? [...data.awards] : undefined;
    this._templateId = data.templateId;
    this._language = data.language || 'en';
    this._lastValidated = data.lastValidated;
  }

  // Getters
  get id(): string { return this._id; }
  get version(): string { return this._version; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get contact(): ContactInfo { return this._contact; }
  get summary(): string | undefined { return this._summary; }
  get experience(): Array<WorkExperience> { return [...this._experience]; }
  get education(): Array<Education> { return [...this._education]; }
  get skills(): Array<SkillCategory> { return [...this._skills]; }
  get certifications(): Array<Certification> | undefined { return this._certifications ? [...this._certifications] : undefined; }
  get projects(): Array<Project> | undefined { return this._projects ? [...this._projects] : undefined; }
  get awards(): Array<Award> | undefined { return this._awards ? [...this._awards] : undefined; }
  get templateId(): string | undefined { return this._templateId; }
  get language(): string { return this._language; }
  get lastValidated(): Date | undefined { return this._lastValidated; }

  /**
   * Validates resume data according to business rules and invariants
   */
  private validateData(data: ResumeData): void {
    // Required sections validation
    if (!data.contact) {
      throw new Error('Contact information is required');
    }

    if (!data.experience || data.experience.length === 0) {
      throw new Error('At least one work experience entry is required');
    }

    if (!data.education || data.education.length === 0) {
      throw new Error('At least one education entry is required');
    }

    if (!data.skills || data.skills.length === 0) {
      throw new Error('At least one skill category is required');
    }

    // Chronological order validation
    this.validateChronologicalOrder(data);

    // Content length validation
    this.validateContentLength(data);

    // Personal pronouns validation
    this.validateNoPersonalPronouns(data);

    // ID validation (if provided)
    if (data.id && !this.isValidUuid(data.id)) {
      throw new Error('ID must be a valid UUID v4');
    }

    // Version validation (if provided)
    if (data.version && !this.isValidSemver(data.version)) {
      throw new Error('Version must follow semantic versioning format');
    }
  }

  /**
   * Validates that experience and education are in reverse chronological order
   */
  private validateChronologicalOrder(data: ResumeData): void {
    // Validate experience order (most recent first)
    for (let i = 0; i < data.experience.length - 1; i++) {
      const current = data.experience[i];
      const next = data.experience[i + 1];
      
      // Compare start dates
      if (current && next && current.startDate.isBefore(next.startDate)) {
        throw new Error('Work experience must be in reverse chronological order (most recent first)');
      }
    }

    // Validate education order (most recent first)
    for (let i = 0; i < data.education.length - 1; i++) {
      const current = data.education[i];
      const next = data.education[i + 1];
      
      // Compare graduation dates
      if (current && next && current.graduationDate.isBefore(next.graduationDate)) {
        throw new Error('Education must be in reverse chronological order (most recent first)');
      }
    }
  }

  /**
   * Validates total content length doesn't exceed 50,000 characters
   */
  private validateContentLength(data: ResumeData): void {
    let totalLength = 0;
    
    // Add contact info length
    totalLength += data.contact.fullName.length;
    totalLength += data.contact.email.length;
    totalLength += data.contact.phone.length;
    if (data.contact.location) totalLength += data.contact.location.length;
    if (data.contact.linkedin) totalLength += data.contact.linkedin.length;
    if (data.contact.github) totalLength += data.contact.github.length;
    if (data.contact.portfolio) totalLength += data.contact.portfolio.length;
    if (data.contact.website) totalLength += data.contact.website.length;

    // Add summary length
    if (data.summary) totalLength += data.summary.length;

    // Add experience length
    for (const exp of data.experience) {
      totalLength += exp.title.length + exp.company.length;
      if (exp.location) totalLength += exp.location.length;
      totalLength += exp.responsibilities.join(' ').length;
      if (exp.achievements) totalLength += exp.achievements.join(' ').length;
      if (exp.technologies) totalLength += exp.technologies.join(' ').length;
    }

    // Add education length
    for (const edu of data.education) {
      totalLength += edu.degree.length + edu.institution.length;
      if (edu.location) totalLength += edu.location.length;
      if (edu.honors) totalLength += edu.honors.join(' ').length;
      if (edu.relevantCourses) totalLength += edu.relevantCourses.join(' ').length;
    }

    // Add skills length
    for (const skill of data.skills) {
      totalLength += skill.category.length + skill.skills.join(' ').length;
    }

    // Add optional sections length
    if (data.certifications) {
      for (const cert of data.certifications) {
        totalLength += cert.name.length + cert.issuer.length;
      }
    }

    if (data.projects) {
      for (const proj of data.projects) {
        totalLength += proj.name.length + proj.description.length;
        if (proj.role) totalLength += proj.role.length;
        totalLength += proj.technologies.join(' ').length;
        totalLength += proj.highlights.join(' ').length;
      }
    }

    if (data.awards) {
      for (const award of data.awards) {
        totalLength += award.title.length + award.issuer.length;
        if (award.description) totalLength += award.description.length;
      }
    }

    if (totalLength > 50000) {
      throw new Error('Total resume content cannot exceed 50,000 characters');
    }
  }

  /**
   * Validates that no personal pronouns are used
   */
  private validateNoPersonalPronouns(data: ResumeData): void {
    const personalPronouns = ['i', 'me', 'my', 'myself', 'we', 'us', 'our', 'ourselves'];
    
    const checkText = (text: string, context: string): void => {
      const words = text.toLowerCase().split(/\s+/);
      for (const pronoun of personalPronouns) {
        if (words.includes(pronoun)) {
          throw new Error(`Personal pronoun "${pronoun}" found in ${context}. Use third person or action verbs instead.`);
        }
      }
    };

    // Check summary
    if (data.summary) {
      checkText(data.summary, 'summary');
    }

    // Check experience responsibilities and achievements
    for (const exp of data.experience) {
      for (const responsibility of exp.responsibilities) {
        checkText(responsibility, `work experience at ${exp.company}`);
      }
      if (exp.achievements) {
        for (const achievement of exp.achievements) {
          checkText(achievement, `work experience at ${exp.company}`);
        }
      }
    }

    // Check project highlights
    if (data.projects) {
      for (const proj of data.projects) {
        for (const highlight of proj.highlights) {
          checkText(highlight, `project ${proj.name}`);
        }
      }
    }
  }

  /**
   * Validates UUID v4 format
   */
  private isValidUuid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validates semantic version format
   */
  private isValidSemver(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Gets the total word count of the resume
   */
  getWordCount(): number {
    const content = this.getFullText();
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Gets the full text content of the resume
   */
  getFullText(): string {
    let text = '';
    
    text += this._contact.fullName + ' ';
    if (this._summary) text += this._summary + ' ';
    
    for (const exp of this._experience) {
      text += exp.title + ' ' + exp.company + ' ';
      text += exp.responsibilities.join(' ') + ' ';
    }
    
    for (const edu of this._education) {
      text += edu.degree + ' ' + edu.institution + ' ';
    }
    
    for (const skill of this._skills) {
      text += skill.category + ' ' + skill.skills.join(' ') + ' ';
    }
    
    return text.trim();
  }

  /**
   * Gets experience duration in months
   */
  getTotalExperienceInMonths(): number {
    return this._experience.reduce((total, exp) => {
      return total + exp.getDurationInMonths();
    }, 0);
  }

  /**
   * Gets the most recent work experience
   */
  getCurrentExperience(): WorkExperience | undefined {
    return this._experience.length > 0 ? this._experience[0] : undefined;
  }

  /**
   * Gets the highest education level
   */
  getHighestEducation(): Education | undefined {
    return this._education.length > 0 ? this._education[0] : undefined;
  }

  /**
   * Returns a copy of the resume data
   */
  toData(): ResumeData {
    return {
      id: this._id,
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      contact: this._contact,
      summary: this._summary,
      experience: [...this._experience],
      education: [...this._education],
      skills: [...this._skills],
      certifications: this._certifications ? [...this._certifications] : undefined,
      projects: this._projects ? [...this._projects] : undefined,
      awards: this._awards ? [...this._awards] : undefined,
      templateId: this._templateId,
      language: this._language,
      lastValidated: this._lastValidated
    };
  }

  /**
   * Creates a new Resume with updated data (immutable)
   */
  withUpdates(updates: Partial<ResumeData>): Resume {
    const newData = { ...this.toData(), ...updates, updatedAt: new Date() };
    return new Resume(newData);
  }

  /**
   * Checks equality with another Resume
   */
  equals(other: Resume): boolean {
    return this._id === other._id &&
           this._version === other._version &&
           this._contact.equals(other._contact);
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return `Resume(${this._contact.fullName}, ${this._experience.length} experiences, ${this._education.length} education entries)`;
  }
}
