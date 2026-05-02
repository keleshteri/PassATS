/**
 * Project Value Object
 * 
 * Represents a personal or professional project with validation for description, technologies, etc.
 * Enforces business rules for project data.
 */

import { DatePeriod } from './date-period.js';

export type ProjectData = {
  name: string;
  description: string;
  role?: string;
  technologies: Array<string>;
  url?: string;
  startDate?: DatePeriod;
  endDate?: DatePeriod;
  highlights: Array<string>;
}

export class Project {
  private readonly _name: string;
  private readonly _description: string;
  private readonly _role?: string;
  private readonly _technologies: Array<string>;
  private readonly _url?: string;
  private readonly _startDate?: DatePeriod;
  private readonly _endDate?: DatePeriod;
  private readonly _highlights: Array<string>;

  constructor(data: ProjectData) {
    this.validateData(data);
    
    this._name = data.name;
    this._description = data.description;
    this._role = data.role;
    this._technologies = [...data.technologies];
    this._url = data.url;
    this._startDate = data.startDate;
    this._endDate = data.endDate;
    this._highlights = [...data.highlights];
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get role(): string | undefined { return this._role; }
  get technologies(): Array<string> { return [...this._technologies]; }
  get url(): string | undefined { return this._url; }
  get startDate(): DatePeriod | undefined { return this._startDate; }
  get endDate(): DatePeriod | undefined { return this._endDate; }
  get highlights(): Array<string> { return [...this._highlights]; }

  /**
   * Validates project data according to business rules
   */
  private validateData(data: ProjectData): void {
    // Name validation
    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 100) {
      throw new Error('Project name must be between 2 and 100 characters');
    }

    // Description validation
    if (!data.description || data.description.trim().length < 10 || data.description.trim().length > 500) {
      throw new Error('Project description must be between 10 and 500 characters');
    }

    // Role validation (if provided)
    if (data.role && (data.role.trim().length < 2 || data.role.trim().length > 100)) {
      throw new Error('Role must be between 2 and 100 characters');
    }

    // Technologies validation
    if (!data.technologies || data.technologies.length < 1) {
      throw new Error('Must have at least 1 technology');
    }

    for (const tech of data.technologies) {
      if (!tech.trim() || tech.trim().length < 2) {
        throw new Error('Each technology must be at least 2 characters');
      }
    }

    // Check for duplicate technologies
    const uniqueTechs = new Set(data.technologies.map(t => t.trim().toLowerCase()));
    if (uniqueTechs.size !== data.technologies.length) {
      throw new Error('Technologies cannot contain duplicates');
    }

    // URL validation (must be HTTPS)
    if (data.url) {
      this.validateHttpsUrl(data.url);
    }

    // Date validation
    this.validateDates(data);

    // Highlights validation
    if (!data.highlights || data.highlights.length < 1) {
      throw new Error('Must have at least 1 highlight');
    }

    for (const highlight of data.highlights) {
      if (!highlight.trim() || highlight.trim().length < 10 || highlight.trim().length > 200) {
        throw new Error('Each highlight must be between 10 and 200 characters');
      }
    }

    // Check for duplicate highlights
    const uniqueHighlights = new Set(data.highlights.map(h => h.trim().toLowerCase()));
    if (uniqueHighlights.size !== data.highlights.length) {
      throw new Error('Highlights cannot contain duplicates');
    }
  }

  /**
   * Validates HTTPS URL format
   */
  private validateHttpsUrl(url: string): void {
    const httpsRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    if (!httpsRegex.test(url)) {
      throw new Error('URL must be a valid HTTPS URL');
    }
  }

  /**
   * Validates date logic
   */
  private validateDates(data: ProjectData): void {
    // If both dates are provided, start must be before end
    if (data.startDate && data.endDate && !data.startDate.isBefore(data.endDate)) {
      throw new Error('Start date must be before end date');
    }

    // Start date should not be in the future
    if (data.startDate?.isFuture()) {
      throw new Error('Start date cannot be in the future');
    }

    // End date should not be in the future
    if (data.endDate?.isFuture()) {
      throw new Error('End date cannot be in the future');
    }
  }

  /**
   * Checks if the project is currently ongoing
   */
  isOngoing(): boolean {
    return !this._endDate;
  }

  /**
   * Gets the project duration in months
   */
  getDurationInMonths(): number | undefined {
    if (!this._startDate) {
      return undefined;
    }

    const endDate = this._endDate || this.getCurrentDate();
    
    let months = (endDate.year - this._startDate.year) * 12;
    months += endDate.month - this._startDate.month;
    
    // Add 1 to include both start and end months
    return Math.max(1, months + 1);
  }

  /**
   * Gets the duration as a human-readable string
   */
  getDurationString(): string | undefined {
    const months = this.getDurationInMonths();
    if (!months) {
      return undefined;
    }
    
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
   * Gets the current date period
   */
  private getCurrentDate(): DatePeriod {
    const now = new Date();
    return new DatePeriod({
      month: now.getMonth() + 1,
      year: now.getFullYear()
    });
  }

  /**
   * Gets technologies as a comma-separated string
   */
  getTechnologiesAsString(): string {
    return this._technologies.join(', ');
  }

  /**
   * Gets highlights as a formatted string
   */
  getHighlightsAsString(): string {
    return this._highlights.map(highlight => `• ${highlight}`).join('\n');
  }

  /**
   * Returns a copy of the project data
   */
  toData(): ProjectData {
    return {
      name: this._name,
      description: this._description,
      role: this._role,
      technologies: [...this._technologies],
      url: this._url,
      startDate: this._startDate,
      endDate: this._endDate,
      highlights: [...this._highlights]
    };
  }

  /**
   * Creates a new Project with updated data (immutable)
   */
  withUpdates(updates: Partial<ProjectData>): Project {
    const newData = { ...this.toData(), ...updates };
    return new Project(newData);
  }

  /**
   * Checks equality with another Project
   */
  equals(other: Project): boolean {
    return this._name === other._name &&
           this._description === other._description &&
           this._role === other._role &&
           JSON.stringify(this._technologies) === JSON.stringify(other._technologies) &&
           this._url === other._url &&
           ((!this._startDate && !other._startDate) || (this._startDate?.equals(other._startDate!) ?? false)) &&
           ((!this._endDate && !other._endDate) || (this._endDate?.equals(other._endDate!) ?? false)) &&
           JSON.stringify(this._highlights) === JSON.stringify(other._highlights);
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const statusStr = this.isOngoing() ? ' (Ongoing)' : '';
    return `${this._name}${statusStr}`;
  }
}
