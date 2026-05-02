import { z } from "zod";
import type { RegisterableModule } from "../registry/types.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const getResumeTemplateModule: RegisterableModule = {
  type: "tool",
  name: "get-resume-template",
  description: "Get a resume template in markdown or JSON format with formatting rules",
  register(server: McpServer) {
    server.tool(
      "get-resume-template",
      "Get a resume template in markdown or JSON format with formatting rules",
      {
        format: z.enum(['markdown', 'json']).optional().default('markdown').describe("Output format for the template"),
        templateId: z.string().optional().describe("Specific template ID to retrieve (optional)"),
        includeRules: z.boolean().optional().default(true).describe("Whether to include formatting rules in the output")
      },
      async (args) => {
        try {
          const { format, templateId, includeRules } = args;
          
          // Mock template data - in real implementation, this would come from template service
          const templates = {
            'professional-classic': {
              id: 'professional-classic',
              name: 'Professional Classic',
              description: 'A clean, traditional resume template perfect for corporate environments',
              category: 'professional',
              industryFocus: 'general',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true, description: 'Your contact details' },
                { name: 'Professional Summary', required: true, description: 'Brief professional overview' },
                { name: 'Work Experience', required: true, description: 'Your work history' },
                { name: 'Education', required: true, description: 'Your educational background' },
                { name: 'Skills', required: true, description: 'Your technical and soft skills' }
              ]
            },
            'modern-tech': {
              id: 'modern-tech',
              name: 'Modern Tech',
              description: 'A contemporary resume template for technology professionals',
              category: 'modern',
              industryFocus: 'technology',
              version: '1.0.0',
              sections: [
                { name: 'Contact Information', required: true, description: 'Your contact details' },
                { name: 'Professional Summary', required: true, description: 'Brief professional overview' },
                { name: 'Work Experience', required: true, description: 'Your work history' },
                { name: 'Education', required: true, description: 'Your educational background' },
                { name: 'Skills', required: true, description: 'Your technical and soft skills' },
                { name: 'Projects', required: false, description: 'Notable projects and achievements' },
                { name: 'Certifications', required: false, description: 'Professional certifications' }
              ]
            }
          };
          
          const selectedTemplate = templateId ? templates[templateId as keyof typeof templates] : templates['professional-classic'];
          
          if (!selectedTemplate) {
            throw new Error(`Template '${templateId}' not found`);
          }
          
          let templateContent: string;
          
          if (format === 'json') {
            templateContent = JSON.stringify(selectedTemplate, null, 2);
          } else {
            // Generate markdown template
            const sections = selectedTemplate.sections
              .map(section => {
                const required = section.required ? ' (required)' : ' (optional)';
                const example = getSectionExample(section.name);
                return `## ${section.name}${required}\n\n${section.description}\n\n${example}\n`;
              })
              .join('\n');
            
            templateContent = `# Your Name
Email: your.email@example.com
Phone: +1 (555) 123-4567
Location: City, State
LinkedIn: https://linkedin.com/in/yourprofile
GitHub: https://github.com/yourusername

${sections}`;
            
            if (includeRules) {
              templateContent += `\n\n## Formatting Rules

${generateFormattingRules().join('\n')}

## Template Information

- **Template**: ${selectedTemplate.name}
- **Category**: ${selectedTemplate.category}
- **Industry Focus**: ${selectedTemplate.industryFocus || 'General'}
- **Version**: ${selectedTemplate.version}
- **Description**: ${selectedTemplate.description}

## Required Sections

${selectedTemplate.sections.filter(s => s.required).map(s => `- ${s.name}`).join('\n')}

## Optional Sections

${selectedTemplate.sections.filter(s => !s.required).map(s => `- ${s.name}`).join('\n')}`;
            }
          }
          
          const result = {
            template: templateContent,
            format,
            metadata: {
              name: selectedTemplate.name,
              description: selectedTemplate.description,
              category: selectedTemplate.category,
              industryFocus: selectedTemplate.industryFocus,
              version: selectedTemplate.version,
              sections: selectedTemplate.sections.map(section => ({
                name: section.name,
                required: section.required,
                description: section.description
              }))
            },
            rules: includeRules ? generateFormattingRules() : undefined,
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
                text: `Error getting resume template: ${error}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }
};

function getSectionExample(sectionName: string): string {
  const examples: Record<string, string> = {
    'Professional Summary': `Professional software engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable applications and leading development teams.`,
    
    'Work Experience': `### Senior Software Engineer | Company Name | 01/2020 - Present
- Led development of microservices architecture serving 100k+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored 3 junior developers and conducted code reviews
- Collaborated with product team to define technical requirements

### Software Engineer | Previous Company | 06/2018 - 12/2019
- Developed REST APIs using Node.js and Express.js
- Integrated third-party services and payment processing
- Participated in agile development process with 2-week sprints
- Contributed to database optimization improving query performance by 40%`,
    
    'Education': `### Bachelor of Science in Computer Science
University Name | City, State | 05/2018
GPA: 3.7/4.0

**Relevant Coursework**: Data Structures, Algorithms, Database Systems, Software Engineering
**Honors**: Magna Cum Laude, Dean's List`,

    'Skills': `**Programming Languages**: JavaScript, TypeScript, Python, Java, C++
**Frameworks & Libraries**: React, Angular, Node.js, Express.js, Spring Boot
**Databases**: PostgreSQL, MongoDB, Redis
**Cloud & DevOps**: AWS, Docker, Kubernetes, Jenkins
**Tools**: Git, VS Code, IntelliJ IDEA, Postman`,

    'Projects': `### E-Commerce Platform | 2023
- Built full-stack application using React, Node.js, and PostgreSQL
- Implemented payment processing with Stripe API
- Deployed on AWS with Docker containers
- **Technologies**: React, Node.js, PostgreSQL, AWS, Docker

### Task Management App | 2022
- Developed collaborative task management tool with real-time updates
- Used WebSocket for live collaboration features
- Integrated with Google Calendar API
- **Technologies**: Vue.js, Socket.io, MongoDB, Google APIs`,

    'Certifications': `- AWS Certified Solutions Architect (2023)
- Google Cloud Professional Developer (2022)
- Certified Scrum Master (2021)`
  };

  return examples[sectionName] || 'Add your relevant information here...';
}

function generateFormattingRules(): Array<string> {
  return [
    '**Name**: Use H1 heading (# Your Name)',
    '**Sections**: Use H2 headings (## Section Name)',
    '**Job Titles**: Use H3 headings (### Job Title)',
    '**Dates**: Use MM/YYYY format (e.g., 01/2023)',
    '**No Personal Pronouns**: Avoid "I", "me", "my" - use action verbs',
    '**Bullet Points**: Use - for lists',
    '**Consistent Formatting**: Maintain same date format throughout',
    '**Professional Language**: Use strong action verbs',
    '**Quantify Achievements**: Include numbers and metrics',
    '**ATS-Friendly**: Avoid graphics, tables, or complex formatting',
    '**Contact Information**: Include email, phone, location, and professional profiles',
    '**Reverse Chronological Order**: List most recent experience first',
    '**Action Verbs**: Start bullet points with strong action verbs',
    '**Keywords**: Include industry-specific keywords from job descriptions',
    '**Length**: Keep resume to 1-2 pages for most positions'
  ];
}

export default getResumeTemplateModule;
