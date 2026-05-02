/**
 * DatePeriod Value Object
 * 
 * Represents a month/year period with validation and comparison methods.
 * Used for work experience dates, education graduation dates, etc.
 */

export type DatePeriodData = {
  month: number;
  year: number;
}

export class DatePeriod {
  private readonly _month: number;
  private readonly _year: number;

  constructor(data: DatePeriodData) {
    this.validateData(data);
    
    this._month = data.month;
    this._year = data.year;
  }

  // Getters
  get month(): number { return this._month; }
  get year(): number { return this._year; }

  /**
   * Validates month and year ranges
   */
  private validateData(data: DatePeriodData): void {
    // Month validation (1-12)
    if (!Number.isInteger(data.month) || data.month < 1 || data.month > 12) {
      throw new Error('Month must be an integer between 1 and 12');
    }

    // Year validation (1950-2030)
    if (!Number.isInteger(data.year) || data.year < 1950 || data.year > 2030) {
      throw new Error('Year must be an integer between 1950 and 2030');
    }
  }

  /**
   * Checks if this date is before another date
   */
  isBefore(other: DatePeriod): boolean {
    if (this._year < other._year) {
      return true;
    }
    if (this._year === other._year && this._month < other._month) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this date is after another date
   */
  isAfter(other: DatePeriod): boolean {
    if (this._year > other._year) {
      return true;
    }
    if (this._year === other._year && this._month > other._month) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this date is equal to another date
   */
  equals(other: DatePeriod): boolean {
    return this._month === other._month && this._year === other._year;
  }

  /**
   * Checks if this date is in the future (after current date)
   */
  isFuture(): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    
    if (this._year > currentYear) {
      return true;
    }
    if (this._year === currentYear && this._month > currentMonth) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this date is in the past (before current date)
   */
  isPast(): boolean {
    return !this.isFuture() && !this.equals(this.getCurrentDate());
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
   * Formats the date as MM/YYYY
   */
  formatMMYYYY(): string {
    return `${this._month.toString().padStart(2, '0')}/${this._year}`;
  }

  /**
   * Formats the date as Month YYYY
   */
  formatMonthYear(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[this._month - 1]} ${this._year}`;
  }

  /**
   * Returns a copy of the date period data
   */
  toData(): DatePeriodData {
    return {
      month: this._month,
      year: this._year
    };
  }

  /**
   * Creates a new DatePeriod with updated data (immutable)
   */
  withUpdates(updates: Partial<DatePeriodData>): DatePeriod {
    const newData = { ...this.toData(), ...updates };
    return new DatePeriod(newData);
  }

  /**
   * Formats the date (alias for formatMMYYYY for compatibility)
   */
  format(): string {
    return this.formatMMYYYY();
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return this.formatMMYYYY();
  }
}
