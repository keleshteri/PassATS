import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const generateResumeModule: RegisterableModule = {
  type: "tool",
  name: "generate-resume",
  description: "Generate resume documents in DOCX, PDF, HTML, or all formats from markdown content",
  register(server: McpServer) {
    server.tool(
      "generate-resume",
      "Generate resume documents in DOCX, PDF, HTML, or all formats from markdown content",
      {
        markdown: z.string().min(1, "Markdown content is required").describe("Resume content in markdown format"),
        format: z.enum(['docx', 'pdf', 'html', 'all']).describe("Output format(s) to generate"),
        templateId: z.string().optional().default('professional-classic').describe("Template ID to use for generation"),
        filename: z.string().optional().describe("Custom filename (without extension)"),
        includeMetadata: z.boolean().optional().default(true).describe("Include metadata in the response"),
        validateContent: z.boolean().optional().default(true).describe("Validate content before generation")
      },
      async (args) => {
        const startTime = Date.now();
        
        try {
          const { markdown, format, templateId, filename, includeMetadata, validateContent } = args;
          
          // Validate content if requested
          let validation: any = undefined;
          if (validateContent) {
            const hasContactInfo = markdown.includes('@') && (markdown.includes('+') || markdown.includes('phone'));
            const hasWorkExperience = markdown.includes('## Work Experience') || markdown.includes('## Experience');
            const hasEducation = markdown.includes('## Education');
            const hasSkills = markdown.includes('## Skills');
            
            const errors = [];
            const warnings = [];
            
            if (!hasContactInfo) {
              errors.push('Missing contact information');
            }
            
            if (!hasWorkExperience) {
              warnings.push('Missing work experience section');
            }
            
            if (!hasEducation) {
              warnings.push('Missing education section');
            }
            
            if (!hasSkills) {
              warnings.push('Missing skills section');
            }
            
            validation = {
              valid: errors.length === 0,
              errors,
              warnings
            };
            
            // If validation fails with errors, return early
            if (!validation.valid && validation.errors.length > 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      success: false,
                      files: [],
                      validation,
                      processingTime: Date.now() - startTime,
                      generatedAt: new Date().toISOString()
                    }, null, 2),
                  },
                ],
                isError: true,
              };
            }
          }
          
          // Mock file generation - in real implementation, this would use actual generators
          const generateMockFile = (formatType: string) => {
            const mimeTypes = {
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'pdf': 'application/pdf',
              'html': 'text/html'
            };
            
            const extensions = {
              'docx': '.docx',
              'pdf': '.pdf',
              'html': '.html'
            };
            
            const baseFilename = filename || 'resume';
            const fullFilename = `${baseFilename}${extensions[formatType as keyof typeof extensions]}`;
            
            // Mock base64 content - in real implementation, this would be actual generated content
            const mockContent = Buffer.from(`Mock ${formatType.toUpperCase()} content for: ${markdown.substring(0, 100)}...`).toString('base64');
            
            return {
              format: formatType,
              content: mockContent,
              filename: fullFilename,
              mimeType: mimeTypes[formatType as keyof typeof mimeTypes],
              size: mockContent.length,
              metadata: includeMetadata ? {
                template: templateId,
                generatedAt: new Date().toISOString(),
                format: formatType,
                pageCount: formatType === 'pdf' ? 2 : undefined
              } : undefined
            };
          };
          
          let files: Array<any> = [];
          
          // Generate documents based on format
          if (format === 'all') {
            files = [
              generateMockFile('docx'),
              generateMockFile('pdf'),
              generateMockFile('html')
            ];
          } else {
            files = [generateMockFile(format)];
          }
          
          const result = {
            success: true,
            files,
            validation,
            processingTime: Date.now() - startTime,
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
                  success: false,
                  files: [],
                  validation: {
                    valid: false,
                    errors: [`Generation failed: ${error}`],
                    warnings: []
                  },
                  processingTime: Date.now() - startTime,
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

export default generateResumeModule;
