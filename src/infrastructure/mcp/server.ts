import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import { TemplateLoader } from '../templates/template-loader.js';
import { GenerationService } from '../../application/services/generation-service.js';
import { ScoringService } from '../../application/services/scoring-service.js';
import { TemplateService } from '../../application/services/template-service.js';
import { analyzeATSScoreTool, AnalyzeATSScoreTool } from '../../application/tools/analyze-ats-score.js';

// Import services

// Import infrastructure
import { generateResumeTool, GenerateResumeTool } from '../../application/tools/generate-resume.js';
import { getResumeTemplateTool, GetResumeTemplateTool } from '../../application/tools/get-resume-template.js';
import { listResumeTemplatesTool, ListResumeTemplatesTool } from '../../application/tools/list-resume-templates.js';
import { validateResumeTool, ValidateResumeTool } from '../../application/tools/validate-resume.js';
import { ATSScorer } from '../../domain/scoring/ats-scorer.js';
import { MarkdownValidator } from '../../domain/validators/markdown-validator.js';
import { DocxGenerator } from '../generators/docx-generator.js';
import { HtmlGenerator } from '../generators/html-generator.js';
import { PdfGenerator } from '../generators/pdf-generator.js';
import { MarkdownParser } from '../parsers/markdown-parser.js';

export class ResumeBuilderMCPServer {
  private readonly server: Server;
  private readonly tools = new Map<string, any>();

  constructor() {
    this.server = new Server(
      {
        name: 'resume-builder-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupHandlers();
  }

  private setupTools(): void {
    // Initialize infrastructure services
    const templateLoader = new TemplateLoader();
    const markdownParser = new MarkdownParser();
    const markdownValidator = new MarkdownValidator(''); // Will be initialized with content when needed
    const docxGenerator = new DocxGenerator(templateLoader);
    const htmlGenerator = new HtmlGenerator(templateLoader);
    const pdfGenerator = new PdfGenerator(templateLoader, htmlGenerator);
    const atsScorer = new ATSScorer();

    // Initialize application services
    const templateService = new TemplateService(templateLoader);
    const generationService = new GenerationService(
      docxGenerator,
      pdfGenerator,
      htmlGenerator,
      markdownParser,
      templateLoader
    );
    const scoringService = new ScoringService(atsScorer, markdownParser);

    // Initialize tools
    const validateResumeToolImpl = new ValidateResumeTool(markdownValidator, generationService);
    const getResumeTemplateToolImpl = new GetResumeTemplateTool(templateService);
    const listResumeTemplatesToolImpl = new ListResumeTemplatesTool(templateService);
    const generateResumeToolImpl = new GenerateResumeTool(generationService);
    const analyzeATSScoreToolImpl = new AnalyzeATSScoreTool(scoringService);

    // Register tools
    this.tools.set('validate-resume', validateResumeToolImpl);
    this.tools.set('get-resume-template', getResumeTemplateToolImpl);
    this.tools.set('list-resume-templates', listResumeTemplatesToolImpl);
    this.tools.set('generate-resume', generateResumeToolImpl);
    this.tools.set('analyze-ats-score', analyzeATSScoreToolImpl);
  }

  private setupHandlers(): void {
    // Handle list tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'validate-resume',
            description: validateResumeTool.description,
            inputSchema: validateResumeTool.inputSchema,
          },
          {
            name: 'get-resume-template',
            description: getResumeTemplateTool.description,
            inputSchema: getResumeTemplateTool.inputSchema,
          },
          {
            name: 'list-resume-templates',
            description: listResumeTemplatesTool.description,
            inputSchema: listResumeTemplatesTool.inputSchema,
          },
          {
            name: 'generate-resume',
            description: generateResumeTool.description,
            inputSchema: generateResumeTool.inputSchema,
          },
          {
            name: 'analyze-ats-score',
            description: analyzeATSScoreTool.description,
            inputSchema: analyzeATSScoreTool.inputSchema,
          },
        ],
      };
    });

    // Handle call tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const tool = this.tools.get(name);
        if (!tool) {
          throw new Error(`Tool '${name}' not found`);
        }

        const result = await tool.execute(args);

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool '${name}': ${error}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Resume Builder MCP Server started');
  }

  async stop(): Promise<void> {
    // Cleanup resources if needed
    console.error('Resume Builder MCP Server stopped');
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ResumeBuilderMCPServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  // Start the server
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
