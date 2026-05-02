/**
 * SkillCategory Value Object
 * 
 * Represents a categorized grouping of skills with validation for category name and skills array.
 * Enforces business rules for skill categorization.
 */

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type SkillCategoryData = {
  category: string;
  skills: Array<string>;
  proficiencyLevel?: ProficiencyLevel;
}

export class SkillCategory {
  private readonly _category: string;
  private readonly _skills: Array<string>;
  private readonly _proficiencyLevel?: ProficiencyLevel;

  constructor(data: SkillCategoryData) {
    this.validateData(data);
    
    this._category = data.category;
    this._skills = [...data.skills]; // Create a copy to ensure immutability
    this._proficiencyLevel = data.proficiencyLevel;
  }

  // Getters
  get category(): string { return this._category; }
  get skills(): Array<string> { return [...this._skills]; } // Return copy to maintain immutability
  get proficiencyLevel(): ProficiencyLevel | undefined { return this._proficiencyLevel; }

  /**
   * Validates skill category data according to business rules
   */
  private validateData(data: SkillCategoryData): void {
    // Category validation
    if (!data.category || data.category.trim().length < 2 || data.category.trim().length > 50) {
      throw new Error('Category name must be between 2 and 50 characters');
    }

    // Skills validation
    if (!data.skills || data.skills.length < 1) {
      throw new Error('Must have at least 1 skill in the category');
    }

    // Validate each skill
    for (const skill of data.skills) {
      if (!skill.trim() || skill.trim().length < 2 || skill.trim().length > 50) {
        throw new Error('Each skill must be between 2 and 50 characters');
      }
    }

    // Check for duplicate skills within the category
    const uniqueSkills = new Set(data.skills.map(s => s.trim().toLowerCase()));
    if (uniqueSkills.size !== data.skills.length) {
      throw new Error('Skills cannot contain duplicates within the same category');
    }

    // Validate proficiency level if provided
    if (data.proficiencyLevel) {
      const validLevels: Array<ProficiencyLevel> = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (!validLevels.includes(data.proficiencyLevel)) {
        throw new Error(`Proficiency level must be one of: ${validLevels.join(', ')}`);
      }
    }
  }

  /**
   * Gets the number of skills in this category
   */
  getSkillCount(): number {
    return this._skills.length;
  }

  /**
   * Checks if a skill exists in this category (case-insensitive)
   */
  hasSkill(skillName: string): boolean {
    return this._skills.some(skill => 
      skill.trim().toLowerCase() === skillName.trim().toLowerCase()
    );
  }

  /**
   * Gets skills as a comma-separated string
   */
  getSkillsAsString(): string {
    return this._skills.join(', ');
  }

  /**
   * Gets skills formatted for display (e.g., "JavaScript, Python, TypeScript")
   */
  getFormattedSkills(): string {
    return this._skills.join(', ');
  }

  /**
   * Gets proficiency level as a display string
   */
  getProficiencyDisplay(): string | undefined {
    if (!this._proficiencyLevel) {
      return undefined;
    }

    const proficiencyMap: Record<ProficiencyLevel, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert'
    };

    return proficiencyMap[this._proficiencyLevel];
  }

  /**
   * Returns a copy of the skill category data
   */
  toData(): SkillCategoryData {
    return {
      category: this._category,
      skills: [...this._skills],
      proficiencyLevel: this._proficiencyLevel
    };
  }

  /**
   * Creates a new SkillCategory with updated data (immutable)
   */
  withUpdates(updates: Partial<SkillCategoryData>): SkillCategory {
    const newData = { ...this.toData(), ...updates };
    return new SkillCategory(newData);
  }

  /**
   * Adds a skill to the category (returns new instance)
   */
  addSkill(skill: string): SkillCategory {
    const newSkills = [...this._skills, skill];
    return new SkillCategory({
      category: this._category,
      skills: newSkills,
      proficiencyLevel: this._proficiencyLevel
    });
  }

  /**
   * Removes a skill from the category (returns new instance)
   */
  removeSkill(skillName: string): SkillCategory {
    const newSkills = this._skills.filter(skill => 
      skill.trim().toLowerCase() !== skillName.trim().toLowerCase()
    );
    
    if (newSkills.length === 0) {
      throw new Error('Cannot remove the last skill from a category');
    }
    
    return new SkillCategory({
      category: this._category,
      skills: newSkills,
      proficiencyLevel: this._proficiencyLevel
    });
  }

  /**
   * Checks equality with another SkillCategory
   */
  equals(other: SkillCategory): boolean {
    return this._category === other._category &&
           this._proficiencyLevel === other._proficiencyLevel &&
           JSON.stringify(this._skills) === JSON.stringify(other._skills);
  }

  /**
   * Returns string representation
   */
  toString(): string {
    const proficiencyStr = this._proficiencyLevel ? ` (${this.getProficiencyDisplay()})` : '';
    return `${this._category}: ${this.getSkillsAsString()}${proficiencyStr}`;
  }
}
