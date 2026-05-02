import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeAtsScore } from '../../build/application/tools/analyze-ats-score.js';

describe('analyze-ats-score MCP Tool Contract Tests', () => {
  const excellentResume = `# John Doe

**Email**: john@example.com | **Phone**: +12345678901 | **Location**: New York, NY
**LinkedIn**: https://linkedin.com/in/johndoe

## Professional Summary

Senior Software Engineer with 10 years of experience in enterprise software development and team leadership.

## Work Experience

### Lead Engineer at TechCompany
**New York, NY** | **01/2020 - Present**

- Architected scalable microservices handling 5M+ requests/day
- Led team of 8 engineers delivering 20+ features quarterly
- Reduced infrastructure costs by 35% through optimization

### Senior Developer at SoftwareCo
**Boston, MA** | **06/2015 - 12/2019**

- Developed customer-facing platform serving 100K+ users
- Implemented CI/CD pipeline reducing deployment time by 70%

## Education

### MS Computer Science - Stanford University
**Stanford, CA** | **Graduated: 05/2015**
GPA: 3.9

### BS Computer Engineering - MIT
**Cambridge, MA** | **Graduated: 05/2013**

## Skills

**Languages**: Java, Python, JavaScript, TypeScript, Go
**Frameworks**: Spring Boot, Django, React, Node.js, Express
**Tools**: Docker, Kubernetes, Jenkins, AWS, Terraform
**Methodologies**: Agile, Scrum, TDD, CI/CD`;

  const poorResume = `Bob
email: bob@email.com
phone: 1234567890

I worked at companies and did things.

I went to school.

I know programming.`;

  const mediocreResume = `# Jane Smith

**Email**: jane@example.com | **Phone**: +19876543210

## Work Experience

### Developer at Company
**Location** | **01/2020 - Present**

- Built applications
- Worked with team

## Education

### BS Computer Science - University
**Location** | **Graduated: 05/2019**

## Skills

**Languages**: JavaScript, Python`;

  describe('High-quality resume scoring', () => {
    it('should return high score for well-formatted ATS-friendly resume', async () => {
      const result = await analyzeAtsScore({
        content: excellentResume,
        detailLevel: 'detailed'
      });

      assert(result.score >= 85, 'Score should be 85 or higher');
      assert(result.rating === 'excellent', 'Rating should be excellent');
      assert(result.breakdown.formatting >= 25, 'Formatting score should be 25 or higher');
      assert(result.breakdown.keywords >= 20, 'Keywords score should be 20 or higher');
      assert(result.breakdown.technical >= 20, 'Technical score should be 20 or higher');
      assert(result.breakdown.readability >= 15, 'Readability score should be 15 or higher');
      assert(result.issues.length <= 3, 'Issues should be 3 or fewer');
      assert(result.strengths.length >= 8, 'Strengths should be 8 or more');
      
      // Score breakdown should sum to total score
      const totalBreakdown = result.breakdown.formatting + result.breakdown.keywords + 
                           result.breakdown.technical + result.breakdown.readability;
      assert.strictEqual(totalBreakdown, result.score);
    });

    it('should identify strengths in excellent resume', async () => {
      const result = await analyzeAtsScore({
        content: excellentResume,
        detailLevel: 'detailed'
      });

      assert(result.strengths.includes('Clear section structure with standard headings'));
      assert(result.strengths.includes('Excellent use of quantifiable achievements'));
      assert(result.strengths.includes('Proper date formatting'));
      assert(result.strengths.includes('Strong keyword presence'));
      assert(result.strengths.includes('Clean, single-column layout'));
      assert(result.strengths.includes('Reverse chronological order maintained'));
    });
  });

  describe('Poor quality resume scoring', () => {
    it('should return low score for poorly formatted resume', async () => {
      const result = await analyzeAtsScore({
        content: poorResume,
        detailLevel: 'comprehensive'
      });

      assert(result.score <= 40);
      assert.strictEqual(result.rating, 'poor');
      assert(result.issues.length >= 5);
      
      // Should have critical issues
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      assert(criticalIssues.length >= 3);
      
      // Score breakdown should sum to total score
      const totalBreakdown = result.breakdown.formatting + result.breakdown.keywords + 
                           result.breakdown.technical + result.breakdown.readability;
      assert.strictEqual(totalBreakdown, result.score);
    });

    it('should identify critical issues in poor resume', async () => {
      const result = await analyzeAtsScore({
        content: poorResume,
        detailLevel: 'comprehensive'
      });

      const issueDescriptions = result.issues.map(i => i.description);
      
      // Should identify major structural issues
      expect(issueDescriptions.some(d => d.includes('section') || d.includes('heading'))).toBe(true);
      expect(issueDescriptions.some(d => d.includes('format') || d.includes('structure'))).toBe(true);
      expect(issueDescriptions.some(d => d.includes('contact') || d.includes('email'))).toBe(true);
    });

    it('should provide high-impact recommendations for poor resume', async () => {
      const result = await analyzeAtsScore({
        content: poorResume,
        detailLevel: 'comprehensive'
      });

      assert(result.recommendations.length >= 5);
      
      // Recommendations should be sorted by potential gain (descending)
      for (let i = 1; i < result.recommendations.length; i++) {
        assert(result.recommendations[i-1].potentialGain >= 
          result.recommendations[i].potentialGain
        );
      }
      
      // Should have high-priority recommendations
      const highPriorityRecs = result.recommendations.filter(r => r.priority === 'high');
      assert(highPriorityRecs.length >= 3);
    });
  });

  describe('Missing sections detection', () => {
    it('should detect missing standard sections', async () => {
      const incompleteResume = `# Test User

**Email**: test@example.com | **Phone**: +11111111111

## Work Experience

### Engineer

- Worked on things`;

      const result = await analyzeAtsScore({
        content: incompleteResume,
        detailLevel: 'detailed'
      });

      const issueCategories = result.issues.map(i => i.category);
      assert(issueCategories.includes('structure'));
      
      const issueDescriptions = result.issues.map(i => i.description);
      expect(issueDescriptions.some(d => d.includes('Education'))).toBe(true);
      expect(issueDescriptions.some(d => d.includes('Skills'))).toBe(true);
      
      // Should recommend adding missing sections
      const recTitles = result.recommendations.map(r => r.title);
      expect(recTitles.some(t => t.includes('Education'))).toBe(true);
      expect(recTitles.some(t => t.includes('Skills'))).toBe(true);
    });
  });

  describe('Contact information validation', () => {
    it('should detect invalid contact information formats', async () => {
      const invalidContactResume = `# User Name

**Email**: not-an-email | **Phone**: 123-456-7890

## Work Experience

### Job

- Work

## Education

### Degree

## Skills

**Tech**: Something`;

      const result = await analyzeAtsScore({
        content: invalidContactResume,
        detailLevel: 'detailed'
      });

      const issueDescriptions = result.issues.map(i => i.description);
      expect(issueDescriptions.some(d => d.includes('email') || d.includes('Email'))).toBe(true);
      expect(issueDescriptions.some(d => d.includes('phone') || d.includes('Phone'))).toBe(true);
      expect(issueDescriptions.some(d => d.includes('E.164'))).toBe(true);
      
      // Should recommend fixing contact information
      const recTitles = result.recommendations.map(r => r.title);
      expect(recTitles.some(t => t.includes('contact') || t.includes('Contact'))).toBe(true);
    });
  });

  describe('Job description targeting', () => {
    it('should provide targeted recommendations based on job description', async () => {
      const jobDescription = 'Senior Python Developer needed with Django and AWS experience. Must have experience with microservices and REST APIs.';
      
      const result = await analyzeAtsScore({
        content: mediocreResume,
        jobDescription,
        detailLevel: 'comprehensive'
      });

      const issueDescriptions = result.issues.map(i => i.description);
      const recDescriptions = result.recommendations.map(r => r.description);
      
      // Should identify missing keywords from job description
      expect(issueDescriptions.some(d => d.includes('keyword') || d.includes('Python') || d.includes('Django'))).toBe(true);
      
      // Should recommend adding job-specific skills
      expect(recDescriptions.some(d => d.includes('Python') || d.includes('Django'))).toBe(true);
      expect(recDescriptions.some(d => d.includes('AWS') || d.includes('microservices'))).toBe(true);
    });
  });

  describe('Score breakdown validation', () => {
    it('should validate score breakdown sums to total score', async () => {
      const result = await analyzeAtsScore({
        content: mediocreResume,
        detailLevel: 'detailed'
      });

      const totalBreakdown = result.breakdown.formatting + result.breakdown.keywords + 
                           result.breakdown.technical + result.breakdown.readability;
      assert.strictEqual(totalBreakdown, result.score);
      
      // Individual breakdown scores should not exceed their maximums
      assert(result.breakdown.formatting <= 30);
      assert(result.breakdown.keywords <= 25);
      assert(result.breakdown.technical <= 25);
      assert(result.breakdown.readability <= 20);
    });
  });

  describe('Personal pronouns detection', () => {
    it('should identify personal pronouns as compatibility issue', async () => {
      const pronounResume = `# My Resume

**Email**: me@example.com | **Phone**: +15556667777

## About Me

I am a developer who loves to code. I have worked on many projects.

## My Experience

### My Job at Company

- I developed features
- I led my team

## My Education

### My Degree

## My Skills

**Languages**: JavaScript`;

      const result = await analyzeAtsScore({
        content: pronounResume,
        detailLevel: 'detailed'
      });

      const issueDescriptions = result.issues.map(i => i.description);
      expect(issueDescriptions.some(d => d.includes('pronoun') || d.includes('I') || d.includes('personal'))).toBe(true);
      
      const recDescriptions = result.recommendations.map(r => r.description);
      expect(recDescriptions.some(d => d.includes('pronoun') || d.includes('objective'))).toBe(true);
      
      // Score should be negatively impacted
      assert(result.score < 70);
    });
  });

  describe('Detail level variations', () => {
    it('should return basic analysis when detailLevel=basic', async () => {
      const result = await analyzeAtsScore({
        content: mediocreResume,
        detailLevel: 'basic'
      });

      assert(result.score !== undefined);
      assert(result.rating !== undefined);
      assert(result.issues.length <= 5); // Only major issues
      assert(result.recommendations.length <= 3); // Top recommendations only
      assert(result.strengths !== undefined);
      assert(result.strengths.length > 0);
    });

    it('should return comprehensive analysis when detailLevel=comprehensive', async () => {
      const result = await analyzeAtsScore({
        content: mediocreResume,
        detailLevel: 'comprehensive'
      });

      assert(result.score !== undefined);
      assert(result.rating !== undefined);
      assert(result.issues.length >= 3); // More detailed issues
      assert(result.recommendations.length >= 5); // More recommendations
      assert(result.strengths !== undefined);
      assert(result.metadata !== undefined);
    });

    it('should default to detailed level when not specified', async () => {
      const result = await analyzeAtsScore({
        content: mediocreResume
      });

      assert(result.score !== undefined);
      assert(result.rating !== undefined);
      assert(result.issues.length > 0);
      assert(result.recommendations.length > 0);
    });
  });

  describe('Metadata validation', () => {
    it('should include proper metadata in analysis results', async () => {
      const result = await analyzeAtsScore({
        content: excellentResume,
        detailLevel: 'detailed'
      });

      assert(result.metadata !== undefined);
      assert(result.metadata?.analyzerVersion !== undefined);
      assert(result.metadata?.analyzedAt !== undefined);
      assert(result.metadata?.resumeLength > 0);
      assert(result.metadata?.sectionsFound !== undefined);
      expect(Array.isArray(result.metadata?.sectionsFound)).toBe(true);
      
      // Check date format
      expect(() => new Date(result.metadata?.analyzedAt!)).not.toThrow();
      
      // Should identify sections
      assert(result.metadata?.sectionsFound.includes('Work Experience'));
      assert(result.metadata?.sectionsFound.includes('Education'));
      assert(result.metadata?.sectionsFound.includes('Skills'));
    });
  });

  describe('Rating calculation', () => {
    it('should calculate correct rating based on score', async () => {
      const testCases = [
        { content: excellentResume, expectedRating: 'excellent' },
        { content: mediocreResume, expectedRating: 'fair' },
        { content: poorResume, expectedRating: 'poor' }
      ];

      for (const testCase of testCases) {
        const result = await analyzeAtsScore({
          content: testCase.content,
          detailLevel: 'basic'
        });

        assert.strictEqual(result.rating, testCase.expectedRating);
        
        // Verify score ranges match ratings
        if (result.rating === 'excellent') {
          assert(result.score >= 86);
        } else if (result.rating === 'good') {
          assert(result.score >= 71);
          assert(result.score <= 85);
        } else if (result.rating === 'fair') {
          assert(result.score >= 41);
          assert(result.score <= 70);
        } else if (result.rating === 'poor') {
          assert(result.score <= 40);
        }
      }
    });
  });

  describe('Issue categorization', () => {
    it('should properly categorize issues by type', async () => {
      const result = await analyzeAtsScore({
        content: poorResume,
        detailLevel: 'comprehensive'
      });

      const categories = new Set(result.issues.map(i => i.category));
      const severities = new Set(result.issues.map(i => i.severity));
      
      // Should have multiple categories
      assert(categories.size >= 2);
      
      // Should have multiple severity levels
      assert(severities.size >= 2);
      
      // Each issue should have proper structure
      result.issues.forEach(issue => {
        assert(issue.category !== undefined);
        assert(issue.severity !== undefined);
        assert(issue.description !== undefined);
        assert(issue.impact >= 0);
        assert(['formatting', 'structure', 'keywords', 'compatibility', 'readability'].includes(issue.category));
        assert(['critical', 'warning', 'info'].includes(issue.severity));
      });
    });
  });

  describe('Recommendation quality', () => {
    it('should provide actionable recommendations with proper structure', async () => {
      const result = await analyzeAtsScore({
        content: poorResume,
        detailLevel: 'comprehensive'
      });

      result.recommendations.forEach(rec => {
        assert(rec.title !== undefined);
        assert(rec.description !== undefined);
        assert(rec.category !== undefined);
        assert(rec.potentialGain >= 0);
        assert(rec.priority !== undefined);
        
        assert(rec.title.length > 5);
        assert(rec.description.length > 20);
        assert(['formatting', 'structure', 'keywords', 'compatibility', 'readability'].includes(rec.category));
        assert(['high', 'medium', 'low'].includes(rec.priority));
      });
    });

    it('should prioritize recommendations by potential impact', async () => {
      const result = await analyzeAtsScore({
        content: poorResume,
        detailLevel: 'comprehensive'
      });

      // High priority recommendations should have higher potential gain
      const highPriorityRecs = result.recommendations.filter(r => r.priority === 'high');
      const lowPriorityRecs = result.recommendations.filter(r => r.priority === 'low');
      
      if (highPriorityRecs.length > 0 && lowPriorityRecs.length > 0) {
        const avgHighGain = highPriorityRecs.reduce((sum, r) => sum + r.potentialGain, 0) / highPriorityRecs.length;
        const avgLowGain = lowPriorityRecs.reduce((sum, r) => sum + r.potentialGain, 0) / lowPriorityRecs.length;
        
        assert(avgHighGain >= avgLowGain);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle empty or minimal content gracefully', async () => {
      const result = await analyzeAtsScore({
        content: '# Test\n\n**Email**: test@test.com',
        detailLevel: 'basic'
      });

      assert(result.score !== undefined);
      assert(result.rating !== undefined);
      assert(result.issues.length > 0);
      assert(result.recommendations.length > 0);
    });

    it('should handle very long content', async () => {
      const longContent = excellentResume + '\n\n' + 'Additional content. '.repeat(1000);
      
      const result = await analyzeAtsScore({
        content: longContent,
        detailLevel: 'basic'
      });

      assert(result.score !== undefined);
      assert(result.rating !== undefined);
      assert(result.metadata?.resumeLength > 1000);
    });
  });
});
