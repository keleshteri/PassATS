/**
 * ATS Scorer
 * 
 * Main orchestrator for ATS scoring modules with pluggable architecture.
 * Aggregates scores from individual modules and generates comprehensive analysis.
 */

import { ATSScore } from '../models/ats-score.js';
import type { IScoringModule, ScoringContext, ScoringModuleRegistry } from './scoring-module.interface.js';
import type { ATSScoreData, ScoreBreakdown, ATSIssue, Recommendation } from '../models/ats-score.js';
import type { Resume } from '../models/resume.js';

export type ATSAnalysisOptions = {
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
  jobDescription?: string;
  industry?: string;
  customRules?: Record<string, any>;
  includeRecommendations?: boolean;
  maxRecommendations?: number;
}

export type ATSAnalysisResult = {
  score: ATSScore;
  moduleResults: Record<string, any>;
  analysisTime: number;
  modulesUsed: Array<string>;
}

export class ATSScorer implements ScoringModuleRegistry {
  private readonly modules = new Map<string, IScoringModule>();
  private readonly version = '1.0.0';

  constructor() {
    this.initializeDefaultModules();
  }

  /**
   * Configures the scorer with custom settings
   */
  configure(config: Record<string, any>): void {
    // Configure individual modules if they exist
    for (const module of this.modules.values()) {
      if (module.updateConfiguration) {
        module.updateConfiguration(config);
      }
    }
  }

  /**
   * Gets industry-specific insights
   */
  getIndustryInsights(industry: string): Record<string, any> {
    const insights: Record<string, any> = {
      keywords: this.getIndustryKeywords(industry),
      bestPractices: this.getIndustryBestPractices(industry),
      commonIssues: this.getIndustryCommonIssues(industry)
    };
    return insights;
  }

  /**
   * Gets industry-specific keywords
   */
  private getIndustryKeywords(industry: string): Array<string> {
    const keywordMap: Record<string, Array<string>> = {
      technology: ['software', 'development', 'programming', 'coding', 'database', 'api', 'cloud', 'devops', 'agile', 'scrum'],
      healthcare: ['patient', 'medical', 'clinical', 'healthcare', 'treatment', 'diagnosis', 'therapy', 'nursing', 'pharmaceutical'],
      finance: ['financial', 'analysis', 'investment', 'banking', 'accounting', 'budget', 'revenue', 'profit', 'risk', 'portfolio'],
      marketing: ['marketing', 'campaign', 'brand', 'digital', 'social media', 'seo', 'analytics', 'content', 'strategy', 'engagement'],
      education: ['education', 'teaching', 'curriculum', 'student', 'learning', 'instruction', 'academic', 'research', 'assessment'],
      sales: ['sales', 'revenue', 'customer', 'client', 'prospect', 'negotiation', 'relationship', 'territory', 'quota', 'lead']
    };
    return keywordMap[industry.toLowerCase()] || [];
  }

  /**
   * Gets industry-specific best practices
   */
  private getIndustryBestPractices(industry: string): Array<string> {
    const practicesMap: Record<string, Array<string>> = {
      technology: ['Include specific programming languages and frameworks', 'Highlight technical projects and achievements', 'Show progression in technical skills'],
      healthcare: ['Emphasize patient care experience', 'Include relevant certifications and licenses', 'Highlight clinical skills and procedures'],
      finance: ['Show quantitative achievements', 'Include relevant financial certifications', 'Demonstrate analytical skills'],
      marketing: ['Include campaign results and metrics', 'Show creative portfolio examples', 'Highlight digital marketing skills'],
      education: ['Emphasize teaching experience', 'Include curriculum development', 'Show student achievement improvements'],
      sales: ['Include sales metrics and achievements', 'Show relationship building skills', 'Highlight quota attainment']
    };
    return practicesMap[industry.toLowerCase()] || [];
  }

  /**
   * Gets industry-specific common issues
   */
  private getIndustryCommonIssues(industry: string): Array<string> {
    const issuesMap: Record<string, Array<string>> = {
      technology: ['Missing technical skills section', 'Vague project descriptions', 'Outdated technologies'],
      healthcare: ['Missing certifications', 'No patient care experience', 'Outdated medical knowledge'],
      finance: ['No quantitative achievements', 'Missing financial certifications', 'Vague role descriptions'],
      marketing: ['No campaign results', 'Missing creative examples', 'No digital marketing skills'],
      education: ['No teaching experience', 'Missing curriculum development', 'No student outcomes'],
      sales: ['No sales metrics', 'Missing relationship examples', 'No quota information']
    };
    return issuesMap[industry.toLowerCase()] || [];
  }

  /**
   * Analyzes resume for ATS compatibility
   */
  async analyzeResume(resume: Resume, options: ATSAnalysisOptions = { detailLevel: 'basic' }): Promise<ATSAnalysisResult> {
    const startTime = Date.now();
    
    const context: ScoringContext = {
      resume,
      jobDescription: options.jobDescription,
      industry: options.industry,
      detailLevel: options.detailLevel || 'basic',
      customRules: options.customRules
    };

    const moduleResults: Record<string, any> = {};
    const allIssues: Array<ATSIssue> = [];
    const allRecommendations: Array<Recommendation> = [];
    const breakdown: ScoreBreakdown = {
      formatting: 0,
      keywords: 0,
      technical: 0,
      readability: 0
    };

    let totalScore = 0;
    const modulesUsed: Array<string> = [];

    // Run all registered modules
    for (const [moduleId, module] of this.modules) {
      if (module.canAnalyze(resume)) {
        try {
          const result = await module.analyze(context);
          moduleResults[moduleId] = result;
          
          // Aggregate scores based on module category
          this.aggregateScore(breakdown, module.category, result.score);
          totalScore += result.score;
          
          // Collect issues and recommendations
          allIssues.push(...result.issues);
          allRecommendations.push(...result.recommendations);
          
          modulesUsed.push(moduleId);
        } catch (error) {
          console.error(`Error analyzing with module ${moduleId}:`, error);
          // Continue with other modules
        }
      }
    }

    // Sort recommendations by potential gain
    const sortedRecommendations = allRecommendations
      .sort((a, b) => b.potentialGain - a.potentialGain)
      .slice(0, options.maxRecommendations || 10);

    // Create ATS score
    const scoreData: ATSScoreData = {
      resumeId: resume.id,
      timestamp: new Date(),
      score: totalScore,
      rating: this.calculateRating(totalScore),
      breakdown,
      issues: allIssues,
      recommendations: options.includeRecommendations !== false ? sortedRecommendations : [],
      analyzerVersion: this.version
    };

    const atsScore = new ATSScore(scoreData);
    const analysisTime = Date.now() - startTime;

    return {
      score: atsScore,
      moduleResults,
      analysisTime,
      modulesUsed
    };
  }

  /**
   * Registers a scoring module
   */
  registerModule(module: IScoringModule): void {
    this.modules.set(module.id, module);
  }

  /**
   * Unregisters a scoring module
   */
  unregisterModule(moduleId: string): void {
    this.modules.delete(moduleId);
  }

  /**
   * Gets a scoring module by ID
   */
  getModule(moduleId: string): IScoringModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Gets all registered modules
   */
  getAllModules(): Array<IScoringModule> {
    return Array.from(this.modules.values());
  }

  /**
   * Gets modules by category
   */
  getModulesByCategory(category: string): Array<IScoringModule> {
    return Array.from(this.modules.values()).filter(module => module.category === category);
  }

  /**
   * Gets the total possible score across all modules
   */
  getTotalMaxScore(): number {
    return Array.from(this.modules.values()).reduce((total, module) => total + module.maxScore, 0);
  }

  /**
   * Validates that all modules are properly configured
   */
  validateModules(): { valid: boolean; errors: Array<string> } {
    const errors: Array<string> = [];

    if (this.modules.size === 0) {
      errors.push('No scoring modules registered');
    }

    for (const [moduleId, module] of this.modules) {
      try {
        // Basic validation - check if module has required properties
        if (!module.id || !module.name || !module.category) {
          errors.push(`Module ${moduleId} is missing required properties`);
        }

        if (module.maxScore <= 0) {
          errors.push(`Module ${moduleId} has invalid maxScore: ${module.maxScore}`);
        }

        if (module.weight < 0 || module.weight > 1) {
          errors.push(`Module ${moduleId} has invalid weight: ${module.weight}`);
        }
      } catch (error) {
        errors.push(`Error validating module ${moduleId}: ${error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets scoring statistics
   */
  getScoringStats(): {
    totalModules: number;
    modulesByCategory: Record<string, number>;
    totalMaxScore: number;
    averageWeight: number;
  } {
    const modules = Array.from(this.modules.values());
    const modulesByCategory: Record<string, number> = {};
    
    for (const module of modules) {
      modulesByCategory[module.category] = (modulesByCategory[module.category] || 0) + 1;
    }

    const totalMaxScore = modules.reduce((sum, module) => sum + module.maxScore, 0);
    const averageWeight = modules.length > 0 ? 
      modules.reduce((sum, module) => sum + module.weight, 0) / modules.length : 0;

    return {
      totalModules: modules.length,
      modulesByCategory,
      totalMaxScore,
      averageWeight
    };
  }

  /**
   * Gets module configuration
   */
  getModuleConfiguration(moduleId: string): Record<string, any> | null {
    const module = this.modules.get(moduleId);
    return module ? module.getConfiguration() : null;
  }

  /**
   * Updates module configuration
   */
  updateModuleConfiguration(moduleId: string, config: Record<string, any>): boolean {
    const module = this.modules.get(moduleId);
    if (module) {
      module.updateConfiguration(config);
      return true;
    }
    return false;
  }

  /**
   * Resets all modules to default configuration
   */
  resetModuleConfigurations(): void {
    for (const module of this.modules.values()) {
      /*
       * This would need to be implemented in each module
       * For now, we'll just reinitialize default modules
       */
    }
    this.initializeDefaultModules();
  }

  /**
   * Gets the scorer version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Aggregates score from module result into breakdown
   */
  private aggregateScore(breakdown: ScoreBreakdown, category: string, score: number): void {
    switch (category) {
      case 'formatting':
        breakdown.formatting = score;
        break;
      case 'keywords':
        breakdown.keywords = score;
        break;
      case 'compatibility':
        breakdown.technical = score;
        break;
      case 'readability':
        breakdown.readability = score;
        break;
      default:
        // For unknown categories, distribute evenly or add to technical
        breakdown.technical += score;
        break;
    }
  }

  /**
   * Calculates rating from total score
   */
  private calculateRating(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score >= 86) return 'excellent';
    if (score >= 71) return 'good';
    if (score >= 41) return 'fair';
    return 'poor';
  }

  /**
   * Initializes default scoring modules
   */
  private initializeDefaultModules(): void {
    /*
     * Import and register default modules
     * Note: In a real implementation, you'd import these modules
     * For now, we'll create placeholder registrations
     */
    
    /*
     * This would typically be:
     * this.registerModule(new FormattingScorer());
     * this.registerModule(new KeywordScorer());
     * this.registerModule(new TechnicalScorer());
     * this.registerModule(new ReadabilityScorer());
     */
  }

  /**
   * Creates a quick analysis for basic scoring
   */
  async quickAnalyze(resume: Resume): Promise<{ score: number; rating: string; criticalIssues: number }> {
    const result = await this.analyzeResume(resume, {
      detailLevel: 'basic',
      includeRecommendations: false
    });

    return {
      score: result.score.score,
      rating: result.score.rating,
      criticalIssues: result.score.getCriticalIssues().length
    };
  }

  /**
   * Compares two resumes for ATS compatibility
   */
  async compareResumes(resume1: Resume, resume2: Resume, options: ATSAnalysisOptions = { detailLevel: 'basic' }): Promise<{
    resume1: ATSAnalysisResult;
    resume2: ATSAnalysisResult;
    comparison: {
      scoreDifference: number;
      betterResume: 'resume1' | 'resume2' | 'tie';
      improvementAreas: Array<string>;
    };
  }> {
    const [result1, result2] = await Promise.all([
      this.analyzeResume(resume1, options),
      this.analyzeResume(resume2, options)
    ]);

    const scoreDifference = result1.score.score - result2.score.score;
    const betterResume = scoreDifference > 0 ? 'resume1' : 
                        scoreDifference < 0 ? 'resume2' : 'tie';

    const improvementAreas: Array<string> = [];
    if (result1.score.score < result2.score.score) {
      improvementAreas.push(...result1.score.recommendations.slice(0, 3).map(r => r.title));
    } else if (result2.score.score < result1.score.score) {
      improvementAreas.push(...result2.score.recommendations.slice(0, 3).map(r => r.title));
    }

    return {
      resume1: result1,
      resume2: result2,
      comparison: {
        scoreDifference: Math.abs(scoreDifference),
        betterResume,
        improvementAreas
      }
    };
  }
}
