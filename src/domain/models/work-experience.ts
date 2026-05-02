/**
 * WorkExperience Value Object
 * 
 * Represents a single work experience entry with validation for dates, responsibilities, etc.
 * Enforces business rules for work experience data.
 */

import { DatePeriod } from './date-period.js';

export type WorkExperienceData = {
  title: string;
  company: string;
  location?: string;
  startDate: DatePeriod;
  endDate?: DatePeriod;
  current: boolean;
  responsibilities: Array<string>;
  achievements?: Array<string>;
  technologies?: Array<string>;
}

export class WorkExperience {
  private readonly _title: string;
  private readonly _company: string;
  private readonly _location?: string;
  private readonly _startDate: DatePeriod;
  private readonly _endDate?: DatePeriod;
  private readonly _current: boolean;
  private readonly _responsibilities: Array<string>;
  private readonly _achievements?: Array<string>;
  private readonly _technologies?: Array<string>;

  constructor(data: WorkExperienceData) {
    this.validateData(data);
    
    this._title = data.title;
    this._company = data.company;
    this._location = data.location;
    this._startDate = data.startDate;
    this._endDate = data.endDate;
    this._current = data.current;
    this._responsibilities = [...data.responsibilities];
    this._achievements = data.achievements ? [...data.achievements] : undefined;
    this._technologies = data.technologies ? [...data.technologies] : undefined;
  }

  // Getters
  get title(): string { return this._title; }
  get company(): string { return this._company; }
  get location(): string | undefined { return this._location; }
  get startDate(): DatePeriod { return this._startDate; }
  get endDate(): DatePeriod | undefined { return this._endDate; }
  get current(): boolean { return this._current; }
  get responsibilities(): Array<string> { return [...this._responsibilities]; }
  get achievements(): Array<string> | undefined { return this._achievements ? [...this._achievements] : undefined; }
  get technologies(): Array<string> | undefined { return this._technologies ? [...this._technologies] : undefined; }

  /**
   * Validates work experience data according to business rules
   */
  private validateData(data: WorkExperienceData): void {
    // Title validation
    if (!data.title || data.title.trim().length < 2 || data.title.trim().length > 100) {
      throw new Error('Job title must be between 2 and 100 characters');
    }

    // Company validation
    if (!data.company || data.company.trim().length < 2 || data.company.trim().length > 100) {
      throw new Error('Company name must be between 2 and 100 characters');
    }

    // Date validation
    this.validateDates(data);

    // Responsibilities validation
    if (!data.responsibilities || data.responsibilities.length < 2) {
      throw new Error('Must have at least 2 responsibilities');
    }

    // Validate each responsibility starts with action verb
    for (const responsibility of data.responsibilities) {
      if (!responsibility.trim() || responsibility.trim().length < 10) {
        throw new Error('Each responsibility must be at least 10 characters');
      }
      
      const firstWord = responsibility.trim().split(' ')[0]?.toLowerCase();
      const actionVerbs = [
        'developed', 'designed', 'implemented', 'created', 'built', 'managed', 'led',
        'collaborated', 'optimized', 'improved', 'delivered', 'coordinated', 'analyzed',
        'resolved', 'mentored', 'trained', 'supervised', 'planned', 'executed',
        'achieved', 'increased', 'reduced', 'enhanced', 'streamlined', 'automated'
      ];
      
      if (!firstWord || !actionVerbs.includes(firstWord)) {
        throw new Error(`Responsibility should start with an action verb: "${responsibility}"`);
      }
    }

    // Validate achievements if provided
    if (data.achievements) {
      for (const achievement of data.achievements) {
        if (!achievement.trim() || achievement.trim().length < 10) {
          throw new Error('Each achievement must be at least 10 characters');
        }
      }
    }

    // Validate technologies if provided
    if (data.technologies) {
      for (const tech of data.technologies) {
        if (!tech.trim() || tech.trim().length < 2) {
          throw new Error('Each technology must be at least 2 characters');
        }
      }
    }
  }

  /**
   * Validates date logic
   */
  private validateDates(data: WorkExperienceData): void {
    // Current flag consistency
    if (data.current && data.endDate) {
      throw new Error('Current position cannot have an end date');
    }
    
    if (!data.current && !data.endDate) {
      throw new Error('Non-current position must have an end date');
    }

    // Start date must be before end date
    if (data.endDate && !data.startDate.isBefore(data.endDate)) {
      throw new Error('Start date must be before end date');
    }

    // Start date should not be in the future
    if (data.startDate.isFuture()) {
      throw new Error('Start date cannot be in the future');
    }

    // End date should not be in the future (if not current)
    if (data.endDate?.isFuture()) {
      throw new Error('End date cannot be in the future');
    }
  }

  /**
   * Gets the duration in months
   */
  getDurationInMonths(): number {
    const endDate = this._current ? this.getCurrentDate() : this._endDate!;
    
    let months = (endDate.year - this._startDate.year) * 12;
    months += endDate.month - this._startDate.month;
    
    // Add 1 to include both start and end months
    return months + 1;
  }

  /**
   * Gets the duration as a human-readable string
   */
  getDurationString(): string {
    const months = this.getDurationInMonths();
    
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
   * Returns a copy of the work experience data
   */
  toData(): WorkExperienceData {
    return {
      title: this._title,
      company: this._company,
      location: this._location,
      startDate: this._startDate,
      endDate: this._endDate,
      current: this._current,
      responsibilities: [...this._responsibilities],
      achievements: this._achievements ? [...this._achievements] : undefined,
      technologies: this._technologies ? [...this._technologies] : undefined
    };
  }

  /**
   * Creates a new WorkExperience with updated data (immutable)
   */
  withUpdates(updates: Partial<WorkExperienceData>): WorkExperience {
    const newData = { ...this.toData(), ...updates };
    return new WorkExperience(newData);
  }

  /**
   * Checks equality with another WorkExperience
   */
  equals(other: WorkExperience): boolean {
    return this._title === other._title &&
           this._company === other._company &&
           this._location === other._location &&
           this._startDate.equals(other._startDate) &&
           ((!this._endDate && !other._endDate) || (this._endDate?.equals(other._endDate!) ?? false)) &&
           this._current === other._current &&
           JSON.stringify(this._responsibilities) === JSON.stringify(other._responsibilities);
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const endDateStr = this._current ? 'Present' : this._endDate?.formatMMYYYY();
    return `${this._title} at ${this._company} (${this._startDate.formatMMYYYY()} - ${endDateStr})`;
  }
}
