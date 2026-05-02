/**
 * Template Entity
 * 
 * Defines a resume template with styling and structure configuration.
 * Represents template metadata and configuration for document generation.
 */

export type TemplateCategory = 'professional' | 'modern' | 'creative' | 'academic' | 'technical';
export type FormalityLevel = 'formal' | 'business' | 'casual';

export type SectionConfig = {
  name: string;
  required: boolean;
  order: number;
  heading: string;
  description?: string;
}

export type TemplateData = {
  id: string;
  name: string;
  version: string;
  description: string;
  category: TemplateCategory;
  industryFocus: Array<string>;
  formalityLevel: FormalityLevel;
  sections: Array<SectionConfig>;
  features: Array<string>;
  docxPath: string;
  htmlPath?: string;
  previewPath?: string;
  cssPath?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Template {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _version: string;
  private readonly _description: string;
  private readonly _category: TemplateCategory;
  private readonly _industryFocus: Array<string>;
  private readonly _formalityLevel: FormalityLevel;
  private readonly _sections: Array<SectionConfig>;
  private readonly _features: Array<string>;
  private readonly _docxPath: string;
  private readonly _htmlPath?: string;
  private readonly _previewPath?: string;
  private readonly _cssPath?: string;
  private readonly _isActive: boolean;
  private readonly _createdAt: Date;
  private readonly _updatedAt: Date;

  constructor(data: TemplateData) {
    this.validateData(data);
    
    this._id = data.id;
    this._name = data.name;
    this._version = data.version;
    this._description = data.description;
    this._category = data.category;
    this._industryFocus = [...data.industryFocus];
    this._formalityLevel = data.formalityLevel;
    this._sections = [...data.sections];
    this._features = [...data.features];
    this._docxPath = data.docxPath;
    this._htmlPath = data.htmlPath;
    this._previewPath = data.previewPath;
    this._cssPath = data.cssPath;
    this._isActive = data.isActive;
    this._createdAt = data.createdAt || new Date();
    this._updatedAt = data.updatedAt || new Date();
  }

  // Getters
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get version(): string { return this._version; }
  get description(): string { return this._description; }
  get category(): TemplateCategory { return this._category; }
  get industryFocus(): Array<string> { return [...this._industryFocus]; }
  get formalityLevel(): FormalityLevel { return this._formalityLevel; }
  get sections(): Array<SectionConfig> { return [...this._sections]; }
  get features(): Array<string> { return [...this._features]; }
  get docxPath(): string { return this._docxPath; }
  get htmlPath(): string | undefined { return this._htmlPath; }
  get previewPath(): string | undefined { return this._previewPath; }
  get cssPath(): string | undefined { return this._cssPath; }
  get isActive(): boolean { return this._isActive; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  /**
   * Validates template data according to business rules
   */
  private validateData(data: TemplateData): void {
    // ID validation (must be kebab-case)
    if (!data.id || !this.isKebabCase(data.id)) {
      throw new Error('Template ID must be in kebab-case format (e.g., "professional-classic")');
    }

    // Name validation
    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 100) {
      throw new Error('Template name must be between 2 and 100 characters');
    }

    // Version validation (must be semver)
    if (!this.isValidSemver(data.version)) {
      throw new Error('Version must follow semantic versioning format (e.g., "1.0.0")');
    }

    // Description validation
    if (!data.description || data.description.trim().length < 10 || data.description.trim().length > 500) {
      throw new Error('Template description must be between 10 and 500 characters');
    }

    // Industry focus validation
    if (!data.industryFocus || data.industryFocus.length === 0) {
      throw new Error('Template must target at least one industry');
    }

    for (const industry of data.industryFocus) {
      if (!industry.trim() || industry.trim().length < 2) {
        throw new Error('Each industry focus must be at least 2 characters');
      }
    }

    // Sections validation
    this.validateSections(data.sections);

    // Features validation
    if (data.features) {
      for (const feature of data.features) {
        if (!feature.trim() || feature.trim().length < 2) {
          throw new Error('Each feature must be at least 2 characters');
        }
      }
    }

    // Path validation
    if (!data.docxPath || !this.isValidFilePath(data.docxPath)) {
      throw new Error('DOCX path must be a valid file path');
    }

    if (data.htmlPath && !this.isValidFilePath(data.htmlPath)) {
      throw new Error('HTML path must be a valid file path');
    }

    if (data.previewPath && !this.isValidFilePath(data.previewPath)) {
      throw new Error('Preview path must be a valid file path');
    }

    if (data.cssPath && !this.isValidFilePath(data.cssPath)) {
      throw new Error('CSS path must be a valid file path');
    }
  }

  /**
   * Validates sections configuration
   */
  private validateSections(sections: Array<SectionConfig>): void {
    if (!sections || sections.length === 0) {
      throw new Error('Template must have at least one section configuration');
    }

    // Check for required sections
    const requiredSections = ['contact', 'experience', 'education', 'skills'];
    const sectionNames = sections.map(s => s.name.toLowerCase());
    
    for (const required of requiredSections) {
      if (!sectionNames.includes(required)) {
        throw new Error(`Template must include required section: ${required}`);
      }
    }

    // Validate each section
    for (const section of sections) {
      if (!section.name || section.name.trim().length < 2) {
        throw new Error('Section name must be at least 2 characters');
      }

      if (typeof section.required !== 'boolean') {
        throw new Error('Section required must be a boolean');
      }

      if (!Number.isInteger(section.order) || section.order < 0) {
        throw new Error('Section order must be a non-negative integer');
      }

      if (!section.heading || section.heading.trim().length < 2) {
        throw new Error('Section heading must be at least 2 characters');
      }
    }

    // Check for duplicate section names
    const uniqueNames = new Set(sections.map(s => s.name.toLowerCase()));
    if (uniqueNames.size !== sections.length) {
      throw new Error('Section names must be unique');
    }

    // Check for duplicate order values
    const uniqueOrders = new Set(sections.map(s => s.order));
    if (uniqueOrders.size !== sections.length) {
      throw new Error('Section order values must be unique');
    }
  }

  /**
   * Validates kebab-case format
   */
  private isKebabCase(id: string): boolean {
    const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return kebabCaseRegex.test(id);
  }

  /**
   * Validates semantic version format
   */
  private isValidSemver(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Validates file path format
   */
  private isValidFilePath(path: string): boolean {
    // Basic file path validation - no empty, no relative paths with .., must have extension
    if (!path || path.trim().length === 0) {
      return false;
    }
    
    if (path.includes('..')) {
      return false;
    }
    
    return path.includes('.');
  }

  /**
   * Gets sections sorted by order
   */
  getSectionsInOrder(): Array<SectionConfig> {
    return [...this._sections].sort((a, b) => a.order - b.order);
  }

  /**
   * Gets required sections
   */
  getRequiredSections(): Array<SectionConfig> {
    return this._sections.filter(section => section.required);
  }

  /**
   * Gets optional sections
   */
  getOptionalSections(): Array<SectionConfig> {
    return this._sections.filter(section => !section.required);
  }

  /**
   * Checks if template supports a specific section
   */
  hasSection(sectionName: string): boolean {
    return this._sections.some(section => 
      section.name.toLowerCase() === sectionName.toLowerCase()
    );
  }

  /**
   * Gets section configuration by name
   */
  getSection(sectionName: string): SectionConfig | undefined {
    return this._sections.find(section => 
      section.name.toLowerCase() === sectionName.toLowerCase()
    );
  }

  /**
   * Checks if template targets a specific industry
   */
  targetsIndustry(industry: string): boolean {
    return this._industryFocus.some(focus => 
      focus.toLowerCase().includes(industry.toLowerCase()) ||
      industry.toLowerCase().includes(focus.toLowerCase())
    );
  }

  /**
   * Gets the formality level display name
   */
  getFormalityDisplay(): string {
    const formalityMap: Record<FormalityLevel, string> = {
      formal: 'Formal',
      business: 'Business Casual',
      casual: 'Casual'
    };
    
    return formalityMap[this._formalityLevel];
  }

  /**
   * Gets the category display name
   */
  getCategoryDisplay(): string {
    const categoryMap: Record<TemplateCategory, string> = {
      professional: 'Professional',
      modern: 'Modern',
      creative: 'Creative',
      academic: 'Academic',
      technical: 'Technical'
    };
    
    return categoryMap[this._category];
  }

  /**
   * Returns a copy of the template data
   */
  toData(): TemplateData {
    return {
      id: this._id,
      name: this._name,
      version: this._version,
      description: this._description,
      category: this._category,
      industryFocus: [...this._industryFocus],
      formalityLevel: this._formalityLevel,
      sections: [...this._sections],
      features: [...this._features],
      docxPath: this._docxPath,
      htmlPath: this._htmlPath,
      previewPath: this._previewPath,
      cssPath: this._cssPath,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  /**
   * Creates a new Template with updated data (immutable)
   */
  withUpdates(updates: Partial<TemplateData>): Template {
    const newData = { ...this.toData(), ...updates, updatedAt: new Date() };
    return new Template(newData);
  }

  /**
   * Checks equality with another Template
   */
  equals(other: Template): boolean {
    return this._id === other._id && this._version === other._version;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return `Template(${this._id}, ${this._category}, v${this._version})`;
  }
}
