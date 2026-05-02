/**
 * ContactInfo Value Object
 * 
 * Represents contact information for a resume with validation for email, phone, and URLs.
 * Immutable value object that enforces business rules for contact data.
 */

export type ContactInfoData = {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
}

export class ContactInfo {
  private readonly _fullName: string;
  private readonly _email: string;
  private readonly _phone: string;
  private readonly _location?: string;
  private readonly _linkedin?: string;
  private readonly _github?: string;
  private readonly _portfolio?: string;
  private readonly _website?: string;

  constructor(data: ContactInfoData) {
    this.validateData(data);
    
    this._fullName = data.fullName;
    this._email = data.email;
    this._phone = data.phone;
    this._location = data.location;
    this._linkedin = data.linkedin;
    this._github = data.github;
    this._portfolio = data.portfolio;
    this._website = data.website;
  }

  // Getters
  get fullName(): string { return this._fullName; }
  get email(): string { return this._email; }
  get phone(): string { return this._phone; }
  get location(): string | undefined { return this._location; }
  get linkedin(): string | undefined { return this._linkedin; }
  get github(): string | undefined { return this._github; }
  get portfolio(): string | undefined { return this._portfolio; }
  get website(): string | undefined { return this._website; }

  /**
   * Validates all contact information according to business rules
   */
  private validateData(data: ContactInfoData): void {
    // Full name validation
    if (!data.fullName || data.fullName.trim().length < 2 || data.fullName.trim().length > 100) {
      throw new Error('Full name must be between 2 and 100 characters');
    }

    // Email validation (RFC 5322 format)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!data.email || !emailRegex.test(data.email)) {
      throw new Error('Email must be a valid RFC 5322 format');
    }

    // Phone validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
      throw new Error('Phone must be in E.164 format (e.g., +12345678901)');
    }

    // URL validations (all must be HTTPS)
    if (data.linkedin) {
      this.validateLinkedInUrl(data.linkedin);
    }
    if (data.github) {
      this.validateGitHubUrl(data.github);
    }
    if (data.portfolio) {
      this.validateHttpsUrl(data.portfolio, 'Portfolio');
    }
    if (data.website) {
      this.validateHttpsUrl(data.website, 'Website');
    }
  }

  /**
   * Validates LinkedIn URL format
   */
  private validateLinkedInUrl(url: string): void {
    const linkedinRegex = /^https:\/\/linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    if (!linkedinRegex.test(url)) {
      throw new Error('LinkedIn URL must match pattern: https://linkedin.com/in/[username]');
    }
  }

  /**
   * Validates GitHub URL format
   */
  private validateGitHubUrl(url: string): void {
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/?$/;
    if (!githubRegex.test(url)) {
      throw new Error('GitHub URL must match pattern: https://github.com/[username]');
    }
  }

  /**
   * Validates HTTPS URL format
   */
  private validateHttpsUrl(url: string, fieldName: string): void {
    const httpsRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/;
    if (!httpsRegex.test(url)) {
      throw new Error(`${fieldName} URL must be a valid HTTPS URL`);
    }
  }

  /**
   * Returns a copy of the contact info data
   */
  toData(): ContactInfoData {
    return {
      fullName: this._fullName,
      email: this._email,
      phone: this._phone,
      location: this._location,
      linkedin: this._linkedin,
      github: this._github,
      portfolio: this._portfolio,
      website: this._website
    };
  }

  /**
   * Creates a new ContactInfo with updated data (immutable)
   */
  withUpdates(updates: Partial<ContactInfoData>): ContactInfo {
    const newData = { ...this.toData(), ...updates };
    return new ContactInfo(newData);
  }

  /**
   * Checks equality with another ContactInfo
   */
  equals(other: ContactInfo): boolean {
    return this._fullName === other._fullName &&
           this._email === other._email &&
           this._phone === other._phone &&
           this._location === other._location &&
           this._linkedin === other._linkedin &&
           this._github === other._github &&
           this._portfolio === other._portfolio &&
           this._website === other._website;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return `ContactInfo(${this._fullName}, ${this._email})`;
  }
}
