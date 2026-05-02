/**
 * Certification Value Object
 * 
 * Represents a professional certification or license with validation for dates, URLs, etc.
 * Enforces business rules for certification data.
 */

import type { DatePeriod } from './date-period.js';

export type CertificationData = {
  name: string;
  issuer: string;
  issueDate: DatePeriod;
  expiryDate?: DatePeriod;
  credentialId?: string;
  url?: string;
}

export class Certification {
  private readonly _name: string;
  private readonly _issuer: string;
  private readonly _issueDate: DatePeriod;
  private readonly _expiryDate?: DatePeriod;
  private readonly _credentialId?: string;
  private readonly _url?: string;

  constructor(data: CertificationData) {
    this.validateData(data);
    
    this._name = data.name;
    this._issuer = data.issuer;
    this._issueDate = data.issueDate;
    this._expiryDate = data.expiryDate;
    this._credentialId = data.credentialId;
    this._url = data.url;
  }

  // Getters
  get name(): string { return this._name; }
  get issuer(): string { return this._issuer; }
  get issueDate(): DatePeriod { return this._issueDate; }
  get expiryDate(): DatePeriod | undefined { return this._expiryDate; }
  get credentialId(): string | undefined { return this._credentialId; }
  get url(): string | undefined { return this._url; }

  /**
   * Validates certification data according to business rules
   */
  private validateData(data: CertificationData): void {
    // Name validation
    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 150) {
      throw new Error('Certification name must be between 2 and 150 characters');
    }

    // Issuer validation
    if (!data.issuer || data.issuer.trim().length < 2 || data.issuer.trim().length > 150) {
      throw new Error('Issuer name must be between 2 and 150 characters');
    }

    // Issue date validation
    if (data.issueDate.isFuture()) {
      throw new Error('Issue date cannot be in the future');
    }

    // Expiry date validation
    if (data.expiryDate) {
      if (data.expiryDate.isBefore(data.issueDate)) {
        throw new Error('Expiry date must be after issue date');
      }
      
      if (data.expiryDate.isFuture()) {
        // Allow future expiry dates (certifications that will expire)
      }
    }

    // Credential ID validation
    if (data.credentialId && (data.credentialId.trim().length < 2 || data.credentialId.trim().length > 100)) {
      throw new Error('Credential ID must be between 2 and 100 characters');
    }

    // URL validation (must be HTTPS)
    if (data.url) {
      this.validateHttpsUrl(data.url);
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
   * Checks if the certification is currently valid
   */
  isCurrentlyValid(): boolean {
    if (!this._expiryDate) {
      // No expiry date means it's valid indefinitely
      return true;
    }
    
    return !this._expiryDate.isPast();
  }

  /**
   * Checks if the certification has expired
   */
  isExpired(): boolean {
    if (!this._expiryDate) {
      return false; // No expiry date means it never expires
    }
    
    return this._expiryDate.isPast();
  }

  /**
   * Gets the validity status as a string
   */
  getValidityStatus(): 'valid' | 'expired' | 'expiring_soon' | 'no_expiry' {
    if (!this._expiryDate) {
      return 'no_expiry';
    }
    
    if (this.isExpired()) {
      return 'expired';
    }
    
    // Check if expiring within 3 months
    const now = new Date();
    const expiryDate = new Date(this._expiryDate.year, this._expiryDate.month - 1);
    const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3);
    
    if (expiryDate <= threeMonthsFromNow) {
      return 'expiring_soon';
    }
    
    return 'valid';
  }

  /**
   * Gets the age of the certification in months
   */
  getAgeInMonths(): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    let months = (currentYear - this._issueDate.year) * 12;
    months += currentMonth - this._issueDate.month;
    
    return Math.max(0, months);
  }

  /**
   * Gets the age as a human-readable string
   */
  getAgeString(): string {
    const months = this.getAgeInMonths();
    
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''} old`;
    }
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''} old`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} old`;
  }

  /**
   * Returns a copy of the certification data
   */
  toData(): CertificationData {
    return {
      name: this._name,
      issuer: this._issuer,
      issueDate: this._issueDate,
      expiryDate: this._expiryDate,
      credentialId: this._credentialId,
      url: this._url
    };
  }

  /**
   * Creates a new Certification with updated data (immutable)
   */
  withUpdates(updates: Partial<CertificationData>): Certification {
    const newData = { ...this.toData(), ...updates };
    return new Certification(newData);
  }

  /**
   * Checks equality with another Certification
   */
  equals(other: Certification): boolean {
    return this._name === other._name &&
           this._issuer === other._issuer &&
           this._issueDate.equals(other._issueDate) &&
           ((!this._expiryDate && !other._expiryDate) || (this._expiryDate?.equals(other._expiryDate!) ?? false)) &&
           this._credentialId === other._credentialId &&
           this._url === other._url;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const expiryStr = this._expiryDate ? ` (expires ${this._expiryDate.formatMMYYYY()})` : '';
    return `${this._name} - ${this._issuer}${expiryStr}`;
  }
}
