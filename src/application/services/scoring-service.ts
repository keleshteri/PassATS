import { ATSScore } from '../../domain/models/ats-score.js';
import { Resume } from '../../domain/models/resume.js';
import type { IssueCategory, IssueSeverity } from '../../domain/models/ats-score.js';
import type { ATSScorer } from '../../domain/scoring/ats-scorer.js';
import type { MarkdownParser } from '../../infrastructure/parsers/markdown-parser.js';

export type DetailLevel = 'basic' | 'detailed' | 'comprehensive';

export type ScoringOptions = {
  detailLevel?: DetailLevel;
  jobDescription?: string;
  industryFocus?: string;
  includeRecommendations?: boolean;
}

export type ScoringResult = {
  score: ATSScore;
  processingTime: number;
  options: ScoringOptions;
  cacheHit?: boolean;
}

export class ScoringService {
  private readonly scoreCache = new Map<string, { score: ATSScore; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly atsScorer: ATSScorer,
    private readonly markdownParser: MarkdownParser
  ) {}

  /**
   * Analyze ATS score for resume content
   */
  async analyzeATSScore(
    markdown: string,
    options: ScoringOptions = {}
  ): Promise<ScoringResult> {
    const startTime = Date.now();
    const detailLevel = options.detailLevel || 'detailed';
    const includeRecommendations = options.includeRecommendations !== false;

    // Check cache first
    const cacheKey = this.generateCacheKey(markdown, options);
    const cachedResult = this.getCachedScore(cacheKey);
    if (cachedResult) {
      return {
        score: cachedResult,
        processingTime: Date.now() - startTime,
        options,
        cacheHit: true
      };
    }

    try {
      // Parse markdown to resume object
      const resume = await this.markdownParser.parseToResume(markdown);

      // Configure scorer based on detail level
      this.configureScorerForDetailLevel(detailLevel);

      // Analyze the resume
      const score = await this.atsScorer.analyzeResume(resume, {
        jobDescription: options.jobDescription,
        industry: options.industryFocus,
        detailLevel,
        includeRecommendations
      });

      // Cache the result
      this.setCachedScore(cacheKey, score.score);

      return {
        score: score.score,
        processingTime: Date.now() - startTime,
        options,
        cacheHit: false
      };

    } catch (error) {
      // Return a minimal score on error
      const errorScore = new ATSScore({
        resumeId: 'error',
        score: 0,
        rating: 'poor' as const,
        breakdown: {
          formatting: 0,
          keywords: 0,
          technical: 0,
          readability: 0
        },
        issues: [{
          category: 'compatibility' as IssueCategory,
          severity: 'high' as IssueSeverity,
          description: `Analysis failed: ${error}`,
          impact: 0
        }],
        recommendations: [{
          title: 'Check Resume Format',
          description: 'Please check your resume format and try again',
          category: 'compatibility' as IssueCategory,
          potentialGain: 10,
          priority: 'high' as 'high' | 'medium' | 'low'
        }],
        timestamp: new Date(),
        analyzerVersion: '1.0.0'
      });

      return {
        score: errorScore,
        processingTime: Date.now() - startTime,
        options,
        cacheHit: false
      };
    }
  }

  /**
   * Compare multiple resumes for ATS optimization
   */
  async compareResumes(
    resumes: Array<{ name: string; content: string }>,
    options: ScoringOptions = {}
  ): Promise<{
    comparisons: Array<{
      name: string;
      score: ATSScore;
      rank: number;
    }>;
    bestResume: string;
    averageScore: number;
    processingTime: number;
  }> {
    const startTime = Date.now();

    // Analyze all resumes
    const results = await Promise.all(
      resumes.map(async (resume) => {
        const result = await this.analyzeATSScore(resume.content, options);
        return {
          name: resume.name,
          score: result.score,
          processingTime: result.processingTime
        };
      })
    );

    // Sort by total score (descending)
    results.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // Add ranking
    const comparisons = results.map((result, index) => ({
      name: result.name,
      score: result.score,
      rank: index + 1
    }));

    // Calculate statistics
    const totalScore = results.reduce((sum, result) => sum + result.score.totalScore, 0);
    const averageScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    const bestResume = results[0]?.name || '';

    return {
      comparisons,
      bestResume,
      averageScore,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Get industry-specific scoring insights
   */
  async getIndustryInsights(
    industryFocus: string,
    detailLevel: DetailLevel = 'detailed'
  ): Promise<{
    industry: string;
    commonKeywords: Array<string>;
    scoringWeights: Record<string, number>;
    recommendations: Array<string>;
    benchmarks: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  }> {
    // Configure scorer for industry
    this.configureScorerForIndustry(industryFocus);

    // Get industry-specific data from scorer
    const insights = this.atsScorer.getIndustryInsights(industryFocus);

    return {
      industry: industryFocus,
      commonKeywords: insights.keywords || [],
      scoringWeights: {
        formatting: 30,
        keywords: 25,
        technical: 25,
        readability: 20
      },
      recommendations: insights.recommendations || [
        'Use industry-specific keywords throughout your resume',
        'Quantify your achievements with numbers and metrics',
        'Include relevant technical skills and certifications',
        'Ensure your resume is ATS-friendly with proper formatting'
      ],
      benchmarks: {
        excellent: 85,
        good: 70,
        fair: 55,
        poor: 40
      }
    };
  }

  /**
   * Get scoring statistics and trends
   */
  async getScoringStats(): Promise<{
    totalAnalyses: number;
    averageScore: number;
    scoreDistribution: Record<string, number>;
    commonIssues: Array<{ issue: string; count: number }>;
    processingTimeStats: {
      average: number;
      min: number;
      max: number;
    };
  }> {
    /*
     * This would typically come from a database or analytics service
     * For now, return mock data based on cache
     */
    const cacheSize = this.scoreCache.size;
    
    return {
      totalAnalyses: cacheSize,
      averageScore: 72, // Mock average
      scoreDistribution: {
        'excellent': Math.floor(cacheSize * 0.15),
        'good': Math.floor(cacheSize * 0.35),
        'fair': Math.floor(cacheSize * 0.35),
        'poor': Math.floor(cacheSize * 0.15)
      },
      commonIssues: [
        { issue: 'Missing contact information', count: Math.floor(cacheSize * 0.3) },
        { issue: 'Poor keyword optimization', count: Math.floor(cacheSize * 0.25) },
        { issue: 'Inconsistent formatting', count: Math.floor(cacheSize * 0.2) },
        { issue: 'Missing quantifiable achievements', count: Math.floor(cacheSize * 0.15) },
        { issue: 'Too much or too little content', count: Math.floor(cacheSize * 0.1) }
      ],
      processingTimeStats: {
        average: 1250,
        min: 800,
        max: 3000
      }
    };
  }

  /**
   * Clear scoring cache
   */
  clearCache(): void {
    this.scoreCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry?: Date;
    newestEntry?: Date;
  } {
    const entries = Array.from(this.scoreCache.values());
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      size: this.scoreCache.size,
      hitRate: 0.75, // Mock hit rate
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined
    };
  }

  /**
   * Configure scorer based on detail level
   */
  private configureScorerForDetailLevel(detailLevel: DetailLevel): void {
    switch (detailLevel) {
      case 'basic':
        this.atsScorer.configure({
          includeDetailedAnalysis: false,
          includeRecommendations: false,
          maxIssues: 5,
          maxRecommendations: 3
        });
        break;
      case 'detailed':
        this.atsScorer.configure({
          includeDetailedAnalysis: true,
          includeRecommendations: true,
          maxIssues: 10,
          maxRecommendations: 8
        });
        break;
      case 'comprehensive':
        this.atsScorer.configure({
          includeDetailedAnalysis: true,
          includeRecommendations: true,
          maxIssues: 20,
          maxRecommendations: 15,
          includeIndustryAnalysis: true,
          includeBenchmarking: true
        });
        break;
    }
  }

  /**
   * Configure scorer for specific industry
   */
  private configureScorerForIndustry(industryFocus: string): void {
    // Configure industry-specific settings
    this.atsScorer.configure({
      industryFocus,
      includeIndustryKeywords: true,
      includeIndustryBenchmarks: true
    });
  }

  /**
   * Generate cache key for resume content and options
   */
  private generateCacheKey(markdown: string, options: ScoringOptions): string {
    const contentHash = this.hashString(markdown);
    const optionsHash = this.hashString(JSON.stringify(options));
    return `${contentHash}-${optionsHash}`;
  }

  /**
   * Get cached score if valid
   */
  private getCachedScore(cacheKey: string): ATSScore | null {
    const cached = this.scoreCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.scoreCache.delete(cacheKey);
      return null;
    }

    return cached.score;
  }

  /**
   * Set cached score
   */
  private setCachedScore(cacheKey: string, score: ATSScore): void {
    this.scoreCache.set(cacheKey, {
      score,
      timestamp: Date.now()
    });

    // Clean up old entries if cache gets too large
    if (this.scoreCache.size > 100) {
      const entries = Array.from(this.scoreCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 20 entries
      for (let i = 0; i < 20 && i < entries.length; i++) {
        const entry = entries[i];
        if (entry) {
          this.scoreCache.delete(entry[0]);
        }
      }
    }
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate scoring options
   */
  private validateScoringOptions(options: ScoringOptions): void {
    if (options.detailLevel && !['basic', 'detailed', 'comprehensive'].includes(options.detailLevel)) {
      throw new Error('Invalid detail level. Must be: basic, detailed, or comprehensive');
    }

    if (options.jobDescription && options.jobDescription.length > 10000) {
      throw new Error('Job description too long. Maximum 10,000 characters allowed');
    }
  }
}
