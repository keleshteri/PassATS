# Quickstart Guide: Resume Builder MCP Server

**Feature**: Resume Builder
**Date**: 2025-10-04
**Purpose**: Quick validation and testing guide for the Resume Builder MCP server

## Overview
This quickstart demonstrates how to use the Resume Builder MCP server through its five core tools. It provides a step-by-step workflow from template retrieval to resume generation and ATS scoring.

---

## Prerequisites

### Environment Setup
```bash
# Node.js 18+ required
node --version  # Should be >= 18.0.0

# Install dependencies
npm install

# Build the project
npm run build

# Start the MCP server
npm start
```

### MCP Client Configuration
Add the server to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "resume-builder": {
      "command": "node",
      "args": ["path/to/resume-builder/dist/index.js"]
    }
  }
}
```

---

## Workflow 1: Get Resume Template

### Step 1: Retrieve Template Specification
**Tool**: `get-resume-template`

**Request**:
```json
{
  "format": "markdown"
}
```

**Expected Response**:
```json
{
  "template": "# [Full Name]\n\n**Email**: [email] | **Phone**: [+1234567890]...",
  "version": "1.0.0",
  "sections": [
    {
      "name": "Contact Information",
      "required": true,
      "description": "Name, email, phone, and optional social links"
    },
    ...
  ],
  "rules": [
    "Start with H1 heading for name",
    "Contact info on second line with bold labels",
    ...
  ]
}
```

**Validation**:
- ✅ Template contains all required sections
- ✅ Version is valid semver
- ✅ Rules array has at least 10 items
- ✅ Template is valid markdown

---

## Workflow 2: List Available Templates

### Step 2: Browse Templates
**Tool**: `list-resume-templates`

**Request**:
```json
{
  "category": "professional"
}
```

**Expected Response**:
```json
{
  "templates": [
    {
      "id": "professional-classic",
      "name": "Professional Classic",
      "description": "Traditional single-column format ideal for corporate roles",
      "category": "professional",
      "industryFocus": ["finance", "consulting", "legal"],
      "formalityLevel": "formal",
      "features": ["single-column", "serif-font", "minimal", "ats-optimized"],
      "version": "1.0.0"
    },
    ...
  ],
  "count": 2
}
```

**Validation**:
- ✅ Returns array of templates
- ✅ Count matches array length
- ✅ All templates have required fields
- ✅ Template IDs are unique
- ✅ Filtering by category works correctly

---

## Workflow 3: Validate Resume Content

### Step 3: Validate Markdown Resume
**Tool**: `validate-resume`

#### Valid Resume Test
**Request**:
```json
{
  "content": "# Jane Doe\n\n**Email**: jane@example.com | **Phone**: +12345678901 | **Location**: San Francisco, CA\n\n## Professional Summary\n\nSenior Software Engineer with 8 years of experience.\n\n## Work Experience\n\n### Senior Engineer at TechCorp\n**San Francisco, CA** | **01/2020 - Present**\n\n- Architected microservices handling 1M+ requests/day\n- Led team of 6 engineers\n- Reduced deployment time by 60%\n\n### Engineer at StartupCo\n**Remote** | **06/2017 - 12/2019**\n\n- Developed React dashboard serving 10K+ users\n- Implemented RESTful APIs\n\n## Education\n\n### BS Computer Science - MIT\n**Cambridge, MA** | **Graduated: 05/2016**\nGPA: 3.8\n\n## Skills\n\n**Languages**: JavaScript, Python, TypeScript\n**Frameworks**: React, Node.js, Django\n**Tools**: Docker, Kubernetes, AWS",
  "strict": false
}
```

**Expected Response**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "structure": {
    "sections": ["Professional Summary", "Work Experience", "Education", "Skills"],
    "wordCount": 95,
    "experienceCount": 2,
    "educationCount": 1
  }
}
```

**Validation**:
- ✅ valid = true
- ✅ errors array is empty
- ✅ structure correctly parsed
- ✅ All required sections detected

#### Invalid Resume Test
**Request**:
```json
{
  "content": "# Bob Smith\n\n**Email**: not-an-email | **Phone**: 555-1234\n\n## Work Experience\n\n### Engineer\n\n- Did work\n\n## Skills\n\n**Tech**: Java",
  "strict": true
}
```

**Expected Response**:
```json
{
  "valid": false,
  "errors": [
    {
      "code": "INVALID_EMAIL",
      "message": "Invalid email format: not-an-email",
      "section": "contact",
      "suggestion": "Use a valid email format (e.g., user@example.com)"
    },
    {
      "code": "INVALID_PHONE",
      "message": "Phone must be in E.164 format (e.g., +12345678901)",
      "section": "contact",
      "suggestion": "Convert phone to E.164 format: +1234567890"
    },
    {
      "code": "MISSING_REQUIRED_SECTION",
      "message": "Required section 'Education' is missing",
      "suggestion": "Add Education section with degree, institution, and graduation date"
    }
  ],
  "structure": {
    "sections": ["Work Experience", "Skills"],
    "wordCount": 12,
    "experienceCount": 1,
    "educationCount": 0
  }
}
```

**Validation**:
- ✅ valid = false
- ✅ errors array contains specific issues
- ✅ Each error has code, message, and suggestion
- ✅ Missing section detected

---

## Workflow 4: Generate Resume Documents

### Step 4a: Generate DOCX Resume
**Tool**: `generate-resume`

**Request**:
```json
{
  "content": "# Jane Doe\n\n**Email**: jane@example.com | **Phone**: +12345678901\n\n## Work Experience\n\n### Senior Engineer at TechCorp\n**San Francisco, CA** | **01/2020 - Present**\n\n- Built features\n\n## Education\n\n### BS CS - MIT\n\n## Skills\n\n**Languages**: Python, JavaScript",
  "templateId": "professional-classic",
  "format": "docx",
  "filename": "jane-doe-resume"
}
```

**Expected Response**:
```json
{
  "success": true,
  "format": "docx",
  "filename": "jane-doe-resume.docx",
  "content": "UEsDBBQACAgIAAAAIQAAAAAAAAAAAAAAAA...",
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "size": 15234,
  "metadata": {
    "templateId": "professional-classic",
    "templateName": "Professional Classic",
    "generatedAt": "2025-10-04T10:00:00Z",
    "resumeName": "Jane Doe"
  }
}
```

**Validation**:
- ✅ success = true
- ✅ content is base64-encoded
- ✅ filename ends with .docx
- ✅ mimeType is correct for DOCX
- ✅ size > 0
- ✅ Decode base64 and verify it's valid DOCX (ZIP format)

### Step 4b: Generate PDF Resume
**Request**:
```json
{
  "content": "[same content as above]",
  "templateId": "modern-tech",
  "format": "pdf"
}
```

**Expected Response**:
```json
{
  "success": true,
  "format": "pdf",
  "filename": "jane-doe-resume.pdf",
  "content": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9U...",
  "mimeType": "application/pdf",
  "size": 24567,
  "metadata": {
    "templateId": "modern-tech",
    "templateName": "Modern Tech",
    "generatedAt": "2025-10-04T10:05:00Z",
    "resumeName": "Jane Doe"
  }
}
```

**Validation**:
- ✅ success = true
- ✅ content starts with PDF header (base64 decode)
- ✅ PDF contains searchable text
- ✅ All resume content preserved in PDF

### Step 4c: Generate HTML Resume
**Request**:
```json
{
  "content": "[same content as above]",
  "templateId": "professional-classic",
  "format": "html"
}
```

**Expected Response**:
```json
{
  "success": true,
  "format": "html",
  "filename": "jane-doe-resume.html",
  "content": "<!DOCTYPE html><html><head><title>Jane Doe - Resume</title>...",
  "mimeType": "text/html",
  "size": 8921,
  "metadata": {
    "templateId": "professional-classic",
    "templateName": "Professional Classic",
    "generatedAt": "2025-10-04T10:10:00Z",
    "resumeName": "Jane Doe"
  }
}
```

**Validation**:
- ✅ success = true
- ✅ content is valid HTML
- ✅ HTML contains <!DOCTYPE html>
- ✅ All resume sections present in HTML
- ✅ Proper semantic HTML structure

---

## Workflow 5: Analyze ATS Score

### Step 5a: Excellent Resume Analysis
**Tool**: `analyze-ats-score`

**Request**:
```json
{
  "content": "# John Doe\n\n**Email**: john@example.com | **Phone**: +12345678901 | **Location**: New York, NY\n**LinkedIn**: https://linkedin.com/in/johndoe\n\n## Professional Summary\n\nSenior Software Engineer with 10 years of experience in enterprise software.\n\n## Work Experience\n\n### Lead Engineer at TechCo\n**New York, NY** | **01/2020 - Present**\n\n- Architected microservices handling 5M+ requests/day\n- Led team of 8 engineers delivering 20+ features quarterly\n- Reduced infrastructure costs by 35%\n\n### Senior Developer at SoftwareCo\n**Boston, MA** | **06/2015 - 12/2019**\n\n- Developed platform serving 100K+ users\n- Implemented CI/CD reducing deployment time by 70%\n\n## Education\n\n### MS Computer Science - Stanford\n**Stanford, CA** | **Graduated: 05/2015**\nGPA: 3.9\n\n## Skills\n\n**Languages**: Java, Python, JavaScript, TypeScript\n**Frameworks**: Spring Boot, Django, React, Node.js\n**Tools**: Docker, Kubernetes, Jenkins, AWS",
  "detailLevel": "detailed"
}
```

**Expected Response**:
```json
{
  "score": 92,
  "rating": "excellent",
  "breakdown": {
    "formatting": 28,
    "keywords": 24,
    "technical": 23,
    "readability": 17
  },
  "issues": [
    {
      "category": "readability",
      "severity": "info",
      "description": "Consider adding certifications section if applicable",
      "impact": 3
    }
  ],
  "recommendations": [
    {
      "title": "Add Certifications",
      "description": "If you have relevant certifications, add them to strengthen your profile",
      "category": "structure",
      "potentialGain": 3,
      "priority": "low"
    }
  ],
  "strengths": [
    "Excellent quantifiable achievements",
    "Proper section structure",
    "Strong keyword presence",
    "Clean formatting",
    "Reverse chronological order",
    "Contact info properly formatted",
    "ATS-friendly layout"
  ],
  "metadata": {
    "analyzerVersion": "1.0.0",
    "analyzedAt": "2025-10-04T10:15:00Z",
    "resumeLength": 142,
    "sectionsFound": ["Professional Summary", "Work Experience", "Education", "Skills"]
  }
}
```

**Validation**:
- ✅ score >= 85
- ✅ rating = "excellent"
- ✅ breakdown scores sum to total score
- ✅ Each breakdown score within allowed range
- ✅ strengths array has multiple items
- ✅ issues array is small (high-quality resume)

### Step 5b: Poor Resume Analysis
**Request**:
```json
{
  "content": "Bob Smith\n\nemail: bob@email.com\nphone: 555-1234\n\nI worked at companies.\n\nI went to school.\n\nI know programming.",
  "detailLevel": "comprehensive"
}
```

**Expected Response**:
```json
{
  "score": 28,
  "rating": "poor",
  "breakdown": {
    "formatting": 8,
    "keywords": 5,
    "technical": 7,
    "readability": 8
  },
  "issues": [
    {
      "category": "formatting",
      "severity": "critical",
      "description": "Missing H1 heading for name",
      "impact": 10
    },
    {
      "category": "formatting",
      "severity": "critical",
      "description": "Phone not in E.164 format",
      "impact": 5
    },
    {
      "category": "structure",
      "severity": "critical",
      "description": "Missing required sections (Work Experience, Education, Skills)",
      "impact": 30
    },
    {
      "category": "compatibility",
      "severity": "warning",
      "description": "Personal pronouns used ('I')",
      "impact": 5
    },
    {
      "category": "keywords",
      "severity": "warning",
      "description": "Extremely weak keyword presence",
      "impact": 15
    }
  ],
  "recommendations": [
    {
      "title": "Add Standard Sections",
      "description": "Create proper sections: Work Experience, Education, Skills with detailed content",
      "category": "structure",
      "potentialGain": 30,
      "priority": "high"
    },
    {
      "title": "Format Name as H1 Heading",
      "description": "Start with: # Bob Smith",
      "category": "formatting",
      "potentialGain": 10,
      "priority": "high"
    },
    {
      "title": "Add Specific Keywords",
      "description": "Include specific technologies, tools, and skills relevant to your field",
      "category": "keywords",
      "potentialGain": 15,
      "priority": "high"
    }
  ],
  "strengths": [
    "Contact information present"
  ],
  "metadata": {
    "analyzerVersion": "1.0.0",
    "analyzedAt": "2025-10-04T10:20:00Z",
    "resumeLength": 23,
    "sectionsFound": []
  }
}
```

**Validation**:
- ✅ score <= 40
- ✅ rating = "poor"
- ✅ Multiple critical issues identified
- ✅ Recommendations are actionable and prioritized
- ✅ potentialGain values are realistic

---

## Complete End-to-End Test Scenario

### Scenario: User Creates Resume from Scratch

**Step 1**: Get template
```bash
→ Call get-resume-template
→ Receive template structure
→ User fills in their information
```

**Step 2**: Validate content
```bash
→ Call validate-resume with user's content
→ Fix any validation errors
→ Re-validate until valid = true
```

**Step 3**: Browse templates
```bash
→ Call list-resume-templates
→ User selects appropriate template
→ Note template ID
```

**Step 4**: Generate documents
```bash
→ Call generate-resume for DOCX
→ Save base64 content to file
→ Call generate-resume for PDF
→ Save base64 content to file
→ Optional: Call generate-resume for HTML
```

**Step 5**: Check ATS score
```bash
→ Call analyze-ats-score
→ Review score and issues
→ Apply recommendations
→ Re-generate if improvements made
```

---

## Performance Benchmarks

### Expected Response Times
- `get-resume-template`: < 100ms
- `list-resume-templates`: < 200ms
- `validate-resume`: < 500ms
- `generate-resume` (DOCX): < 2000ms
- `generate-resume` (PDF): < 2000ms
- `generate-resume` (HTML): < 1000ms
- `analyze-ats-score`: < 1000ms

### Validation Criteria
✅ All tools respond within performance targets
✅ Generated files are valid and openable
✅ ATS scoring is consistent and accurate
✅ Error handling provides clear guidance
✅ Base64 encoding/decoding works correctly

---

## Error Scenarios to Test

### 1. Invalid Template ID
```json
{
  "content": "[valid content]",
  "templateId": "non-existent",
  "format": "docx"
}
```
**Expected**: Error with TEMPLATE_NOT_FOUND code and list of available templates

### 2. Invalid Markdown
```json
{
  "content": "Not valid resume markdown"
}
```
**Expected**: Validation fails with specific error codes and suggestions

### 3. Missing Required Fields
```json
{
  "content": "# Name\n\n## Skills\n\n**Tech**: Java",
  "templateId": "professional-classic",
  "format": "pdf"
}
```
**Expected**: INVALID_CONTENT error due to missing required sections

---

## Success Criteria

### ✅ All Tools Functional
- [ ] `get-resume-template` returns valid template
- [ ] `list-resume-templates` returns filtered templates
- [ ] `validate-resume` correctly validates/rejects content
- [ ] `generate-resume` creates valid DOCX files
- [ ] `generate-resume` creates valid PDF files
- [ ] `generate-resume` creates valid HTML files
- [ ] `analyze-ats-score` provides accurate scoring

### ✅ Performance Targets Met
- [ ] All response times within benchmarks
- [ ] File sizes are reasonable (< 5MB per resume)
- [ ] Memory usage is stable

### ✅ Quality Checks
- [ ] Generated documents preserve all content
- [ ] ATS scoring is consistent across runs
- [ ] Error messages are clear and actionable
- [ ] Base64 encoding works correctly

### ✅ Integration Tests Pass
- [ ] End-to-end workflow completes successfully
- [ ] Contract tests validate all tool schemas
- [ ] MCP protocol compliance verified

---

## Troubleshooting

### Issue: Template Not Found
**Solution**: Run `list-resume-templates` to see available templates

### Issue: Validation Fails
**Solution**: Check error codes and apply suggestions, use `get-resume-template` for reference

### Issue: Generation Fails
**Solution**: Validate content first with `validate-resume`, ensure template ID is valid

### Issue: Low ATS Score
**Solution**: Review recommendations from `analyze-ats-score`, apply fixes, regenerate

---

## Next Steps

After completing this quickstart:
1. ✅ All tools verified working
2. → Run full contract test suite
3. → Perform load testing
4. → Deploy to production MCP server
5. → Integrate with AI assistant clients

---

**Quickstart Status**: ✅ COMPLETE - Ready for implementation testing
