/**
 * Readability Scorer Module
 * 
 * Analyzes resume readability and content quality.
 * Checks for clarity, conciseness, grammar, and overall readability.
 */

import type { IScoringModule, ScoringResult, ScoringContext } from './scoring-module.interface.js';
import type { ATSIssue, Recommendation, IssueCategory } from '../models/ats-score.js';
import type { Resume } from '../models/resume.js';

export class ReadabilityScorer implements IScoringModule {
  readonly id = 'readability-scorer';
  readonly name = 'Readability & Content Quality Analyzer';
  readonly description = 'Analyzes resume readability, clarity, grammar, and overall content quality';
  readonly category: IssueCategory = 'readability';
  readonly maxScore = 20;
  readonly weight = 0.20; // 20% of total score

  private config: Record<string, any> = {
    maxSentenceLength: 25,
    minWordCount: 200,
    maxWordCount: 800,
    checkGrammar: true,
    checkClarity: true,
    checkConciseness: true,
    checkActionVerbs: true
  };

  private readonly actionVerbs = [
    'achieved', 'accomplished', 'administered', 'analyzed', 'built', 'collaborated', 'created', 'delivered',
    'designed', 'developed', 'enhanced', 'established', 'executed', 'generated', 'implemented', 'improved',
    'increased', 'initiated', 'launched', 'led', 'managed', 'optimized', 'organized', 'performed',
    'planned', 'produced', 'reduced', 'resolved', 'streamlined', 'supervised', 'transformed', 'utilized'
  ];

  private readonly weakWords = [
    'assisted', 'helped', 'supported', 'participated', 'involved', 'contributed', 'worked on', 'responsible for'
  ];

  async analyze(context: ScoringContext): Promise<ScoringResult> {
    const { resume, detailLevel } = context;
    const issues: Array<ATSIssue> = [];
    const recommendations: Array<Recommendation> = [];
    let score = this.maxScore;

    // Analyze content length
    const lengthAnalysis = this.analyzeContentLength(resume);
    issues.push(...lengthAnalysis.issues);
    score -= lengthAnalysis.deduction;

    // Analyze sentence structure
    const sentenceAnalysis = this.analyzeSentenceStructure(resume);
    issues.push(...sentenceAnalysis.issues);
    score -= sentenceAnalysis.deduction;

    // Analyze action verbs usage
    const verbAnalysis = this.analyzeActionVerbs(resume);
    issues.push(...verbAnalysis.issues);
    score -= verbAnalysis.deduction;

    // Analyze clarity and conciseness
    const clarityAnalysis = this.analyzeClarity(resume);
    issues.push(...clarityAnalysis.issues);
    score -= clarityAnalysis.deduction;

    // Analyze grammar and style
    const grammarAnalysis = this.analyzeGrammar(resume);
    issues.push(...grammarAnalysis.issues);
    score -= grammarAnalysis.deduction;

    // Generate recommendations
    recommendations.push(...this.generateRecommendations(issues, detailLevel, resume));

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      maxScore: this.maxScore,
      issues,
      recommendations,
      details: {
        wordCount: this.getWordCount(resume),
        averageSentenceLength: sentenceAnalysis.averageLength,
        actionVerbCount: verbAnalysis.actionVerbCount,
        weakWordCount: verbAnalysis.weakWordCount,
        readabilityScore: this.calculateReadabilityScore(resume)
      }
    };
  }

  canAnalyze(resume: Resume): boolean {
    return resume.experience.length > 0 && resume.getFullText().length > 50;
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

  private analyzeContentLength(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    const wordCount = this.getWordCount(resume);

    if (wordCount < this.config.minWordCount) {
      issues.push({
        category: 'readability',
        severity: 'warning',
        description: `Resume is too short (${wordCount} words). Consider adding more detail to demonstrate your experience.`,
        impact: 3
      });
      deduction += 3;
    } else if (wordCount > this.config.maxWordCount) {
      issues.push({
        category: 'readability',
        severity: 'warning',
        description: `Resume is too long (${wordCount} words). Consider condensing content for better readability.`,
        impact: 2
      });
      deduction += 2;
    }

    return { issues, deduction };
  }

  private analyzeSentenceStructure(resume: Resume): { issues: Array<ATSIssue>; deduction: number; averageLength: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    const sentences = this.extractSentences(resume);
    const totalWords = sentences.reduce((sum, sentence) => sum + sentence.split(' ').length, 0);
    const averageLength = sentences.length > 0 ? totalWords / sentences.length : 0;

    // Check for overly long sentences
    const longSentences = sentences.filter(sentence => 
      sentence.split(' ').length > this.config.maxSentenceLength
    );

    if (longSentences.length > sentences.length * 0.3) {
      issues.push({
        category: 'readability',
        severity: 'warning',
        description: `Too many long sentences (${longSentences.length}/${sentences.length}). Consider breaking them into shorter, clearer statements.`,
        impact: 3
      });
      deduction += 3;
    }

    // Check for sentence variety
    const sentenceLengths = sentences.map(s => s.split(' ').length);
    const lengthVariance = this.calculateVariance(sentenceLengths);
    
    if (lengthVariance < 5) {
      issues.push({
        category: 'readability',
        severity: 'info',
        description: 'Consider varying sentence length for better readability and flow.',
        impact: 1
      });
      deduction += 1;
    }

    return { issues, deduction, averageLength };
  }

  private analyzeActionVerbs(resume: Resume): { issues: Array<ATSIssue>; deduction: number; actionVerbCount: number; weakWordCount: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    const fullText = resume.getFullText().toLowerCase();
    let actionVerbCount = 0;
    let weakWordCount = 0;

    // Count action verbs
    for (const verb of this.actionVerbs) {
      const matches = (fullText.match(new RegExp(`\\b${verb}\\b`, 'g')) || []).length;
      actionVerbCount += matches;
    }

    // Count weak words
    for (const word of this.weakWords) {
      const matches = (fullText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      weakWordCount += matches;
    }

    // Check for sufficient action verbs
    if (actionVerbCount < 5) {
      issues.push({
        category: 'readability',
        severity: 'warning',
        description: `Low action verb usage (${actionVerbCount}). Use strong action verbs to describe your achievements.`,
        impact: 4
      });
      deduction += 4;
    }

    // Check for too many weak words
    if (weakWordCount > 3) {
      issues.push({
        category: 'readability',
        severity: 'warning',
        description: `Too many weak words (${weakWordCount}). Replace with stronger action verbs for more impact.`,
        impact: 3
      });
      deduction += 3;
    }

    return { issues, deduction, actionVerbCount, weakWordCount };
  }

  private analyzeClarity(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check for vague language
    const vagueWords = ['various', 'several', 'many', 'some', 'various', 'different', 'multiple'];
    const fullText = resume.getFullText().toLowerCase();
    
    let vagueWordCount = 0;
    for (const word of vagueWords) {
      const matches = (fullText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      vagueWordCount += matches;
    }

    if (vagueWordCount > 2) {
      issues.push({
        category: 'readability',
        severity: 'info',
        description: `Vague language detected (${vagueWordCount} instances). Use specific numbers and details instead.`,
        impact: 2
      });
      deduction += 2;
    }

    // Check for jargon and acronyms without explanation
    const acronyms = this.findAcronyms(resume);
    if (acronyms.length > 5) {
      issues.push({
        category: 'readability',
        severity: 'info',
        description: `Many acronyms used (${acronyms.length}). Consider explaining some for better clarity.`,
        impact: 1
      });
      deduction += 1;
    }

    return { issues, deduction };
  }

  private analyzeGrammar(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check for common grammar issues
    const fullText = resume.getFullText();

    // Check for inconsistent tense
    const pastTenseVerbs = ['was', 'were', 'had', 'did', 'worked', 'managed', 'developed'];
    const presentTenseVerbs = ['am', 'is', 'are', 'have', 'do', 'work', 'manage', 'develop'];
    
    const pastTenseCount = pastTenseVerbs.reduce((count, verb) => 
      count + (fullText.toLowerCase().match(new RegExp(`\\b${verb}\\b`, 'g')) || []).length, 0
    );
    
    const presentTenseCount = presentTenseVerbs.reduce((count, verb) => 
      count + (fullText.toLowerCase().match(new RegExp(`\\b${verb}\\b`, 'g')) || []).length, 0
    );

    if (pastTenseCount > 0 && presentTenseCount > 0 && Math.abs(pastTenseCount - presentTenseCount) > 3) {
      issues.push({
        category: 'readability',
        severity: 'warning',
        description: 'Inconsistent verb tense usage. Use past tense for previous roles and present tense for current role.',
        impact: 2
      });
      deduction += 2;
    }

    // Check for bullet point consistency
    const bulletPoints = this.extractBulletPoints(resume);
    if (bulletPoints.length > 0) {
      const inconsistentBullets = this.checkBulletPointConsistency(bulletPoints);
      if (inconsistentBullets > bulletPoints.length * 0.3) {
        issues.push({
          category: 'readability',
          severity: 'info',
          description: 'Inconsistent bullet point formatting. Ensure all bullet points follow the same style.',
          impact: 1
        });
        deduction += 1;
      }
    }

    return { issues, deduction };
  }

  private getWordCount(resume: Resume): number {
    return resume.getWordCount();
  }

  private extractSentences(resume: Resume): Array<string> {
    const text = resume.getFullText();
    return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  }

  private extractBulletPoints(resume: Resume): Array<string> {
    const bulletPoints: Array<string> = [];
    
    // Extract from experience responsibilities
    for (const exp of resume.experience) {
      bulletPoints.push(...exp.responsibilities);
    }

    // Extract from project highlights
    if (resume.projects) {
      for (const project of resume.projects) {
        if (project.highlights) {
          bulletPoints.push(...project.highlights);
        }
      }
    }

    return bulletPoints;
  }

  private calculateVariance(numbers: Array<number>): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  private findAcronyms(resume: Resume): Array<string> {
    const text = resume.getFullText();
    const acronymRegex = /\b[A-Z]{2,}\b/g;
    return text.match(acronymRegex) || [];
  }

  private checkBulletPointConsistency(bulletPoints: Array<string>): number {
    let inconsistentCount = 0;
    
    for (const bullet of bulletPoints) {
      // Check if bullet starts with capital letter
      if (!/^[A-Z]/.test(bullet.trim())) {
        inconsistentCount++;
      }
      
      // Check if bullet ends with period (should be consistent)
      const endsWithPeriod = bullet.trim().endsWith('.');
      if (bulletPoints.some(b => b.trim().endsWith('.')) !== endsWithPeriod) {
        inconsistentCount++;
      }
    }
    
    return inconsistentCount;
  }

  private calculateReadabilityScore(resume: Resume): number {
    // Simplified readability score based on various factors
    let score = 100;
    
    const wordCount = this.getWordCount(resume);
    const sentences = this.extractSentences(resume);
    const averageSentenceLength = sentences.length > 0 ? 
      sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length : 0;
    
    // Penalize very long or very short content
    if (wordCount < 200 || wordCount > 800) score -= 10;
    
    // Penalize very long sentences
    if (averageSentenceLength > 25) score -= 15;
    
    // Penalize low action verb usage
    const fullText = resume.getFullText().toLowerCase();
    const actionVerbCount = this.actionVerbs.reduce((count, verb) => 
      count + (fullText.match(new RegExp(`\\b${verb}\\b`, 'g')) || []).length, 0
    );
    
    if (actionVerbCount < 5) score -= 20;
    
    return Math.max(0, score);
  }

  private generateRecommendations(issues: Array<ATSIssue>, detailLevel: string, resume: Resume): Array<Recommendation> {
    const recommendations: Array<Recommendation> = [];

    // Group issues by type
    const readabilityIssues = issues.filter(i => i.category === 'readability');

    if (readabilityIssues.length > 0) {
      recommendations.push({
        title: 'Improve Readability',
        description: 'Enhance resume readability by using shorter sentences, strong action verbs, and clear, specific language.',
        category: 'readability',
        potentialGain: readabilityIssues.reduce((sum, issue) => sum + issue.impact, 0),
        priority: 'high'
      });
    }

    recommendations.push({
      title: 'Use Strong Action Verbs',
      description: 'Replace weak words with strong action verbs to make your achievements more impactful and engaging.',
      category: 'readability',
      potentialGain: 4,
      priority: 'medium'
    });

    recommendations.push({
      title: 'Add Specific Details',
      description: 'Include specific numbers, metrics, and quantifiable achievements instead of vague descriptions.',
      category: 'readability',
      potentialGain: 3,
      priority: 'medium'
    });

    if (detailLevel === 'detailed' || detailLevel === 'comprehensive') {
      recommendations.push({
        title: 'Optimize Sentence Structure',
        description: 'Use varied sentence lengths and ensure consistent formatting throughout your resume.',
        category: 'readability',
        potentialGain: 2,
        priority: 'low'
      });

      recommendations.push({
        title: 'Maintain Consistent Tense',
        description: 'Use past tense for previous roles and present tense for current role consistently throughout.',
        category: 'readability',
        potentialGain: 2,
        priority: 'low'
      });
    }

    return recommendations.sort((a, b) => b.potentialGain - a.potentialGain);
  }
}
