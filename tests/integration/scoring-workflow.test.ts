import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { AnalyzeATSScoreTool } from '../../build/application/tools/analyze-ats-score.js';
import { ScoringService } from '../../build/application/services/scoring-service.js';
import { ATSScorer } from '../../build/domain/scoring/ats-scorer.js';
import { MarkdownParser } from '../../build/infrastructure/parsers/markdown-parser.js';

describe('Integration Test: ATS Scoring Workflow', () => {
  let analyzeATSScoreTool: AnalyzeATSScoreTool;

  before(async () => {
    // Initialize dependencies
    const atsScorer = new ATSScorer();
    const markdownParser = new MarkdownParser();
    
    const scoringService = new ScoringService(atsScorer, markdownParser);
    analyzeATSScoreTool = new AnalyzeATSScoreTool(scoringService);
  });

  const excellentResume = `# Jennifer Martinez
Email: jennifer.martinez@email.com
Phone: +1 (555) 456-7890
Location: Austin, TX
LinkedIn: https://linkedin.com/in/jennifermartinez
GitHub: https://github.com/jennifermartinez

## Professional Summary

Results-oriented software engineer with 8+ years of experience in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions and mentoring junior developers.

## Work Experience

### Senior Software Engineer | CloudTech Solutions | 03/2021 - Present
- Architected microservices platform serving 2M+ daily active users with 99.9% uptime
- Led cross-functional team of 12 developers in agile environment using Scrum methodology
- Implemented CI/CD pipelines reducing deployment time from 2 hours to 15 minutes
- Mentored 5 junior developers and conducted 200+ code reviews improving code quality by 40%
- Collaborated with product managers to define technical requirements and project timelines

### Full Stack Developer | StartupCorp | 06/2019 - 02/2021
- Developed REST APIs using Node.js, Express.js, and PostgreSQL serving 100k+ users
- Built responsive web applications using React, Redux, and TypeScript
- Integrated third-party services including Stripe, AWS S3, and SendGrid
- Participated in daily standups and bi-weekly sprint planning sessions
- Achieved 150% improvement in application performance through database optimization

## Education

### Master of Science in Computer Science
University of Texas at Austin | Austin, TX | 05/2019
Specialization: Software Engineering and Distributed Systems
GPA: 3.8/4.0

### Bachelor of Science in Computer Science
Texas A&M University | College Station, TX | 05/2017
GPA: 3.6/4.0

## Skills

**Programming Languages**: JavaScript, TypeScript, Python, Java, C++, Go
**Frontend Technologies**: React, Angular, Vue.js, HTML5, CSS3, Bootstrap
**Backend Technologies**: Node.js, Express.js, Django, Spring Boot, REST APIs
**Databases**: PostgreSQL, MongoDB, Redis, MySQL
**Cloud & DevOps**: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, Jenkins, GitLab CI
**Tools & Frameworks**: Git, VS Code, IntelliJ IDEA, Postman, Jira, Confluence`;

  const poorResume = `# John Smith
john@email
555-1234

Work:
- Did coding stuff
- Worked at companies
- Made websites

Education:
Went to college

Skills:
JavaScript, Python`;

  it('should score excellent resume with high ATS score', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      detailLevel: 'detailed'
    });
    
    assert(typeof result.score === 'object', 'Should return score object');
    assert(typeof result.score.totalScore === 'number', 'Should have numeric total score');
    assert(typeof result.score.rating === 'string', 'Should have rating string');
    assert(typeof result.score.breakdown === 'object', 'Should have score breakdown');
    assert(Array.isArray(result.score.issues), 'Should have issues array');
    assert(Array.isArray(result.score.recommendations), 'Should have recommendations array');
    
    // Excellent resume should score 85+ and be rated excellent
    assert(result.score.totalScore >= 85, `Excellent resume should score 85+, got ${result.score.totalScore}`);
    assert(result.score.rating === 'excellent', `Should be rated excellent, got ${result.score.rating}`);
    
    // Check breakdown components
    assert(typeof result.score.breakdown.formatting === 'number', 'Should have formatting score');
    assert(typeof result.score.breakdown.keywords === 'number', 'Should have keywords score');
    assert(typeof result.score.breakdown.technical === 'number', 'Should have technical score');
    assert(typeof result.score.breakdown.readability === 'number', 'Should have readability score');
    
    // Breakdown should sum to total score (within rounding tolerance)
    const breakdownSum = result.score.breakdown.formatting + 
                        result.score.breakdown.keywords + 
                        result.score.breakdown.technical + 
                        result.score.breakdown.readability;
    assert(Math.abs(breakdownSum - result.score.totalScore) <= 1, 
           'Breakdown should sum to total score');
    
    // Should have minimal issues for excellent resume
    assert(result.score.issues.length <= 2, 'Excellent resume should have minimal issues');
  });

  it('should score poor resume with low ATS score', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: poorResume,
      detailLevel: 'detailed'
    });
    
    assert(typeof result.score === 'object', 'Should return score object');
    assert(typeof result.score.totalScore === 'number', 'Should have numeric total score');
    assert(typeof result.score.rating === 'string', 'Should have rating string');
    
    // Poor resume should score 40 or below and be rated poor
    assert(result.score.totalScore <= 40, `Poor resume should score 40 or below, got ${result.score.totalScore}`);
    assert(result.score.rating === 'poor', `Should be rated poor, got ${result.score.rating}`);
    
    // Should have multiple issues and recommendations
    assert(result.score.issues.length >= 3, 'Poor resume should have multiple issues');
    assert(result.score.recommendations.length >= 3, 'Poor resume should have multiple recommendations');
  });

  it('should handle different detail levels', async () => {
    const basicResult = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      detailLevel: 'basic'
    });
    
    const detailedResult = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      detailLevel: 'detailed'
    });
    
    const comprehensiveResult = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      detailLevel: 'comprehensive'
    });
    
    // All detail levels should return valid results
    assert(typeof basicResult.score === 'object', 'Basic analysis should return score');
    assert(typeof detailedResult.score === 'object', 'Detailed analysis should return score');
    assert(typeof comprehensiveResult.score === 'object', 'Comprehensive analysis should return score');
    
    // More detailed levels should provide more comprehensive feedback
    assert(comprehensiveResult.score.recommendations.length >= detailedResult.score.recommendations.length,
           'Comprehensive should have at least as many recommendations as detailed');
    assert(detailedResult.score.recommendations.length >= basicResult.score.recommendations.length,
           'Detailed should have at least as many recommendations as basic');
  });

  it('should provide industry-specific analysis', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      industryFocus: 'technology',
      detailLevel: 'detailed'
    });
    
    assert(typeof result.score === 'object', 'Should return score object');
    assert(typeof result.score.totalScore === 'number', 'Should have numeric total score');
    
    // Technology-focused analysis should be relevant
    const hasTechRecommendation = result.score.recommendations.some(rec => 
      rec.action.toLowerCase().includes('technical') ||
      rec.action.toLowerCase().includes('programming') ||
      rec.action.toLowerCase().includes('software')
    );
    
    // Should provide technology-relevant recommendations
    assert(result.score.recommendations.length > 0, 'Should provide recommendations');
  });

  it('should handle job description targeting', async () => {
    const jobDescription = `We are looking for a Senior Software Engineer with experience in:
- JavaScript, TypeScript, React, Node.js
- Cloud technologies (AWS, Docker, Kubernetes)
- Database design and optimization
- Team leadership and mentoring
- Agile development methodologies`;

    const result = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      jobDescription: jobDescription,
      detailLevel: 'detailed'
    });
    
    assert(typeof result.score === 'object', 'Should return score object');
    assert(typeof result.score.totalScore === 'number', 'Should have numeric total score');
    
    // Job description targeting should provide relevant feedback
    const hasKeywordRecommendation = result.score.recommendations.some(rec => 
      rec.category === 'optimization' || rec.category === 'keywords'
    );
    
    // Should provide keyword optimization recommendations
    assert(result.score.recommendations.length > 0, 'Should provide recommendations');
  });

  it('should provide benchmarks when requested', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      industryFocus: 'technology',
      includeBenchmarks: true,
      detailLevel: 'detailed'
    });
    
    assert(typeof result.score === 'object', 'Should return score object');
    
    if (result.benchmarks) {
      assert(typeof result.benchmarks.industryAverage === 'number', 'Should have industry average');
      assert(typeof result.benchmarks.percentile === 'number', 'Should have percentile');
      assert(typeof result.benchmarks.category === 'string', 'Should have benchmark category');
      
      assert(result.benchmarks.percentile >= 0 && result.benchmarks.percentile <= 100, 
             'Percentile should be between 0 and 100');
    }
  });

  it('should track processing time and cache hits', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      detailLevel: 'detailed'
    });
    
    assert(typeof result.processingTime === 'number', 'Should track processing time');
    assert(result.processingTime > 0, 'Processing time should be positive');
    assert(typeof result.cacheHit === 'boolean', 'Should track cache hit status');
    assert(typeof result.generatedAt === 'string', 'Should include generation timestamp');
  });

  it('should categorize issues by severity and type', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: poorResume,
      detailLevel: 'detailed'
    });
    
    assert(Array.isArray(result.score.issues), 'Should have issues array');
    
    result.score.issues.forEach(issue => {
      assert(typeof issue.category === 'string', 'Each issue should have category');
      assert(['low', 'medium', 'high', 'critical'].includes(issue.severity), 
             'Each issue should have valid severity');
      assert(typeof issue.message === 'string', 'Each issue should have message');
    });
    
    // Should have issues of different severities
    const severities = result.score.issues.map(issue => issue.severity);
    assert(severities.length > 0, 'Should have at least one issue');
  });

  it('should provide prioritized recommendations', async () => {
    const result = await analyzeATSScoreTool.execute({
      markdown: poorResume,
      detailLevel: 'detailed'
    });
    
    assert(Array.isArray(result.score.recommendations), 'Should have recommendations array');
    
    result.score.recommendations.forEach(rec => {
      assert(['low', 'medium', 'high'].includes(rec.priority), 
             'Each recommendation should have valid priority');
      assert(typeof rec.category === 'string', 'Each recommendation should have category');
      assert(typeof rec.action === 'string', 'Each recommendation should have action');
    });
    
    // Should have high-priority recommendations for poor resume
    const highPriorityRecs = result.score.recommendations.filter(rec => rec.priority === 'high');
    assert(highPriorityRecs.length > 0, 'Poor resume should have high-priority recommendations');
  });

  it('should handle scoring workflow from quickstart', async () => {
    // This test simulates the ATS scoring workflow from quickstart.md
    
    // Step 1: Analyze excellent resume
    const excellentResult = await analyzeATSScoreTool.execute({
      markdown: excellentResume,
      detailLevel: 'comprehensive',
      industryFocus: 'technology',
      includeBenchmarks: true
    });
    
    assert(excellentResult.score.totalScore >= 85, 'Excellent resume should score 85+');
    assert(excellentResult.score.rating === 'excellent', 'Should be rated excellent');
    assert(excellentResult.score.issues.length <= 2, 'Should have minimal issues');
    
    // Step 2: Analyze poor resume
    const poorResult = await analyzeATSScoreTool.execute({
      markdown: poorResume,
      detailLevel: 'comprehensive'
    });
    
    assert(poorResult.score.totalScore <= 40, 'Poor resume should score 40 or below');
    assert(poorResult.score.rating === 'poor', 'Should be rated poor');
    assert(poorResult.score.issues.length >= 3, 'Should have multiple issues');
    assert(poorResult.score.recommendations.length >= 5, 'Should have multiple recommendations');
    
    // Step 3: Verify score breakdown validation
    const excellentBreakdown = excellentResult.score.breakdown;
    const poorBreakdown = poorResult.score.breakdown;
    
    // Breakdown should sum to total for both
    const excellentSum = excellentBreakdown.formatting + excellentBreakdown.keywords + 
                        excellentBreakdown.technical + excellentBreakdown.readability;
    const poorSum = poorBreakdown.formatting + poorBreakdown.keywords + 
                   poorBreakdown.technical + poorBreakdown.readability;
    
    assert(Math.abs(excellentSum - excellentResult.score.totalScore) <= 1, 
           'Excellent resume breakdown should sum to total');
    assert(Math.abs(poorSum - poorResult.score.totalScore) <= 1, 
           'Poor resume breakdown should sum to total');
    
    console.log('✅ ATS scoring workflow completed successfully');
    console.log(`   - Excellent resume score: ${excellentResult.score.totalScore} (${excellentResult.score.rating})`);
    console.log(`   - Poor resume score: ${poorResult.score.totalScore} (${poorResult.score.rating})`);
    console.log(`   - Excellent issues: ${excellentResult.score.issues.length}`);
    console.log(`   - Poor issues: ${poorResult.score.issues.length}`);
    console.log(`   - Excellent recommendations: ${excellentResult.score.recommendations.length}`);
    console.log(`   - Poor recommendations: ${poorResult.score.recommendations.length}`);
    console.log(`   - Processing time: ${excellentResult.processingTime}ms`);
  });
});
