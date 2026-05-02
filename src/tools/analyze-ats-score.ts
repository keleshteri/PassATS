import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const analyzeATSScoreModule: RegisterableModule = {
  type: "tool",
  name: "analyze-ats-score",
  description: "Analyze resume ATS (Applicant Tracking System) score with detailed breakdown and recommendations",
  register(server: McpServer) {
    server.tool(
      "analyze-ats-score",
      "Analyze resume ATS (Applicant Tracking System) score with detailed breakdown and recommendations",
      {
        markdown: z.string().min(1, "Markdown content is required").describe("Resume content in markdown format"),
        detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed').describe("Level of analysis detail"),
        jobDescription: z.string().optional().describe("Job description text for targeted analysis (optional)"),
        industryFocus: z.string().optional().describe("Industry focus for specialized scoring (optional)"),
        includeRecommendations: z.boolean().optional().default(true).describe("Include actionable recommendations"),
        includeBenchmarks: z.boolean().optional().default(false).describe("Include industry benchmarks and percentiles")
      },
      async (args) => {
        const startTime = Date.now();
        
        try {
          const { 
            markdown, 
            detailLevel, 
            jobDescription, 
            industryFocus, 
            includeRecommendations,
            includeBenchmarks 
          } = args;
          
          // Analyze the resume content
          const hasHeaders = markdown.includes('#');
          const hasContact = markdown.includes('@') && (markdown.includes('+') || markdown.includes('phone'));
          const hasExperience = markdown.includes('## Work Experience') || markdown.includes('## Experience');
          const hasEducation = markdown.includes('## Education');
          const hasSkills = markdown.includes('## Skills');
          
          // Calculate score based on content quality
          let score = 0;
          if (hasHeaders) score += 25;
          if (hasContact) score += 20;
          if (hasExperience) score += 20;
          if (hasEducation) score += 15;
          if (hasSkills) score += 20;
          
          // Adjust score based on content quality
          if (markdown.length > 500) score += 5;
          if (markdown.includes('JavaScript') || markdown.includes('Python') || markdown.includes('React')) score += 5;
          
          const rating = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
          
          // Generate issues
          const issues = [];
          if (!hasHeaders) {
            issues.push({
              category: 'formatting',
              severity: 'high',
              message: 'Missing proper section headers',
              suggestion: 'Use H2 headings (##) for each section'
            });
          }
          if (!hasContact) {
            issues.push({
              category: 'completeness',
              severity: 'critical',
              message: 'Incomplete contact information',
              suggestion: 'Add complete contact information including name, email, phone, and location'
            });
          }
          if (!hasExperience) {
            issues.push({
              category: 'completeness',
              severity: 'high',
              message: 'Missing work experience section',
              suggestion: 'Include a Work Experience section with your job history'
            });
          }
          if (!hasEducation) {
            issues.push({
              category: 'completeness',
              severity: 'medium',
              message: 'Missing education section',
              suggestion: 'Add an Education section with your academic background'
            });
          }
          if (!hasSkills) {
            issues.push({
              category: 'completeness',
              severity: 'medium',
              message: 'Missing skills section',
              suggestion: 'Include a Skills section with your technical and soft skills'
            });
          }
          if (markdown.length < 200) {
            issues.push({
              category: 'content',
              severity: 'medium',
              message: 'Content too brief',
              suggestion: 'Add more detail to strengthen your resume'
            });
          }
          
          // Generate recommendations
          const recommendations = [];
          if (includeRecommendations) {
            if (!hasContact) {
              recommendations.push({
                priority: 'high',
                category: 'completeness',
                action: 'Add complete contact information',
                impact: 'Essential for ATS processing'
              });
            }
            if (!hasExperience) {
              recommendations.push({
                priority: 'high',
                category: 'completeness',
                action: 'Include work experience section',
                impact: 'Critical for most positions'
              });
            }
            if (!hasSkills) {
              recommendations.push({
                priority: 'high',
                category: 'optimization',
                action: 'Add skills section with relevant keywords',
                impact: 'Improves ATS matching'
              });
            }
            if (markdown.length < 500) {
              recommendations.push({
                priority: 'medium',
                category: 'content',
                action: 'Add more detail and quantify achievements',
                impact: 'Demonstrates impact and experience'
              });
            }
            if (!markdown.includes('JavaScript') && !markdown.includes('Python') && jobDescription) {
              recommendations.push({
                priority: 'medium',
                category: 'optimization',
                action: 'Include keywords from job description',
                impact: 'Improves ATS matching'
              });
            }
          }
          
          // Calculate breakdown scores
          const breakdown = {
            formatting: hasHeaders ? 25 : 10,
            keywords: (markdown.includes('JavaScript') || markdown.includes('Python') || markdown.includes('React')) ? 20 : 15,
            technical: hasSkills ? 20 : 10,
            readability: markdown.length > 500 ? 20 : 15
          };
          
          let benchmarks: any = undefined;
          
          // Get benchmarks if requested
          if (includeBenchmarks && industryFocus) {
            const industryAverage = calculateIndustryAverage(score, industryFocus);
            const percentile = calculatePercentile(score, industryFocus);
            
            benchmarks = {
              industryAverage,
              percentile,
              category: industryFocus
            };
          }
          
          const result = {
            score: {
              totalScore: score,
              rating,
              breakdown,
              issues,
              recommendations,
              analyzedAt: new Date().toISOString(),
              detailLevel
            },
            benchmarks,
            processingTime: Date.now() - startTime,
            cacheHit: false,
            generatedAt: new Date().toISOString()
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  score: {
                    totalScore: 0,
                    rating: 'poor',
                    breakdown: {
                      formatting: 0,
                      keywords: 0,
                      technical: 0,
                      readability: 0
                    },
                    issues: [{
                      category: 'system',
                      severity: 'critical',
                      message: `Analysis failed: ${error}`,
                      suggestion: 'Please check your resume format and try again'
                    }],
                    recommendations: [{
                      priority: 'high',
                      category: 'general',
                      action: 'Review resume format and content',
                      impact: 'Critical for ATS processing'
                    }],
                    analyzedAt: new Date().toISOString(),
                    detailLevel: 'basic'
                  },
                  processingTime: Date.now() - startTime,
                  cacheHit: false,
                  generatedAt: new Date().toISOString()
                }, null, 2),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
};

function calculateIndustryAverage(score: number, industry: string): number {
  // Mock industry averages - in real implementation, this would come from analytics
  const industryAverages: Record<string, number> = {
    'technology': 75,
    'healthcare': 72,
    'finance': 78,
    'education': 70,
    'marketing': 74,
    'sales': 76,
    'engineering': 77,
    'consulting': 79
  };

  return industryAverages[industry.toLowerCase()] || 73;
}

function calculatePercentile(score: number, industry: string): number {
  // Mock percentile calculation - in real implementation, this would be based on historical data
  if (score >= 90) return 95;
  if (score >= 80) return 85;
  if (score >= 70) return 70;
  if (score >= 60) return 50;
  if (score >= 50) return 30;
  return 15;
}

export default analyzeATSScoreModule;
