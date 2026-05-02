import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const validateResumeModule: RegisterableModule = {
  type: "tool",
  name: "validate-resume",
  description: "Validate resume markdown content for ATS optimization and completeness",
  register(server: McpServer) {
    server.tool(
      "validate-resume",
      "Validate resume markdown content for ATS optimization and completeness",
      {
        markdown: z.string().min(1, "Markdown content is required").describe("Resume content in markdown format"),
        detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed').describe("Level of validation detail")
      },
      async (args) => {
        try {
          const { markdown, detailLevel } = args;
          
          // Basic validation logic
          const hasContactInfo = markdown.includes('@') && (markdown.includes('+') || markdown.includes('phone'));
          const hasWorkExperience = markdown.includes('## Work Experience') || markdown.includes('## Experience');
          const hasEducation = markdown.includes('## Education');
          const hasSkills = markdown.includes('## Skills');
          
          const errors = [];
          const warnings = [];
          
          if (!hasContactInfo) {
            errors.push({
              code: 'MISSING_CONTACT_INFO',
              message: 'Missing contact information',
              section: 'contact'
            });
          }
          
          if (!hasWorkExperience) {
            warnings.push({
              code: 'MISSING_WORK_EXPERIENCE',
              message: 'Missing work experience section',
              section: 'experience'
            });
          }
          
          if (!hasEducation) {
            warnings.push({
              code: 'MISSING_EDUCATION',
              message: 'Missing education section',
              section: 'education'
            });
          }
          
          if (!hasSkills) {
            warnings.push({
              code: 'MISSING_SKILLS',
              message: 'Missing skills section',
              section: 'skills'
            });
          }
          
          // Calculate statistics
          const wordCount = markdown.split(/\s+/).filter(word => word.length > 0).length;
          const sectionCount = (markdown.match(/^## .+$/gm) || []).length;
          
          // Generate suggestions
          const suggestions = [];
          if (!hasContactInfo) {
            suggestions.push('Add complete contact information including name, email, phone, and location');
          }
          if (!hasWorkExperience) {
            suggestions.push('Include a Work Experience section with your job history');
          }
          if (!hasEducation) {
            suggestions.push('Add an Education section with your academic background');
          }
          if (!hasSkills) {
            suggestions.push('Include a Skills section with your technical and soft skills');
          }
          if (wordCount < 200) {
            suggestions.push('Consider adding more detail to strengthen your resume');
          }
          if (wordCount > 800) {
            suggestions.push('Consider condensing your resume to keep it concise and focused');
          }
          
          const result = {
            valid: errors.length === 0,
            errors,
            warnings,
            suggestions: suggestions.slice(0, 10), // Limit to 10 suggestions
            statistics: {
              wordCount,
              sectionCount,
              hasContactInfo,
              hasWorkExperience,
              hasEducation,
              hasSkills
            }
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
                text: `Error validating resume: ${error}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
};

export default validateResumeModule;
