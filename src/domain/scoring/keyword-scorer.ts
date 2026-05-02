/**
 * Keyword Scorer Module
 * 
 * Analyzes resume for keyword optimization and relevance.
 * Checks for industry-specific keywords, skill density, and keyword placement.
 */

import type { IScoringModule, ScoringResult, ScoringContext } from './scoring-module.interface.js';
import type { ATSIssue, Recommendation, IssueCategory } from '../models/ats-score.js';
import type { Resume } from '../models/resume.js';

export class KeywordScorer implements IScoringModule {
  readonly id = 'keyword-scorer';
  readonly name = 'Keyword Optimization Analyzer';
  readonly description = 'Analyzes resume for keyword density, relevance, and optimization for ATS systems';
  readonly category: IssueCategory = 'keywords';
  readonly maxScore = 25;
  readonly weight = 0.25; // 25% of total score

  private config: Record<string, any> = {
    minKeywordDensity: 0.02, // 2%
    maxKeywordDensity: 0.05, // 5%
    checkIndustryKeywords: true,
    checkSkillKeywords: true,
    checkJobTitleKeywords: true,
    analyzeKeywordPlacement: true
  };

  private readonly industryKeywords: Record<string, Array<string>> = {
    technology: ['software', 'development', 'programming', 'coding', 'database', 'api', 'cloud', 'devops', 'agile', 'scrum'],
    healthcare: ['patient', 'medical', 'clinical', 'healthcare', 'treatment', 'diagnosis', 'therapy', 'nursing', 'pharmaceutical'],
    finance: ['financial', 'analysis', 'investment', 'banking', 'accounting', 'budget', 'revenue', 'profit', 'risk', 'portfolio'],
    marketing: ['marketing', 'campaign', 'brand', 'digital', 'social media', 'seo', 'analytics', 'content', 'strategy', 'engagement'],
    education: ['education', 'teaching', 'curriculum', 'student', 'learning', 'instruction', 'academic', 'research', 'assessment'],
    sales: ['sales', 'revenue', 'customer', 'client', 'prospect', 'negotiation', 'relationship', 'territory', 'quota', 'lead']
  };

  async analyze(context: ScoringContext): Promise<ScoringResult> {
    const { resume, jobDescription, industry, detailLevel } = context;
    const issues: Array<ATSIssue> = [];
    const recommendations: Array<Recommendation> = [];
    let score = this.maxScore;

    // Analyze keyword density
    const densityAnalysis = this.analyzeKeywordDensity(resume);
    issues.push(...densityAnalysis.issues);
    score -= densityAnalysis.deduction;

    // Analyze industry-specific keywords
    const industryAnalysis = this.analyzeIndustryKeywords(resume, industry);
    issues.push(...industryAnalysis.issues);
    score -= industryAnalysis.deduction;

    // Analyze skill keywords
    const skillAnalysis = this.analyzeSkillKeywords(resume);
    issues.push(...skillAnalysis.issues);
    score -= skillAnalysis.deduction;

    // Analyze job description keywords (if provided)
    if (jobDescription) {
      const jobAnalysis = this.analyzeJobDescriptionKeywords(resume, jobDescription);
      issues.push(...jobAnalysis.issues);
      score -= jobAnalysis.deduction;
    }

    // Analyze keyword placement
    const placementAnalysis = this.analyzeKeywordPlacement(resume);
    issues.push(...placementAnalysis.issues);
    score -= placementAnalysis.deduction;

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues, detailLevel, industry, jobDescription));

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      maxScore: this.maxScore,
      issues,
      recommendations,
      details: {
        keywordDensity: densityAnalysis.density,
        industryKeywordCount: industryAnalysis.keywordCount,
        skillKeywordCount: skillAnalysis.keywordCount,
        jobDescriptionMatch: jobDescription ? this.calculateJobDescriptionMatch(resume, jobDescription) : 0,
        keywordPlacementScore: this.maxScore - placementAnalysis.deduction
      }
    };
  }

  canAnalyze(resume: Resume): boolean {
    return resume.skills.length > 0 && resume.experience.length > 0;
  }

  getVersion(): string {
    return '1.0.0';
  }

  getConfiguration(): Record<string, any> {
    return { ...this.config };
  }

  updateConfiguration(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }

  private analyzeKeywordDensity(resume: Resume): { issues: Array<ATSIssue>; deduction: number; density: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    const fullText = resume.getFullText().toLowerCase();
    const words = fullText.split(/\s+/).filter(word => word.length > 2);
    const totalWords = words.length;

    // Extract all skills as keywords
    const allSkills: Array<string> = [];
    for (const skillCategory of resume.skills) {
      allSkills.push(...skillCategory.skills.map(skill => skill.toLowerCase()));
    }

    // Calculate keyword density
    let keywordCount = 0;
    for (const skill of allSkills) {
      const skillWords = skill.split(/\s+/);
      for (const word of skillWords) {
        if (word.length > 2) {
          keywordCount += (fullText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
        }
      }
    }

    const density = totalWords > 0 ? keywordCount / totalWords : 0;

    // Check density thresholds
    if (density < this.config.minKeywordDensity) {
      issues.push({
        category: 'keywords',
        severity: 'warning',
        description: `Low keyword density (${(density * 100).toFixed(1)}%). Consider including more relevant skills and keywords.`,
        impact: 5
      });
      deduction += 5;
    } else if (density > this.config.maxKeywordDensity) {
      issues.push({
        category: 'keywords',
        severity: 'warning',
        description: `High keyword density (${(density * 100).toFixed(1)}%). May appear as keyword stuffing to ATS systems.`,
        impact: 3
      });
      deduction += 3;
    }

    return { issues, deduction, density };
  }

  private analyzeIndustryKeywords(resume: Resume, industry?: string): { issues: Array<ATSIssue>; deduction: number; keywordCount: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;
    let keywordCount = 0;

    if (!industry) {
      return { issues, deduction, keywordCount };
    }

    const industryKey = industry.toLowerCase();
    const keywords = this.industryKeywords[industryKey] || [];
    
    if (keywords.length === 0) {
      return { issues, deduction, keywordCount };
    }

    const fullText = resume.getFullText().toLowerCase();
    
    for (const keyword of keywords) {
      if (fullText.includes(keyword)) {
        keywordCount++;
      }
    }

    const keywordRatio = keywordCount / keywords.length;

    if (keywordRatio < 0.3) {
      issues.push({
        category: 'keywords',
        severity: 'warning',
        description: `Low industry keyword coverage (${(keywordRatio * 100).toFixed(0)}%). Include more ${industry} industry terms.`,
        impact: 4
      });
      deduction += 4;
    }

    return { issues, deduction, keywordCount };
  }

  private analyzeSkillKeywords(resume: Resume): { issues: Array<ATSIssue>; deduction: number; keywordCount: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;
    let keywordCount = 0;

    // Count unique skills mentioned in experience
    const allSkills = new Set<string>();
    for (const skillCategory of resume.skills) {
      for (const skill of skillCategory.skills) {
        allSkills.add(skill.toLowerCase());
      }
    }

    const fullText = resume.getFullText().toLowerCase();
    
    for (const skill of allSkills) {
      if (fullText.includes(skill.toLowerCase())) {
        keywordCount++;
      }
    }

    const skillRatio = keywordCount / allSkills.size;

    if (skillRatio < 0.7) {
      issues.push({
        category: 'keywords',
        severity: 'warning',
        description: `Some skills listed are not mentioned in experience sections (${(skillRatio * 100).toFixed(0)}% coverage).`,
        impact: 3
      });
      deduction += 3;
    }

    return { issues, deduction, keywordCount };
  }

  private analyzeJobDescriptionKeywords(resume: Resume, jobDescription: string): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    const jobKeywords = this.extractKeywordsFromText(jobDescription);
    const resumeText = resume.getFullText().toLowerCase();
    
    let matchedKeywords = 0;
    for (const keyword of jobKeywords) {
      if (resumeText.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    }

    const matchRatio = matchedKeywords / jobKeywords.length;

    if (matchRatio < 0.4) {
      issues.push({
        category: 'keywords',
        severity: 'warning',
        description: `Low job description keyword match (${(matchRatio * 100).toFixed(0)}%). Include more relevant keywords from the job posting.`,
        impact: 6
      });
      deduction += 6;
    }

    return { issues, deduction };
  }

  private analyzeKeywordPlacement(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check if skills are mentioned in summary
    if (resume.summary) {
      const summaryText = resume.summary.toLowerCase();
      const hasSkillsInSummary = resume.skills.some(skillCategory => 
        skillCategory.skills.some(skill => summaryText.includes(skill.toLowerCase()))
      );

      if (!hasSkillsInSummary) {
        issues.push({
          category: 'keywords',
          severity: 'info',
          description: 'Consider including key skills in the professional summary for better ATS visibility.',
          impact: 2
        });
        deduction += 2;
      }
    }

    // Check if skills are mentioned in job titles
    const hasSkillsInTitles = resume.experience.some(exp => 
      resume.skills.some(skillCategory => 
        skillCategory.skills.some(skill => 
          exp.title.toLowerCase().includes(skill.toLowerCase())
        )
      )
    );

    if (!hasSkillsInTitles) {
      issues.push({
        category: 'keywords',
        severity: 'info',
        description: 'Consider including relevant skills in job titles for better keyword optimization.',
        impact: 1
      });
      deduction += 1;
    }

    return { issues, deduction };
  }

  private extractKeywordsFromText(text: string): Array<string> {
    // Simple keyword extraction - in a real implementation, you'd use more sophisticated NLP
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    // Count word frequency and return most common
    const wordCount: Record<string, number> = {};
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'];
    return stopWords.includes(word);
  }

  private calculateJobDescriptionMatch(resume: Resume, jobDescription: string): number {
    const jobKeywords = this.extractKeywordsFromText(jobDescription);
    const resumeText = resume.getFullText().toLowerCase();
    
    let matchedKeywords = 0;
    for (const keyword of jobKeywords) {
      if (resumeText.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    }

    return jobKeywords.length > 0 ? (matchedKeywords / jobKeywords.length) * 100 : 0;
  }

  private generateRecommendations(issues: Array<ATSIssue>, detailLevel: string, industry?: string, jobDescription?: string): Array<Recommendation> {
    const recommendations: Array<Recommendation> = [];

    // Group issues by type
    const keywordIssues = issues.filter(i => i.category === 'keywords');

    if (keywordIssues.length > 0) {
      recommendations.push({
        title: 'Optimize Keyword Usage',
        description: 'Improve keyword density and relevance by including more industry-specific terms and skills throughout your resume.',
        category: 'keywords',
        potentialGain: keywordIssues.reduce((sum, issue) => sum + issue.impact, 0),
        priority: 'high'
      });
    }

    if (industry) {
      recommendations.push({
        title: `Include ${industry} Industry Keywords`,
        description: `Add more ${industry}-specific terminology and industry-standard keywords to improve ATS matching.`,
        category: 'keywords',
        potentialGain: 5,
        priority: 'medium'
      });
    }

    if (jobDescription) {
      recommendations.push({
        title: 'Match Job Description Keywords',
        description: 'Review the job posting and include relevant keywords and phrases that match the requirements.',
        category: 'keywords',
        potentialGain: 6,
        priority: 'high'
      });
    }

    if (detailLevel === 'detailed' || detailLevel === 'comprehensive') {
      recommendations.push({
        title: 'Strategic Keyword Placement',
        description: 'Place important keywords in job titles, summary, and throughout experience descriptions for maximum ATS impact.',
        category: 'keywords',
        potentialGain: 3,
        priority: 'medium'
      });

      recommendations.push({
        title: 'Skill Integration',
        description: 'Ensure all listed skills are mentioned in your experience descriptions to demonstrate proficiency.',
        category: 'keywords',
        potentialGain: 3,
        priority: 'low'
      });
    }

    return recommendations.sort((a, b) => b.potentialGain - a.potentialGain);
  }
}
