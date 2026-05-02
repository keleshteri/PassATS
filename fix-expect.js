const fs = require('fs');
const path = require('path');

// Function to replace expect calls with assert calls
function replaceExpectWithAssert(content) {
  // Replace common expect patterns with assert equivalents
  let result = content;
  
  // expect(value).toBe(expected) -> assert.strictEqual(value, expected)
  result = result.replace(/expect\(([^)]+)\)\.toBe\(([^)]+)\)/g, 'assert.strictEqual($1, $2)');
  
  // expect(value).toBeGreaterThanOrEqual(expected) -> assert(value >= expected)
  result = result.replace(/expect\(([^)]+)\)\.toBeGreaterThanOrEqual\(([^)]+)\)/g, 'assert($1 >= $2)');
  
  // expect(value).toBeLessThanOrEqual(expected) -> assert(value <= expected)
  result = result.replace(/expect\(([^)]+)\)\.toBeLessThanOrEqual\(([^)]+)\)/g, 'assert($1 <= $2)');
  
  // expect(value).toBeGreaterThan(expected) -> assert(value > expected)
  result = result.replace(/expect\(([^)]+)\)\.toBeGreaterThan\(([^)]+)\)/g, 'assert($1 > $2)');
  
  // expect(value).toBeLessThan(expected) -> assert(value < expected)
  result = result.replace(/expect\(([^)]+)\)\.toBeLessThan\(([^)]+)\)/g, 'assert($1 < $2)');
  
  // expect(value).toContain(expected) -> assert(value.includes(expected))
  result = result.replace(/expect\(([^)]+)\)\.toContain\(([^)]+)\)/g, 'assert($1.includes($2))');
  
  // expect(value).toBeDefined() -> assert(value !== undefined)
  result = result.replace(/expect\(([^)]+)\)\.toBeDefined\(\)/g, 'assert($1 !== undefined)');
  
  // expect(value).toBeNull() -> assert(value === null)
  result = result.replace(/expect\(([^)]+)\)\.toBeNull\(\)/g, 'assert(value === null)');
  
  // expect(value).toBeTruthy() -> assert(value)
  result = result.replace(/expect\(([^)]+)\)\.toBeTruthy\(\)/g, 'assert($1)');
  
  // expect(value).toBeFalsy() -> assert(!value)
  result = result.replace(/expect\(([^)]+)\)\.toBeFalsy\(\)/g, 'assert(!$1)');
  
  return result;
}

// Function to process a single file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = replaceExpectWithAssert(content);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to recursively find and process test files
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.test.ts')) {
      processFile(fullPath);
    }
  }
}

// Process the tests directory
processDirectory('./tests');
console.log('Done fixing expect calls!');
