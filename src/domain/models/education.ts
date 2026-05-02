/**
 * Education Value Object
 * 
 * Represents an educational background entry with validation for degree, institution, GPA, etc.
 * Enforces business rules for education data.
 */

import type { DatePeriod } from './date-period.js';

export type EducationData = {
  degree: string;
  institution: string;
  location?: string;
  graduationDate: DatePeriod;
  gpa?: number;
  honors?: Array<string>;
  relevantCourses?: Array<string>;
}

export class Education {
  private readonly _degree: string;
  private readonly _institution: string;
  private readonly _location?: string;
  private readonly _graduationDate: DatePeriod;
  private readonly _gpa?: number;
  private readonly _honors?: Array<string>;
  private readonly _relevantCourses?: Array<string>;

  constructor(data: EducationData) {
    this.validateData(data);
    
    this._degree = data.degree;
    this._institution = data.institution;
    this._location = data.location;
    this._graduationDate = data.graduationDate;
    this._gpa = data.gpa;
    this._honors = data.honors ? [...data.honors] : undefined;
    this._relevantCourses = data.relevantCourses ? [...data.relevantCourses] : undefined;
  }

  // Getters
  get degree(): string { return this._degree; }
  get institution(): string { return this._institution; }
  get location(): string | undefined { return this._location; }
  get graduationDate(): DatePeriod { return this._graduationDate; }
  get gpa(): number | undefined { return this._gpa; }
  get honors(): Array<string> | undefined { return this._honors ? [...this._honors] : undefined; }
  get relevantCourses(): Array<string> | undefined { return this._relevantCourses ? [...this._relevantCourses] : undefined; }

  /**
   * Validates education data according to business rules
   */
  private validateData(data: EducationData): void {
    // Degree validation
    if (!data.degree || data.degree.trim().length < 2 || data.degree.trim().length > 150) {
      throw new Error('Degree must be between 2 and 150 characters');
    }

    // Institution validation
    if (!data.institution || data.institution.trim().length < 2 || data.institution.trim().length > 150) {
      throw new Error('Institution name must be between 2 and 150 characters');
    }

    // Graduation date validation
    if (data.graduationDate.isFuture()) {
      throw new Error('Graduation date cannot be in the future');
    }

    // GPA validation (0.0-4.0 scale)
    if (data.gpa !== undefined) {
      if (typeof data.gpa !== 'number' || data.gpa < 0.0 || data.gpa > 4.0) {
        throw new Error('GPA must be a number between 0.0 and 4.0');
      }
      
      // Check for reasonable precision (max 2 decimal places)
      if (data.gpa !== Math.round(data.gpa * 100) / 100) {
        throw new Error('GPA cannot have more than 2 decimal places');
      }
    }

    // Honors validation
    if (data.honors) {
      for (const honor of data.honors) {
        if (!honor.trim() || honor.trim().length < 2 || honor.trim().length > 100) {
          throw new Error('Each honor must be between 2 and 100 characters');
        }
      }
      
      // Check for duplicates
      const uniqueHonors = new Set(data.honors.map(h => h.trim().toLowerCase()));
      if (uniqueHonors.size !== data.honors.length) {
        throw new Error('Honors cannot contain duplicates');
      }
    }

    // Relevant courses validation
    if (data.relevantCourses) {
      for (const course of data.relevantCourses) {
        if (!course.trim() || course.trim().length < 2 || course.trim().length > 100) {
          throw new Error('Each course must be between 2 and 100 characters');
        }
      }
      
      // Check for duplicates
      const uniqueCourses = new Set(data.relevantCourses.map(c => c.trim().toLowerCase()));
      if (uniqueCourses.size !== data.relevantCourses.length) {
        throw new Error('Relevant courses cannot contain duplicates');
      }
    }
  }

  /**
   * Checks if this is a current education (still in progress)
   */
  isCurrent(): boolean {
    // If graduation date is more than 6 months in the future, consider it current
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const graduationYear = this._graduationDate.year;
    const graduationMonth = this._graduationDate.month;
    
    // Check if graduation is more than 6 months away
    let monthsDiff = (graduationYear - currentYear) * 12;
    monthsDiff += graduationMonth - currentMonth;
    
    return monthsDiff > 6;
  }

  /**
   * Gets the time since graduation in years
   */
  getYearsSinceGraduation(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let years = currentYear - this._graduationDate.year;
    
    // Adjust if current month is before graduation month
    if (currentMonth < this._graduationDate.month) {
      years -= 1;
    }
    
    return Math.max(0, years);
  }

  /**
   * Formats GPA as string
   */
  formatGpa(): string | undefined {
    if (this._gpa === undefined) {
      return undefined;
    }
    
    // Format to 2 decimal places, removing trailing zeros
    return this._gpa.toFixed(2).replace(/\.?0+$/, '');
  }

  /**
   * Returns a copy of the education data
   */
  toData(): EducationData {
    return {
      degree: this._degree,
      institution: this._institution,
      location: this._location,
      graduationDate: this._graduationDate,
      gpa: this._gpa,
      honors: this._honors ? [...this._honors] : undefined,
      relevantCourses: this._relevantCourses ? [...this._relevantCourses] : undefined
    };
  }

  /**
   * Creates a new Education with updated data (immutable)
   */
  withUpdates(updates: Partial<EducationData>): Education {
    const newData = { ...this.toData(), ...updates };
    return new Education(newData);
  }

  /**
   * Checks equality with another Education
   */
  equals(other: Education): boolean {
    return this._degree === other._degree &&
           this._institution === other._institution &&
           this._location === other._location &&
           this._graduationDate.equals(other._graduationDate) &&
           this._gpa === other._gpa &&
           JSON.stringify(this._honors) === JSON.stringify(other._honors) &&
           JSON.stringify(this._relevantCourses) === JSON.stringify(other._relevantCourses);
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const gpaStr = this._gpa !== undefined ? ` (GPA: ${this.formatGpa()})` : '';
    return `${this._degree} - ${this._institution}${gpaStr}`;
  }
}
