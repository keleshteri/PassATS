import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { ValidateResumeTool } from '../../build/application/tools/validate-resume.js';
import { MarkdownValidator } from '../../build/domain/validators/markdown-validator.js';
import { GenerationService } from '../../build/application/services/generation-service.js';
import { DocxGenerator } from '../../build/infrastructure/generators/docx-generator.js';
import { PdfGenerator } from '../../build/infrastructure/generators/pdf-generator.js';
import { HtmlGenerator } from '../../build/infrastructure/generators/html-generator.js';
import { MarkdownParser } from '../../build/infrastructure/parsers/markdown-parser.js';
import { TemplateLoader } from '../../build/infrastructure/templates/template-loader.js';

describe('Integration Test: Validation Workflow', () => {
  let validateResumeTool: ValidateResumeTool;

  before(async () => {
    // Initialize dependencies
    const markdownValidator = new MarkdownValidator();
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

    validateResumeTool = new ValidateResumeTool(markdownValidator, generationService);
  });

  it('should validate a well-formatted resume successfully', async () => {
    const validResume = `# John Doe
Email: john.doe@email.com
Phone: +1 (555) 123-4567
Location: San Francisco, CA
LinkedIn: https://linkedin.com/in/johndoe

## Professional Summary

Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies.

## Work Experience

### Senior Software Engineer | Tech Corp | 01/2020 - Present
- Led development of microservices architecture serving 100k+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored 3 junior developers and conducted code reviews

### Software Engineer | Startup Inc | 06/2018 - 12/2019
- Developed REST APIs using Node.js and Express.js
- Integrated third-party services and payment processing
- Participated in agile development process

## Education

### Bachelor of Science in Computer Science
University of California | San Francisco, CA | 05/2018
GPA: 3.7/4.0

## Skills

**Programming Languages**: JavaScript, TypeScript, Python, Java
**Frameworks**: React, Angular, Node.js, Express.js
**Databases**: PostgreSQL, MongoDB, Redis
**Cloud**: AWS, Docker, Kubernetes`;

    const result = await validateResumeTool.execute({ markdown: validResume });
    
    assert(result.valid === true, 'Valid resume should pass validation');
    assert(Array.isArray(result.errors), 'Should return errors array');
    assert(Array.isArray(result.warnings), 'Should return warnings array');
    assert(Array.isArray(result.suggestions), 'Should return suggestions array');
    assert(typeof result.statistics === 'object', 'Should return statistics object');
    
    assert(result.errors.length === 0, 'Valid resume should have no errors');
    assert(result.statistics.hasContactInfo === true, 'Should detect contact information');
    assert(result.statistics.hasWorkExperience === true, 'Should detect work experience');
    assert(result.statistics.hasEducation === true, 'Should detect education');
    assert(result.statistics.hasSkills === true, 'Should detect skills');
  });

  it('should identify missing required sections', async () => {
    const incompleteResume = `# Jane Smith
Email: jane.smith@email.com

## Work Experience

### Software Developer | Company A | 01/2020 - Present
- Developed web applications
- Collaborated with team members`;

    const result = await validateResumeTool.execute({ markdown: incompleteResume });
    
    assert(result.valid === false, 'Incomplete resume should fail validation');
    assert(result.errors.length > 0, 'Should have validation errors');
    assert(result.statistics.hasContactInfo === true, 'Should detect contact information');
    assert(result.statistics.hasWorkExperience === true, 'Should detect work experience');
    assert(result.statistics.hasEducation === false, 'Should detect missing education');
    assert(result.statistics.hasSkills === false, 'Should detect missing skills');
  });

  it('should detect invalid email format', async () => {
    const invalidEmailResume = `# Bob Johnson
Email: invalid-email-format
Phone: +1 (555) 123-4567

## Work Experience

### Developer | Company | 01/2020 - Present
- Built applications`;

    const result = await validateResumeTool.execute({ markdown: invalidEmailResume });
    
    assert(result.valid === false, 'Resume with invalid email should fail validation');
    assert(result.errors.length > 0, 'Should have validation errors');
    
    const emailError = result.errors.find(error => 
      error.message.toLowerCase().includes('email') || 
      error.code === 'INVALID_EMAIL'
    );
    assert(emailError !== undefined, 'Should detect invalid email format');
  });

  it('should detect invalid phone format', async () => {
    const invalidPhoneResume = `# Alice Brown
Email: alice@email.com
Phone: 555-123-4567

## Work Experience

### Developer | Company | 01/2020 - Present
- Built applications`;

    const result = await validateResumeTool.execute({ markdown: invalidPhoneResume });
    
    assert(result.valid === false, 'Resume with invalid phone should fail validation');
    assert(result.errors.length > 0, 'Should have validation errors');
    
    const phoneError = result.errors.find(error => 
      error.message.toLowerCase().includes('phone') || 
      error.code === 'INVALID_PHONE'
    );
    assert(phoneError !== undefined, 'Should detect invalid phone format');
  });

  it('should detect personal pronouns', async () => {
    const pronounResume = `# Charlie Wilson
Email: charlie@email.com
Phone: +1 (555) 123-4567

## Work Experience

### Developer | Company | 01/2020 - Present
- I developed web applications
- My team and I collaborated on projects
- I was responsible for leading the project`;

    const result = await validateResumeTool.execute({ markdown: pronounResume });
    
    assert(Array.isArray(result.warnings), 'Should return warnings array');
    
    const pronounWarning = result.warnings.find(warning => 
      warning.message.toLowerCase().includes('pronoun') ||
      warning.message.toLowerCase().includes('i ')
    );
    assert(pronounWarning !== undefined, 'Should detect personal pronouns');
  });

  it('should provide actionable suggestions', async () => {
    const resumeNeedingImprovement = `# David Lee
Email: david@email.com

## Work Experience

### Developer | Company | 01/2020 - Present
- Did some work
- Helped with projects`;

    const result = await validateResumeTool.execute({ markdown: resumeNeedingImprovement });
    
    assert(Array.isArray(result.suggestions), 'Should return suggestions array');
    assert(result.suggestions.length > 0, 'Should provide suggestions for improvement');
    
    // Check for specific types of suggestions
    const hasContactSuggestion = result.suggestions.some(suggestion => 
      suggestion.toLowerCase().includes('contact')
    );
    const hasActionVerbSuggestion = result.suggestions.some(suggestion => 
      suggestion.toLowerCase().includes('action verb') || suggestion.toLowerCase().includes('verb')
    );
    
    assert(hasContactSuggestion || hasActionVerbSuggestion, 'Should provide relevant suggestions');
  });

  it('should calculate accurate statistics', async () => {
    const resume = `# Emma Davis
Email: emma@email.com
Phone: +1 (555) 123-4567

## Work Experience

### Developer | Company | 01/2020 - Present
- Built applications
- Collaborated with team

## Education

### Computer Science Degree
University | 2020

## Skills

JavaScript, Python, React`;

    const result = await validateResumeTool.execute({ markdown: resume });
    
    assert(typeof result.statistics === 'object', 'Should return statistics object');
    assert(typeof result.statistics.wordCount === 'number', 'Should calculate word count');
    assert(typeof result.statistics.sectionCount === 'number', 'Should calculate section count');
    assert(typeof result.statistics.hasContactInfo === 'boolean', 'Should detect contact info');
    assert(typeof result.statistics.hasWorkExperience === 'boolean', 'Should detect work experience');
    assert(typeof result.statistics.hasEducation === 'boolean', 'Should detect education');
    assert(typeof result.statistics.hasSkills === 'boolean', 'Should detect skills');
    
    assert(result.statistics.wordCount > 0, 'Should have positive word count');
    assert(result.statistics.sectionCount > 0, 'Should have positive section count');
    assert(result.statistics.hasContactInfo === true, 'Should detect contact information');
    assert(result.statistics.hasWorkExperience === true, 'Should detect work experience');
    assert(result.statistics.hasEducation === true, 'Should detect education');
    assert(result.statistics.hasSkills === true, 'Should detect skills');
  });

  it('should handle different detail levels', async () => {
    const resume = `# Frank Miller
Email: frank@email.com

## Work Experience

### Developer | Company | 01/2020 - Present
- Built applications`;

    // Test basic detail level
    const basicResult = await validateResumeTool.execute({ 
      markdown: resume, 
      detailLevel: 'basic' 
    });
    
    // Test detailed level
    const detailedResult = await validateResumeTool.execute({ 
      markdown: resume, 
      detailLevel: 'detailed' 
    });
    
    // Test comprehensive level
    const comprehensiveResult = await validateResumeTool.execute({ 
      markdown: resume, 
      detailLevel: 'comprehensive' 
    });
    
    assert(typeof basicResult === 'object', 'Basic validation should return result');
    assert(typeof detailedResult === 'object', 'Detailed validation should return result');
    assert(typeof comprehensiveResult === 'object', 'Comprehensive validation should return result');
    
    // More detailed levels should generally provide more comprehensive feedback
    assert(comprehensiveResult.suggestions.length >= basicResult.suggestions.length, 
           'Comprehensive level should provide at least as many suggestions as basic');
  });

  it('should handle validation workflow from quickstart', async () => {
    // This test simulates the validation workflow from quickstart.md
    
    // Step 1: Create a sample resume
    const sampleResume = `# Sarah Johnson
Email: sarah.johnson@email.com
Phone: +1 (555) 123-4567
Location: New York, NY
LinkedIn: https://linkedin.com/in/sarahjohnson

## Professional Summary

Results-driven marketing professional with 7+ years of experience in digital marketing, brand management, and campaign development.

## Work Experience

### Senior Marketing Manager | Global Corp | 03/2020 - Present
- Led cross-functional teams of 8+ members to execute integrated marketing campaigns
- Increased brand awareness by 40% through strategic social media initiatives
- Managed $2M annual marketing budget and achieved 25% ROI improvement

### Marketing Specialist | StartupXYZ | 06/2018 - 02/2020
- Developed and executed digital marketing strategies for B2B SaaS products
- Generated 150% increase in qualified leads through targeted content marketing
- Collaborated with sales team to align marketing efforts with revenue goals

## Education

### Master of Business Administration
New York University | New York, NY | 05/2018
Concentration: Marketing and Digital Strategy

### Bachelor of Arts in Communications
University of California | Los Angeles, CA | 05/2016
GPA: 3.8/4.0

## Skills

**Digital Marketing**: SEO/SEM, Google Analytics, Facebook Ads, LinkedIn Marketing
**Marketing Automation**: HubSpot, Marketo, Salesforce Marketing Cloud
**Analytics & Data**: Google Analytics, Tableau, Excel, A/B Testing
**Creative Tools**: Adobe Creative Suite, Canva, Figma`;

    // Step 2: Validate the resume
    const validationResult = await validateResumeTool.execute({ 
      markdown: sampleResume,
      detailLevel: 'detailed'
    });
    
    // Step 3: Verify validation results
    assert(validationResult.valid === true, 'Sample resume should be valid');
    assert(validationResult.errors.length === 0, 'Sample resume should have no errors');
    assert(validationResult.statistics.hasContactInfo === true, 'Should detect complete contact info');
    assert(validationResult.statistics.hasWorkExperience === true, 'Should detect work experience');
    assert(validationResult.statistics.hasEducation === true, 'Should detect education');
    assert(validationResult.statistics.hasSkills === true, 'Should detect skills');
    assert(validationResult.suggestions.length > 0, 'Should provide improvement suggestions');
    
    console.log('✅ Validation workflow completed successfully');
    console.log(`   - Resume valid: ${validationResult.valid}`);
    console.log(`   - Errors: ${validationResult.errors.length}`);
    console.log(`   - Warnings: ${validationResult.warnings.length}`);
    console.log(`   - Suggestions: ${validationResult.suggestions.length}`);
    console.log(`   - Word count: ${validationResult.statistics.wordCount}`);
    console.log(`   - Sections: ${validationResult.statistics.sectionCount}`);
  });
});
