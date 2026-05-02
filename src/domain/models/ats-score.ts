/**
 * ATSScore Entity
 * 
 * Represents ATS compatibility analysis results with score breakdown and recommendations.
 * Enforces business rules for score validation and rating calculation.
 */

export type ScoreRating = 'poor' | 'fair' | 'good' | 'excellent';
export type IssueCategory = 'formatting' | 'structure' | 'keywords' | 'compatibility' | 'readability';
export type IssueSeverity = 'critical' | 'warning' | 'info';

export type ScoreBreakdown = {
  formatting: number;  // 0-30 points
  keywords: number;    // 0-25 points
  technical: number;   // 0-25 points
  readability: number; // 0-20 points
}

export type ATSIssue = {
  category: IssueCategory;
  severity: IssueSeverity;
  description: string;
  location?: string;
  impact: number;
}

export type Recommendation = {
  title: string;
  description: string;
  category: IssueCategory;
  potentialGain: number;
  priority: 'high' | 'medium' | 'low';
}

export type ATSScoreData = {
  resumeId: string;
  timestamp: Date;
  score: number;
  rating: ScoreRating;
  breakdown: ScoreBreakdown;
  issues: Array<ATSIssue>;
  recommendations: Array<Recommendation>;
  analyzerVersion: string;
}

export class ATSScore {
  private readonly _resumeId: string;
  private readonly _timestamp: Date;
  private readonly _score: number;
  private readonly _rating: ScoreRating;
  private readonly _breakdown: ScoreBreakdown;
  private readonly _issues: Array<ATSIssue>;
  private readonly _recommendations: Array<Recommendation>;
  private readonly _analyzerVersion: string;

  constructor(data: ATSScoreData) {
    this.validateData(data);
    
    this._resumeId = data.resumeId;
    this._timestamp = data.timestamp;
    this._score = data.score;
    this._rating = data.rating;
    this._breakdown = { ...data.breakdown };
    this._issues = [...data.issues];
    this._recommendations = [...data.recommendations];
    this._analyzerVersion = data.analyzerVersion;
  }

  // Getters
  get resumeId(): string { return this._resumeId; }
  get timestamp(): Date { return this._timestamp; }
  get score(): number { return this._score; }
  get totalScore(): number { return this._score; } // Alias for compatibility
  get rating(): ScoreRating { return this._rating; }
  get breakdown(): ScoreBreakdown { return { ...this._breakdown }; }
  get issues(): Array<ATSIssue> { return [...this._issues]; }
  get recommendations(): Array<Recommendation> { return [...this._recommendations]; }
  get analyzerVersion(): string { return this._analyzerVersion; }
  get analyzedAt(): Date { return this._timestamp; } // Alias for compatibility
  get detailLevel(): string { return 'comprehensive'; } // Default detail level

  /**
   * Validates ATS score data according to business rules
   */
  private validateData(data: ATSScoreData): void {
    // Score validation (0-100)
    if (!Number.isInteger(data.score) || data.score < 0 || data.score > 100) {
      throw new Error('Score must be an integer between 0 and 100');
    }

    // Rating validation
    const validRatings: Array<ScoreRating> = ['poor', 'fair', 'good', 'excellent'];
    if (!validRatings.includes(data.rating)) {
      throw new Error(`Rating must be one of: ${validRatings.join(', ')}`);
    }

    // Rating must match score range
    const expectedRating = this.calculateRatingFromScore(data.score);
    if (data.rating !== expectedRating) {
      throw new Error(`Rating '${data.rating}' does not match score ${data.score}. Expected: '${expectedRating}'`);
    }

    // Breakdown validation
    this.validateBreakdown(data.breakdown, data.score);

    // Issues validation
    this.validateIssues(data.issues);

    // Recommendations validation
    this.validateRecommendations(data.recommendations);

    // Analyzer version validation
    if (!data.analyzerVersion || data.analyzerVersion.trim().length === 0) {
      throw new Error('Analyzer version is required');
    }
  }

  /**
   * Validates score breakdown
   */
  private validateBreakdown(breakdown: ScoreBreakdown, totalScore: number): void {
    const { formatting, keywords, technical, readability } = breakdown;

    // Individual score ranges
    if (formatting < 0 || formatting > 30) {
      throw new Error('Formatting score must be between 0 and 30');
    }
    if (keywords < 0 || keywords > 25) {
      throw new Error('Keywords score must be between 0 and 25');
    }
    if (technical < 0 || technical > 25) {
      throw new Error('Technical score must be between 0 and 25');
    }
    if (readability < 0 || readability > 20) {
      throw new Error('Readability score must be between 0 and 20');
    }

    // Breakdown must sum to total score
    const breakdownSum = formatting + keywords + technical + readability;
    if (breakdownSum !== totalScore) {
      throw new Error(`Breakdown scores sum to ${breakdownSum}, but total score is ${totalScore}`);
    }
  }

  /**
   * Validates issues array
   */
  private validateIssues(issues: Array<ATSIssue>): void {
    for (const issue of issues) {
      // Category validation
      const validCategories: Array<IssueCategory> = ['formatting', 'structure', 'keywords', 'compatibility', 'readability'];
      if (!validCategories.includes(issue.category)) {
        throw new Error(`Issue category must be one of: ${validCategories.join(', ')}`);
      }

      // Severity validation
      const validSeverities: Array<IssueSeverity> = ['critical', 'warning', 'info'];
      if (!validSeverities.includes(issue.severity)) {
        throw new Error(`Issue severity must be one of: ${validSeverities.join(', ')}`);
      }

      // Description validation
      if (!issue.description || issue.description.trim().length < 10) {
        throw new Error('Issue description must be at least 10 characters');
      }

      // Impact validation
      if (!Number.isInteger(issue.impact) || issue.impact < 0) {
        throw new Error('Issue impact must be a non-negative integer');
      }

      // Critical issues must have significant impact
      if (issue.severity === 'critical' && issue.impact < 10) {
        throw new Error('Critical issues must have impact >= 10 points');
      }
    }
  }

  /**
   * Validates recommendations array
   */
  private validateRecommendations(recommendations: Array<Recommendation>): void {
    for (const rec of recommendations) {
      // Title validation
      if (!rec.title || rec.title.trim().length < 5) {
        throw new Error('Recommendation title must be at least 5 characters');
      }

      // Description validation
      if (!rec.description || rec.description.trim().length < 10) {
        throw new Error('Recommendation description must be at least 10 characters');
      }

      // Category validation
      const validCategories: Array<IssueCategory> = ['formatting', 'structure', 'keywords', 'compatibility', 'readability'];
      if (!validCategories.includes(rec.category)) {
        throw new Error(`Recommendation category must be one of: ${validCategories.join(', ')}`);
      }

      // Potential gain validation
      if (!Number.isInteger(rec.potentialGain) || rec.potentialGain < 0) {
        throw new Error('Recommendation potential gain must be a non-negative integer');
      }

      // Priority validation
      const validPriorities = ['high', 'medium', 'low'];
      if (!validPriorities.includes(rec.priority)) {
        throw new Error(`Recommendation priority must be one of: ${validPriorities.join(', ')}`);
      }
    }

    // Recommendations should be sorted by potential gain (descending)
    const sortedByGain = [...recommendations].sort((a, b) => b.potentialGain - a.potentialGain);
    const isSorted = recommendations.every((rec, index) => {
      const sortedRec = sortedByGain[index];
      return sortedRec ? rec.potentialGain === sortedRec.potentialGain : false;
    });
    
    if (!isSorted) {
      throw new Error('Recommendations must be sorted by potential gain (descending)');
    }
  }

  /**
   * Calculates rating from score
   */
  private calculateRatingFromScore(score: number): ScoreRating {
    if (score >= 86) return 'excellent';
    if (score >= 71) return 'good';
    if (score >= 41) return 'fair';
    return 'poor';
  }

  /**
   * Gets critical issues
   */
  getCriticalIssues(): Array<ATSIssue> {
    return this._issues.filter(issue => issue.severity === 'critical');
  }

  /**
   * Gets warning issues
   */
  getWarningIssues(): Array<ATSIssue> {
    return this._issues.filter(issue => issue.severity === 'warning');
  }

  /**
   * Gets info issues
   */
  getInfoIssues(): Array<ATSIssue> {
    return this._issues.filter(issue => issue.severity === 'info');
  }

  /**
   * Gets issues by category
   */
  getIssuesByCategory(category: IssueCategory): Array<ATSIssue> {
    return this._issues.filter(issue => issue.category === category);
  }

  /**
   * Gets high priority recommendations
   */
  getHighPriorityRecommendations(): Array<Recommendation> {
    return this._recommendations.filter(rec => rec.priority === 'high');
  }

  /**
   * Gets recommendations by category
   */
  getRecommendationsByCategory(category: IssueCategory): Array<Recommendation> {
    return this._recommendations.filter(rec => rec.category === category);
  }

  /**
   * Gets the total potential improvement
   */
  getTotalPotentialImprovement(): number {
    return this._recommendations.reduce((total, rec) => total + rec.potentialGain, 0);
  }

  /**
   * Gets the maximum possible score after implementing all recommendations
   */
  getMaximumPossibleScore(): number {
    return Math.min(100, this._score + this.getTotalPotentialImprovement());
  }

  /**
   * Gets the score percentage
   */
  getScorePercentage(): number {
    return this._score;
  }

  /**
   * Gets the score as a fraction (0.0 to 1.0)
   */
  getScoreFraction(): number {
    return this._score / 100;
  }

  /**
   * Gets the rating display name
   */
  getRatingDisplay(): string {
    const ratingMap: Record<ScoreRating, string> = {
      poor: 'Poor',
      fair: 'Fair',
      good: 'Good',
      excellent: 'Excellent'
    };
    
    return ratingMap[this._rating];
  }

  /**
   * Checks if the score is above a threshold
   */
  isAboveThreshold(threshold: number): boolean {
    return this._score >= threshold;
  }

  /**
   * Returns a copy of the ATS score data
   */
  toData(): ATSScoreData {
    return {
      resumeId: this._resumeId,
      timestamp: this._timestamp,
      score: this._score,
      rating: this._rating,
      breakdown: { ...this._breakdown },
      issues: [...this._issues],
      recommendations: [...this._recommendations],
      analyzerVersion: this._analyzerVersion
    };
  }

  /**
   * Creates a new ATSScore with updated data (immutable)
   */
  withUpdates(updates: Partial<ATSScoreData>): ATSScore {
    const newData = { ...this.toData(), ...updates };
    return new ATSScore(newData);
  }

  /**
   * Checks equality with another ATSScore
   */
  equals(other: ATSScore): boolean {
    return this._resumeId === other._resumeId &&
           this._timestamp.getTime() === other._timestamp.getTime() &&
           this._score === other._score;
  }

  /**
   * Returns string representation
   */
  toString(): string {
    return `ATSScore(${this._resumeId}, ${this._score}/100 ${this._rating}, ${this._issues.length} issues)`;
  }
}
