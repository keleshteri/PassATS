import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { GenerateResumeTool } from '../../build/application/tools/generate-resume.js';
import { GenerationService } from '../../build/application/services/generation-service.js';
import { DocxGenerator } from '../../build/infrastructure/generators/docx-generator.js';
import { PdfGenerator } from '../../build/infrastructure/generators/pdf-generator.js';
import { HtmlGenerator } from '../../build/infrastructure/generators/html-generator.js';
import { MarkdownParser } from '../../build/infrastructure/parsers/markdown-parser.js';
import { TemplateLoader } from '../../build/infrastructure/templates/template-loader.js';

describe('Integration Test: Document Generation Workflow', () => {
  let generateResumeTool: GenerateResumeTool;

  before(async () => {
    // Initialize dependencies
    const docxGenerator = new DocxGenerator();
    const pdfGenerator = new PdfGenerator();
    const htmlGenerator = new HtmlGenerator();
    const markdownParser = new MarkdownParser();
    const templateLoader = new TemplateLoader();
    
    const generationService = new GenerationService(
      docxGenerator,
      pdfGenerator,
      htmlGenerator,
      markdownParser,
      templateLoader
    );

    generateResumeTool = new GenerateResumeTool(generationService);
  });

  const sampleResume = `# Michael Chen
Email: michael.chen@email.com
Phone: +1 (555) 987-6543
Location: Seattle, WA
LinkedIn: https://linkedin.com/in/michaelchen
GitHub: https://github.com/michaelchen

## Professional Summary

Experienced product manager with 6+ years of experience in technology product development, specializing in user experience optimization and data-driven decision making.

## Work Experience

### Senior Product Manager | TechFlow Inc | 02/2021 - Present
- Led product strategy for mobile application serving 500k+ active users
- Increased user engagement by 35% through A/B testing and feature optimization
- Collaborated with engineering teams to deliver 12 major product releases
- Managed cross-functional teams of 15+ members across design, engineering, and marketing

### Product Manager | StartupCo | 08/2019 - 01/2021
- Developed product roadmap for B2B SaaS platform from concept to launch
- Conducted user research and interviews to identify product-market fit
- Implemented agile development processes reducing time-to-market by 40%
- Achieved 200% growth in monthly recurring revenue within 18 months

## Education

### Master of Science in Computer Science
Stanford University | Stanford, CA | 06/2019
Specialization: Human-Computer Interaction

### Bachelor of Science in Engineering
University of Washington | Seattle, WA | 06/2017
GPA: 3.9/4.0

## Skills

**Product Management**: Roadmapping, User Research, A/B Testing, Product Analytics
**Technical Skills**: SQL, Python, JavaScript, Git, Jira, Confluence
**Design Tools**: Figma, Sketch, Adobe XD, InVision
**Analytics**: Google Analytics, Mixpanel, Amplitude, Tableau`;

  it('should generate DOCX document successfully', async () => {
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'docx',
      templateId: 'professional-classic'
    });
    
    assert(result.success === true, 'DOCX generation should succeed');
    assert(Array.isArray(result.files), 'Should return files array');
    assert(result.files.length === 1, 'Should return exactly one file');
    
    const file = result.files[0];
    assert(file.format === 'docx', 'File format should be docx');
    assert(typeof file.content === 'string', 'File content should be base64 string');
    assert(file.filename.includes('.docx'), 'Filename should have .docx extension');
    assert(file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Should have correct MIME type');
    assert(file.size > 0, 'File size should be positive');
    
    // Verify base64 content can be decoded
    const buffer = Buffer.from(file.content, 'base64');
    assert(buffer.length > 0, 'Base64 content should decode to non-empty buffer');
  });

  it('should generate PDF document successfully', async () => {
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'pdf',
      templateId: 'professional-classic'
    });
    
    assert(result.success === true, 'PDF generation should succeed');
    assert(Array.isArray(result.files), 'Should return files array');
    assert(result.files.length === 1, 'Should return exactly one file');
    
    const file = result.files[0];
    assert(file.format === 'pdf', 'File format should be pdf');
    assert(typeof file.content === 'string', 'File content should be base64 string');
    assert(file.filename.includes('.pdf'), 'Filename should have .pdf extension');
    assert(file.mimeType === 'application/pdf', 'Should have correct MIME type');
    assert(file.size > 0, 'File size should be positive');
    
    // Verify base64 content can be decoded
    const buffer = Buffer.from(file.content, 'base64');
    assert(buffer.length > 0, 'Base64 content should decode to non-empty buffer');
  });

  it('should generate HTML document successfully', async () => {
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'html',
      templateId: 'professional-classic'
    });
    
    assert(result.success === true, 'HTML generation should succeed');
    assert(Array.isArray(result.files), 'Should return files array');
    assert(result.files.length === 1, 'Should return exactly one file');
    
    const file = result.files[0];
    assert(file.format === 'html', 'File format should be html');
    assert(typeof file.content === 'string', 'File content should be base64 string');
    assert(file.filename.includes('.html'), 'Filename should have .html extension');
    assert(file.mimeType === 'text/html', 'Should have correct MIME type');
    assert(file.size > 0, 'File size should be positive');
    
    // Verify base64 content can be decoded and contains HTML
    const buffer = Buffer.from(file.content, 'base64');
    const htmlContent = buffer.toString('utf8');
    assert(htmlContent.includes('<html'), 'HTML content should contain html tag');
    assert(htmlContent.includes('Michael Chen'), 'HTML should contain resume content');
  });

  it('should generate all formats simultaneously', async () => {
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'all',
      templateId: 'professional-classic'
    });
    
    assert(result.success === true, 'Multi-format generation should succeed');
    assert(Array.isArray(result.files), 'Should return files array');
    assert(result.files.length === 3, 'Should return exactly three files');
    
    // Check that all three formats are present
    const formats = result.files.map(file => file.format);
    assert(formats.includes('docx'), 'Should include DOCX format');
    assert(formats.includes('pdf'), 'Should include PDF format');
    assert(formats.includes('html'), 'Should include HTML format');
    
    // Verify each file has correct properties
    result.files.forEach(file => {
      assert(typeof file.content === 'string', 'Each file should have base64 content');
      assert(file.size > 0, 'Each file should have positive size');
      assert(typeof file.filename === 'string', 'Each file should have filename');
      assert(typeof file.mimeType === 'string', 'Each file should have MIME type');
    });
  });

  it('should use custom filename when provided', async () => {
    const customFilename = 'my-custom-resume';
    
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'docx',
      filename: customFilename
    });
    
    assert(result.success === true, 'Generation with custom filename should succeed');
    const file = result.files[0];
    assert(file.filename.includes(customFilename), 'Filename should include custom name');
    assert(file.filename.endsWith('.docx'), 'Should still have correct extension');
  });

  it('should auto-generate filename from resume name', async () => {
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'docx'
    });
    
    assert(result.success === true, 'Auto-filename generation should succeed');
    const file = result.files[0];
    
    // Should generate filename based on the name in the resume
    assert(file.filename.includes('michael-chen'), 'Filename should be based on resume name');
    assert(file.filename.endsWith('.docx'), 'Should have correct extension');
  });

  it('should include metadata when requested', async () => {
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'docx',
      includeMetadata: true
    });
    
    assert(result.success === true, 'Generation with metadata should succeed');
    const file = result.files[0];
    
    assert(file.metadata !== undefined, 'File should include metadata');
    assert(file.metadata.template === 'professional-classic', 'Should include template info');
    assert(typeof file.metadata.generatedAt === 'string', 'Should include generation timestamp');
    assert(file.metadata.format === 'docx', 'Should include format info');
  });

  it('should validate content before generation when enabled', async () => {
    const invalidResume = `# Invalid Resume
Email: invalid-email
Phone: invalid-phone

## Work Experience
### Job | Company | Date
- Did some work`;

    const result = await generateResumeTool.execute({
      markdown: invalidResume,
      format: 'docx',
      validateContent: true
    });
    
    assert(result.success === false, 'Generation should fail for invalid content');
    assert(result.files.length === 0, 'Should not generate files for invalid content');
    assert(result.validation !== undefined, 'Should include validation results');
    assert(result.validation.valid === false, 'Validation should indicate invalid content');
    assert(result.validation.errors.length > 0, 'Should have validation errors');
  });

  it('should handle different templates', async () => {
    // Test with modern template
    const result = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'docx',
      templateId: 'modern-tech'
    });
    
    assert(result.success === true, 'Generation with modern template should succeed');
    const file = result.files[0];
    assert(file.metadata.template === 'modern-tech', 'Should use correct template');
  });

  it('should handle generation workflow from quickstart', async () => {
    // This test simulates the document generation workflow from quickstart.md
    
    // Step 1: Generate DOCX document
    const docxResult = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'docx',
      templateId: 'professional-classic',
      includeMetadata: true
    });
    
    assert(docxResult.success === true, 'DOCX generation should succeed');
    assert(docxResult.files.length === 1, 'Should generate one DOCX file');
    
    const docxFile = docxResult.files[0];
    assert(docxFile.format === 'docx', 'Should be DOCX format');
    assert(docxFile.size > 1000, 'DOCX file should have reasonable size');
    
    // Step 2: Generate PDF document
    const pdfResult = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'pdf',
      templateId: 'professional-classic',
      includeMetadata: true
    });
    
    assert(pdfResult.success === true, 'PDF generation should succeed');
    assert(pdfResult.files.length === 1, 'Should generate one PDF file');
    
    const pdfFile = pdfResult.files[0];
    assert(pdfFile.format === 'pdf', 'Should be PDF format');
    assert(pdfFile.size > 1000, 'PDF file should have reasonable size');
    
    // Step 3: Generate HTML document
    const htmlResult = await generateResumeTool.execute({
      markdown: sampleResume,
      format: 'html',
      templateId: 'professional-classic',
      includeMetadata: true
    });
    
    assert(htmlResult.success === true, 'HTML generation should succeed');
    assert(htmlResult.files.length === 1, 'Should generate one HTML file');
    
    const htmlFile = htmlResult.files[0];
    assert(htmlFile.format === 'html', 'Should be HTML format');
    assert(htmlFile.size > 500, 'HTML file should have reasonable size');
    
    // Verify content preservation across formats
    const docxBuffer = Buffer.from(docxFile.content, 'base64');
    const pdfBuffer = Buffer.from(pdfFile.content, 'base64');
    const htmlBuffer = Buffer.from(htmlFile.content, 'base64');
    
    assert(docxBuffer.length > 0, 'DOCX content should be preserved');
    assert(pdfBuffer.length > 0, 'PDF content should be preserved');
    assert(htmlBuffer.length > 0, 'HTML content should be preserved');
    
    console.log('✅ Document generation workflow completed successfully');
    console.log(`   - DOCX file: ${docxFile.filename} (${docxFile.size} bytes)`);
    console.log(`   - PDF file: ${pdfFile.filename} (${pdfFile.size} bytes)`);
    console.log(`   - HTML file: ${htmlFile.filename} (${htmlFile.size} bytes)`);
    console.log(`   - Processing time: ${docxResult.processingTime}ms`);
  });
});
