/**
 * Technical Scorer Module
 * 
 * Analyzes resume for technical content quality and depth.
 * Checks for technical skills, project details, and technical achievements.
 */

import type { IScoringModule, ScoringResult, ScoringContext } from './scoring-module.interface.js';
import type { ATSIssue, Recommendation, IssueCategory } from '../models/ats-score.js';
import type { Resume } from '../models/resume.js';

export class TechnicalScorer implements IScoringModule {
  readonly id = 'technical-scorer';
  readonly name = 'Technical Content Analyzer';
  readonly description = 'Analyzes technical skills, project details, and technical achievements for depth and relevance';
  readonly category: IssueCategory = 'compatibility';
  readonly maxScore = 25;
  readonly weight = 0.25; // 25% of total score

  private config: Record<string, any> = {
    minTechnicalSkills: 5,
    checkProjectDetails: true,
    checkTechnicalAchievements: true,
    checkSkillDepth: true,
    analyzeTechnologyStack: true
  };

  private readonly technicalSkillCategories = {
    programming: ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift', 'kotlin', 'typescript'],
    frameworks: ['react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net'],
    databases: ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sql server', 'sqlite', 'cassandra'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd', 'microservices'],
    tools: ['git', 'github', 'gitlab', 'jira', 'confluence', 'slack', 'figma', 'photoshop', 'illustrator'],
    methodologies: ['agile', 'scrum', 'kanban', 'devops', 'tdd', 'bdd', 'ci/cd', 'microservices', 'api design']
  };

  async analyze(context: ScoringContext): Promise<ScoringResult> {
    const { resume, detailLevel } = context;
    const issues: Array<ATSIssue> = [];
    const recommendations: Array<Recommendation> = [];
    let score = this.maxScore;

    // Analyze technical skills depth
    const skillsAnalysis = this.analyzeTechnicalSkills(resume);
    issues.push(...skillsAnalysis.issues);
    score -= skillsAnalysis.deduction;

    // Analyze project technical content
    const projectAnalysis = this.analyzeProjectTechnicalContent(resume);
    issues.push(...projectAnalysis.issues);
    score -= projectAnalysis.deduction;

    // Analyze technical achievements
    const achievementAnalysis = this.analyzeTechnicalAchievements(resume);
    issues.push(...achievementAnalysis.issues);
    score -= achievementAnalysis.deduction;

    // Analyze technology stack consistency
    const stackAnalysis = this.analyzeTechnologyStack(resume);
    issues.push(...stackAnalysis.issues);
    score -= stackAnalysis.deduction;

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
        technicalSkillCount: skillsAnalysis.technicalSkillCount,
        projectTechnicalScore: projectAnalysis.technicalScore,
        achievementScore: achievementAnalysis.achievementScore,
        stackConsistencyScore: stackAnalysis.consistencyScore,
        overallTechnicalDepth: this.calculateTechnicalDepth(resume)
      }
    };
  }

  canAnalyze(resume: Resume): boolean {
    return resume.skills.length > 0;
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

  private analyzeTechnicalSkills(resume: Resume): { issues: Array<ATSIssue>; deduction: number; technicalSkillCount: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;
    let technicalSkillCount = 0;

    // Extract all skills
    const allSkills: Array<string> = [];
    for (const skillCategory of resume.skills) {
      for (const skill of skillCategory.skills) {
        allSkills.push(skill.toLowerCase());
      }
    }

    // Count technical skills
    for (const category of Object.values(this.technicalSkillCategories)) {
      for (const skill of allSkills) {
        if (category.some(techSkill => skill.includes(techSkill.toLowerCase()))) {
          technicalSkillCount++;
        }
      }
    }

    // Check minimum technical skills
    if (technicalSkillCount < this.config.minTechnicalSkills) {
      issues.push({
        category: 'compatibility',
        severity: 'warning',
        description: `Low technical skill count (${technicalSkillCount}). Consider adding more technical skills relevant to your field.`,
        impact: 5
      });
      deduction += 5;
    }

    // Check for skill depth (skills mentioned in experience)
    const skillsInExperience = this.countSkillsInExperience(resume, allSkills);
    const skillDepthRatio = skillsInExperience / allSkills.length;

    if (skillDepthRatio < 0.6) {
      issues.push({
        category: 'compatibility',
        severity: 'warning',
        description: `Some skills are not demonstrated in experience (${(skillDepthRatio * 100).toFixed(0)}% coverage). Show how you've used these skills.`,
        impact: 4
      });
      deduction += 4;
    }

    return { issues, deduction, technicalSkillCount };
  }

  private analyzeProjectTechnicalContent(resume: Resume): { issues: Array<ATSIssue>; deduction: number; technicalScore: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;
    let technicalScore = 0;

    if (!resume.projects || resume.projects.length === 0) {
      issues.push({
        category: 'compatibility',
        severity: 'info',
        description: 'Consider adding a projects section to showcase technical work and achievements.',
        impact: 3
      });
      deduction += 3;
      return { issues, deduction, technicalScore };
    }

    // Analyze each project
    for (let i = 0; i < resume.projects.length; i++) {
      const project = resume.projects[i];
      
      if (!project) continue;
      
      let projectTechnicalScore = 0;

      // Check for technical description
      if (project.description && project.description.length > 50) {
        projectTechnicalScore += 2;
      }

      // Check for technologies listed
      if (project.technologies && project.technologies.length > 0) {
        projectTechnicalScore += 2;
      }

      // Check for technical highlights
      if (project.highlights && project.highlights.length > 0) {
        projectTechnicalScore += 2;
      }

      // Check for URL (live project)
      if (project.url) {
        projectTechnicalScore += 1;
      }

      technicalScore += projectTechnicalScore;

      // Flag projects with low technical content
      if (projectTechnicalScore < 3) {
        issues.push({
          category: 'compatibility',
          severity: 'info',
          description: `Project "${project.name || 'Unknown'}" could benefit from more technical details, technologies used, and achievements.`,
          location: 'Projects',
          impact: 1
        });
        deduction += 1;
      }
    }

    return { issues, deduction, technicalScore };
  }

  private analyzeTechnicalAchievements(resume: Resume): { issues: Array<ATSIssue>; deduction: number; achievementScore: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;
    let achievementScore = 0;

    // Analyze work experience for technical achievements
    for (const exp of resume.experience) {
      let expAchievementScore = 0;

      // Check for quantified achievements
      const hasQuantifiedAchievements = exp.achievements?.some(achievement => 
        /\d+/.test(achievement) // Contains numbers
      );

      if (hasQuantifiedAchievements) {
        expAchievementScore += 2;
      }

      // Check for technical responsibilities
      const hasTechnicalResponsibilities = exp.responsibilities.some(resp => 
        this.containsTechnicalTerms(resp)
      );

      if (hasTechnicalResponsibilities) {
        expAchievementScore += 2;
      }

      // Check for technologies mentioned
      if (exp.technologies && exp.technologies.length > 0) {
        expAchievementScore += 1;
      }

      achievementScore += expAchievementScore;

      // Flag experiences with low technical content
      if (expAchievementScore < 2) {
        issues.push({
          category: 'compatibility',
          severity: 'info',
          description: `Work experience at ${exp.company} could benefit from more technical details and quantified achievements.`,
          location: 'Work Experience',
          impact: 1
        });
        deduction += 1;
      }
    }

    return { issues, deduction, achievementScore };
  }

  private analyzeTechnologyStack(resume: Resume): { issues: Array<ATSIssue>; deduction: number; consistencyScore: number } {
    const issues: Array<ATSIssue> = [];
    let deduction = 0;
    let consistencyScore = 0;

    // Extract technologies from different sections
    const technologiesFromSkills = this.extractTechnologiesFromSkills(resume);
    const technologiesFromExperience = this.extractTechnologiesFromExperience(resume);
    const technologiesFromProjects = this.extractTechnologiesFromProjects(resume);

    // Check for technology consistency across sections
    const allTechnologies = new Set([
      ...technologiesFromSkills,
      ...technologiesFromExperience,
      ...technologiesFromProjects
    ]);

    const consistencyRatio = allTechnologies.size / (technologiesFromSkills.size + technologiesFromExperience.size + technologiesFromProjects.size);

    if (consistencyRatio < 0.7) {
      issues.push({
        category: 'compatibility',
        severity: 'info',
        description: 'Technologies mentioned in different sections could be more consistent. Ensure skills align with experience and projects.',
        impact: 2
      });
      deduction += 2;
    }

    // Check for modern technology stack
    const modernTechCount = this.countModernTechnologies(Array.from(allTechnologies));
    if (modernTechCount < 3) {
      issues.push({
        category: 'compatibility',
        severity: 'info',
        description: 'Consider including more modern technologies and tools to demonstrate current technical knowledge.',
        impact: 2
      });
      deduction += 2;
    }

    consistencyScore = Math.max(0, 10 - deduction);

    return { issues, deduction, consistencyScore };
  }

  private countSkillsInExperience(resume: Resume, skills: Array<string>): number {
    const experienceText = resume.experience
      .map(exp => `${exp.title} ${exp.company} ${exp.responsibilities.join(' ')}`)
      .join(' ')
      .toLowerCase();

    let skillsInExperience = 0;
    for (const skill of skills) {
      if (experienceText.includes(skill.toLowerCase())) {
        skillsInExperience++;
      }
    }

    return skillsInExperience;
  }

  private containsTechnicalTerms(text: string): boolean {
    const technicalTerms = ['developed', 'implemented', 'designed', 'built', 'created', 'optimized', 'configured', 'deployed', 'integrated', 'architected'];
    const lowerText = text.toLowerCase();
    return technicalTerms.some(term => lowerText.includes(term));
  }

  private extractTechnologiesFromSkills(resume: Resume): Set<string> {
    const technologies = new Set<string>();
    for (const skillCategory of resume.skills) {
      for (const skill of skillCategory.skills) {
        technologies.add(skill.toLowerCase());
      }
    }
    return technologies;
  }

  private extractTechnologiesFromExperience(resume: Resume): Set<string> {
    const technologies = new Set<string>();
    for (const exp of resume.experience) {
      if (exp.technologies) {
        for (const tech of exp.technologies) {
          technologies.add(tech.toLowerCase());
        }
      }
    }
    return technologies;
  }

  private extractTechnologiesFromProjects(resume: Resume): Set<string> {
    const technologies = new Set<string>();
    if (resume.projects) {
      for (const project of resume.projects) {
        if (project.technologies) {
          for (const tech of project.technologies) {
            technologies.add(tech.toLowerCase());
          }
        }
      }
    }
    return technologies;
  }

  private countModernTechnologies(technologies: Array<string>): number {
    const modernTechs = ['react', 'angular', 'vue', 'node.js', 'python', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'typescript', 'graphql', 'microservices'];
    return technologies.filter(tech => 
      modernTechs.some(modern => tech.includes(modern))
    ).length;
  }

  private calculateTechnicalDepth(resume: Resume): number {
    let depth = 0;

    // Skills depth
    const totalSkills = resume.skills.reduce((sum, cat) => sum + cat.skills.length, 0);
    depth += Math.min(totalSkills * 0.5, 5);

    // Project depth
    if (resume.projects) {
      depth += Math.min(resume.projects.length * 1.5, 5);
    }

    // Experience technical content
    const technicalExperienceCount = resume.experience.filter(exp => 
      exp.technologies && exp.technologies.length > 0
    ).length;
    depth += Math.min(technicalExperienceCount * 1, 5);

    return Math.min(depth, 15); // Cap at 15
  }

  private generateRecommendations(issues: Array<ATSIssue>, detailLevel: string, resume: Resume): Array<Recommendation> {
    const recommendations: Array<Recommendation> = [];

    // Group issues by type
    const technicalIssues = issues.filter(i => i.category === 'compatibility');

    if (technicalIssues.length > 0) {
      recommendations.push({
        title: 'Enhance Technical Content',
        description: 'Add more technical details, quantified achievements, and specific technologies to demonstrate your technical expertise.',
        category: 'compatibility',
        potentialGain: technicalIssues.reduce((sum, issue) => sum + issue.impact, 0),
        priority: 'high'
      });
    }

    if (!resume.projects || resume.projects.length === 0) {
      recommendations.push({
        title: 'Add Technical Projects',
        description: 'Include a projects section showcasing your technical work, technologies used, and achievements.',
        category: 'compatibility',
        potentialGain: 5,
        priority: 'high'
      });
    }

    recommendations.push({
      title: 'Quantify Technical Achievements',
      description: 'Add specific metrics and numbers to your technical achievements (e.g., "Improved performance by 40%", "Reduced load time by 2 seconds").',
      category: 'compatibility',
      potentialGain: 4,
      priority: 'medium'
    });

    if (detailLevel === 'detailed' || detailLevel === 'comprehensive') {
      recommendations.push({
        title: 'Modernize Technology Stack',
        description: 'Include current and in-demand technologies to show you stay updated with industry trends.',
        category: 'compatibility',
        potentialGain: 3,
        priority: 'medium'
      });

      recommendations.push({
        title: 'Demonstrate Skill Application',
        description: 'Show how you\'ve applied your technical skills in real projects and work experiences.',
        category: 'compatibility',
        potentialGain: 4,
        priority: 'low'
      });
    }

    return recommendations.sort((a, b) => b.potentialGain - a.potentialGain);
  }
}
