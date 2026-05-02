/**
 * Scoring Module Interface
 * 
 * Defines the contract for pluggable ATS scoring modules.
 * Each module analyzes a specific aspect of resume ATS compatibility.
 */

import type { ATSIssue, Recommendation, IssueCategory } from '../models/ats-score.js';
import type { Resume } from '../models/resume.js';

export type ScoringResult = {
  score: number;
  maxScore: number;
  issues: Array<ATSIssue>;
  recommendations: Array<Recommendation>;
  details: Record<string, any>;
}

export type ScoringContext = {
  resume: Resume;
  jobDescription?: string;
  industry?: string;
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  customRules?: Record<string, any>;
}

export type IScoringModule = {
  /**
   * Unique identifier for the scoring module
   */
  readonly id: string;

  /**
   * Human-readable name of the scoring module
   */
  readonly name: string;

  /**
   * Description of what this module analyzes
   */
  readonly description: string;

  /**
   * Category this module belongs to
   */
  readonly category: IssueCategory;

  /**
   * Maximum possible score for this module
   */
  readonly maxScore: number;

  /**
   * Weight of this module in the overall score calculation
   */
  readonly weight: number;

  /**
   * Analyzes the resume and returns scoring results
   */
  analyze(context: ScoringContext): Promise<ScoringResult>;

  /**
   * Validates that the module can analyze the given resume
   */
  canAnalyze(resume: Resume): boolean;

  /**
   * Gets the module version
   */
  getVersion(): string;

  /**
   * Gets configuration options for this module
   */
  getConfiguration(): Record<string, any>;

  /**
   * Updates module configuration
   */
  updateConfiguration(config: Record<string, any>): void;
}

export type ScoringModuleFactory = {
  /**
   * Creates a new instance of the scoring module
   */
  createModule(config?: Record<string, any>): IScoringModule;

  /**
   * Gets the module metadata
   */
  getMetadata(): {
    id: string;
    name: string;
    description: string;
    category: IssueCategory;
    maxScore: number;
    weight: number;
    version: string;
  };
}

export type ScoringModuleRegistry = {
  /**
   * Registers a scoring module
   */
  registerModule(module: IScoringModule): void;

  /**
   * Unregisters a scoring module
   */
  unregisterModule(moduleId: string): void;

  /**
   * Gets a scoring module by ID
   */
  getModule(moduleId: string): IScoringModule | undefined;

  /**
   * Gets all registered modules
   */
  getAllModules(): Array<IScoringModule>;

  /**
   * Gets modules by category
   */
  getModulesByCategory(category: IssueCategory): Array<IScoringModule>;

  /**
   * Gets the total possible score across all modules
   */
  getTotalMaxScore(): number;

  /**
   * Validates that all modules are properly configured
   */
  validateModules(): { valid: boolean; errors: Array<string> };
}
