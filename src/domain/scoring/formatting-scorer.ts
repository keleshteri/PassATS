/**
 * Formatting Scorer Module
 * 
 * Analyzes resume formatting for ATS compatibility.
 * Checks for proper structure, fonts, layouts, and formatting elements.
 */

import type { IScoringModule, ScoringResult, ScoringContext } from './scoring-module.interface.js';
import type { ATSIssue, Recommendation, IssueCategory } from '../models/ats-score.js';
import type { Resume } from '../models/resume.js';

export class FormattingScorer implements IScoringModule {
  readonly id = 'formatting-scorer';
  readonly name = 'Formatting & Structure Analyzer';
  readonly description = 'Analyzes resume formatting, structure, and layout for ATS compatibility';
  readonly category: IssueCategory = 'formatting';
  readonly maxScore = 30;
  readonly weight = 0.30; // 30% of total score

  private config: Record<string, any> = {
    strictMode: false,
    checkFonts: true,
    checkLayout: true,
    checkHeaders: true,
    checkSections: true
  };

  async analyze(context: ScoringContext): Promise<ScoringResult> {
    const { resume, detailLevel } = context;
    const issues: Array<ATSIssue> = [];
    const recommendations: Array<Recommendation> = [];
    let score = this.maxScore;

    // Analyze resume structure
    const structureAnalysis = this.analyzeStructure(resume);
    issues.push(...structureAnalysis.issues);
    score -= structureAnalysis.deduction;

    // Analyze contact information formatting
    const contactAnalysis = this.analyzeContactFormatting(resume);
    issues.push(...contactAnalysis.issues);
    score -= contactAnalysis.deduction;

    // Analyze section formatting
    const sectionAnalysis = this.analyzeSectionFormatting(resume);
    issues.push(...sectionAnalysis.issues);
    score -= sectionAnalysis.deduction;

    // Analyze content formatting
    const contentAnalysis = this.analyzeContentFormatting(resume);
    issues.push(...contentAnalysis.issues);
    score -= contentAnalysis.deduction;

    // Generate recommendations based on issues
    recommendations.push(...this.generateRecommendations(issues, detailLevel));

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      maxScore: this.maxScore,
      issues,
      recommendations,
      details: {
        structureScore: this.maxScore - structureAnalysis.deduction,
        contactScore: this.maxScore - contactAnalysis.deduction,
        sectionScore: this.maxScore - sectionAnalysis.deduction,
        contentScore: this.maxScore - contentAnalysis.deduction,
        totalDeduction: structureAnalysis.deduction + contactAnalysis.deduction + 
                       sectionAnalysis.deduction + contentAnalysis.deduction
      }
    };
  }

  canAnalyze(resume: Resume): boolean {
    return resume.contact && resume.experience.length > 0 && resume.education.length > 0;
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

  private analyzeStructure(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check for required sections
    const requiredSections = ['contact', 'experience', 'education', 'skills'];
    const hasAllSections = resume.contact && resume.experience.length > 0 && 
                          resume.education.length > 0 && resume.skills.length > 0;

    if (!hasAllSections) {
      issues.push({
        category: 'formatting',
        severity: 'critical',
        description: 'Missing required resume sections (Contact, Experience, Education, Skills)',
        impact: 10
      });
      deduction += 10;
    }

    // Check for proper section order (experience should come before education)
    if (resume.experience.length > 0 && resume.education.length > 0) {
      const hasProperOrder = true; // This would need more sophisticated analysis
      if (!hasProperOrder) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: 'Resume sections may not be in optimal order for ATS parsing',
          impact: 3
        });
        deduction += 3;
      }
    }

    // Check for consistent formatting
    const hasConsistentFormatting = this.checkConsistentFormatting(resume);
    if (!hasConsistentFormatting) {
      issues.push({
        category: 'formatting',
        severity: 'warning',
        description: 'Inconsistent formatting detected across resume sections',
        impact: 5
      });
      deduction += 5;
    }

    return { issues, deduction };
  }

  private analyzeContactFormatting(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resume.contact.email)) {
      issues.push({
        category: 'formatting',
        severity: 'critical',
        description: 'Invalid email format detected',
        location: 'Contact Information',
        impact: 8
      });
      deduction += 8;
    }

    // Check phone format (E.164)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(resume.contact.phone)) {
      issues.push({
        category: 'formatting',
        severity: 'critical',
        description: 'Phone number should be in E.164 format (+12345678901)',
        location: 'Contact Information',
        impact: 5
      });
      deduction += 5;
    }

    // Check for missing essential contact info
    if (!resume.contact.fullName || resume.contact.fullName.trim().length < 2) {
      issues.push({
        category: 'formatting',
        severity: 'critical',
        description: 'Full name is required and should be at least 2 characters',
        location: 'Contact Information',
        impact: 10
      });
      deduction += 10;
    }

    return { issues, deduction };
  }

  private analyzeSectionFormatting(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check work experience formatting
    for (let i = 0; i < resume.experience.length; i++) {
      const exp = resume.experience[i];
      
      if (!exp) continue;
      
      // Check for missing job title
      if (!exp.title || exp.title.trim().length < 2) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: `Work experience ${i + 1} is missing a job title`,
          location: 'Work Experience',
          impact: 3
        });
        deduction += 3;
      }

      // Check for missing company name
      if (!exp.company || exp.company.trim().length < 2) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: `Work experience ${i + 1} is missing a company name`,
          location: 'Work Experience',
          impact: 3
        });
        deduction += 3;
      }

      // Check for insufficient responsibilities
      if (exp.responsibilities.length < 2) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: `Work experience ${i + 1} should have at least 2 responsibility points`,
          location: 'Work Experience',
          impact: 2
        });
        deduction += 2;
      }
    }

    // Check education formatting
    for (let i = 0; i < resume.education.length; i++) {
      const edu = resume.education[i];
      
      if (!edu) continue;
      
      // Check for missing degree
      if (!edu.degree || edu.degree.trim().length < 2) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: `Education ${i + 1} is missing a degree`,
          location: 'Education',
          impact: 3
        });
        deduction += 3;
      }

      // Check for missing institution
      if (!edu.institution || edu.institution.trim().length < 2) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: `Education ${i + 1} is missing an institution name`,
          location: 'Education',
          impact: 3
        });
        deduction += 3;
      }
    }

    return { issues, deduction };
  }

  private analyzeContentFormatting(resume: Resume): { issues: Array<ATSIssue>; deduction: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;

    // Check for personal pronouns
    const personalPronouns = ['i ', ' me ', ' my ', ' myself ', ' we ', ' us ', ' our ', ' ourselves '];
    const fullText = resume.getFullText().toLowerCase();
    
    for (const pronoun of personalPronouns) {
      if (fullText.includes(pronoun)) {
        issues.push({
          category: 'formatting',
          severity: 'warning',
          description: `Personal pronoun "${pronoun.trim()}" detected. Use third person or action verbs instead.`,
          impact: 2
        });
        deduction += 2;
        break; // Only count once
      }
    }

    // Check for proper action verbs in experience
    const actionVerbs = ['developed', 'created', 'implemented', 'managed', 'led', 'designed', 'built', 'improved', 'optimized', 'delivered'];
    let hasActionVerbs = false;
    
    for (const exp of resume.experience) {
      for (const responsibility of exp.responsibilities) {
        const lowerResp = responsibility.toLowerCase();
        if (actionVerbs.some(verb => lowerResp.startsWith(verb))) {
          hasActionVerbs = true;
          break;
        }
      }
      if (hasActionVerbs) break;
    }

    if (!hasActionVerbs) {
      issues.push({
        category: 'formatting',
        severity: 'info',
        description: 'Consider starting responsibility statements with strong action verbs',
        impact: 1
      });
      deduction += 1;
    }

    return { issues, deduction };
  }

  private checkConsistentFormatting(resume: Resume): boolean {
    /*
     * This is a simplified check - in a real implementation, you'd analyze
     * the actual formatting of the resume document
     */
    return true;
  }

  private generateRecommendations(issues: Array<ATSIssue>, detailLevel: string): Array<Recommendation> {
    const recommendations: Array<Recommendation> = [];

    // Group issues by type for better recommendations
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const warningIssues = issues.filter(i => i.severity === 'warning');

    if (criticalIssues.length > 0) {
      recommendations.push({
        title: 'Fix Critical Formatting Issues',
        description: 'Address critical formatting problems that prevent ATS parsing: missing contact information, invalid formats, or missing required sections.',
        category: 'formatting',
        potentialGain: criticalIssues.reduce((sum, issue) => sum + issue.impact, 0),
        priority: 'high'
      });
    }

    if (warningIssues.length > 0) {
      recommendations.push({
        title: 'Improve Section Formatting',
        description: 'Enhance section formatting for better ATS compatibility: ensure consistent structure, proper headings, and complete information.',
        category: 'formatting',
        potentialGain: warningIssues.reduce((sum, issue) => sum + issue.impact, 0),
        priority: 'medium'
      });
    }

    // Add specific recommendations based on detail level
    if (detailLevel === 'detailed' || detailLevel === 'comprehensive') {
      recommendations.push({
        title: 'Use ATS-Friendly Formatting',
        description: 'Use standard fonts (Arial, Calibri, Times New Roman), avoid graphics and tables, and use simple bullet points.',
        category: 'formatting',
        potentialGain: 5,
        priority: 'medium'
      });

      recommendations.push({
        title: 'Optimize Contact Information',
        description: 'Place contact information at the top, use standard formats, and include professional email and phone number.',
        category: 'formatting',
        potentialGain: 3,
        priority: 'low'
      });
    }

    return recommendations.sort((a, b) => b.potentialGain - a.potentialGain);
  }
}
