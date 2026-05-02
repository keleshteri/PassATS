/**
 * Award Value Object
 * 
 * Represents an award or honor received with validation for title, issuer, date, etc.
 * Enforces business rules for award data.
 */

import type { DatePeriod } from './date-period.js';

export type AwardData = {
  title: string;
  issuer: string;
  date: DatePeriod;
  description?: string;
}

export class Award {
  private readonly _title: string;
  private readonly _issuer: string;
  private readonly _date: DatePeriod;
  private readonly _description?: string;

  constructor(data: AwardData) {
    this.validateData(data);
    
    this._title = data.title;
    this._issuer = data.issuer;
    this._date = data.date;
    this._description = data.description;
  }

  // Getters
  get title(): string { return this._title; }
  get issuer(): string { return this._issuer; }
  get date(): DatePeriod { return this._date; }
  get description(): string | undefined { return this._description; }

  /**
   * Validates award data according to business rules
   */
  private validateData(data: AwardData): void {
    // Title validation
    if (!data.title || data.title.trim().length < 2 || data.title.trim().length > 150) {
      throw new Error('Award title must be between 2 and 150 characters');
    }

    // Issuer validation
    if (!data.issuer || data.issuer.trim().length < 2 || data.issuer.trim().length > 150) {
      throw new Error('Issuer name must be between 2 and 150 characters');
    }

    // Date validation
    if (data.date.isFuture()) {
      throw new Error('Award date cannot be in the future');
    }

    // Description validation (if provided)
    if (data.description && (data.description.trim().length < 10 || data.description.trim().length > 500)) {
      throw new Error('Description must be between 10 and 500 characters');
    }
  }

  /**
   * Gets the age of the award in years
   */
  getAgeInYears(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let years = currentYear - this._date.year;
    
    // Adjust if current month is before award month
    if (currentMonth < this._date.month) {
      years -= 1;
    }
    
    return Math.max(0, years);
  }

  /**
   * Gets the age as a human-readable string
   */
  getAgeString(): string {
    const years = this.getAgeInYears();
    
    if (years === 0) {
      return 'This year';
    }
    
    if (years === 1) {
      return '1 year ago';
    }
    
    return `${years} years ago`;
  }

  /**
   * Checks if the award was received recently (within the last 2 years)
   */
  isRecent(): boolean {
    return this.getAgeInYears() <= 2;
  }

  /**
   * Gets the award significance based on age
   */
  getSignificance(): 'recent' | 'notable' | 'historical' {
    const age = this.getAgeInYears();
    
    if (age <= 2) {
      return 'recent';
    } else if (age <= 10) {
      return 'notable';
    } else {
      return 'historical';
    }
  }

  /**
   * Returns a copy of the award data
   */
  toData(): AwardData {
    return {
      title: this._title,
      issuer: this._issuer,
      date: this._date,
      description: this._description
    };
  }

  /**
   * Creates a new Award with updated data (immutable)
   */
  withUpdates(updates: Partial<AwardData>): Award {
    const newData = { ...this.toData(), ...updates };
    return new Award(newData);
  }

  /**
   * Checks equality with another Award
   */
  equals(other: Award): boolean {
    return this._title === other._title &&
           this._issuer === other._issuer &&
           this._date.equals(other._date) &&
           this._description === other._description;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return `${this._title} - ${this._issuer} (${this._date.formatMMYYYY()})`;
  }
}
