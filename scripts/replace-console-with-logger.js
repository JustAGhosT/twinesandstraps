/**
 * Script to replace console.log statements with logger
 * Run: node scripts/replace-console-with-logger.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../src');
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build'];

// Logger import statement
const LOGGER_IMPORT = "import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';";

// Mapping of console methods to logger methods
const CONSOLE_TO_LOGGER = {
  'console.log': 'logInfo',
  'console.info': 'logInfo',
  'console.warn': 'logWarn',
  'console.error': 'logError',
  'console.debug': 'logDebug',
};

/**
 * Check if file already imports logger
 */
function hasLoggerImport(content) {
  return content.includes("from '@/lib/logging/logger'") || 
         content.includes('from "@/lib/logging/logger"');
}

/**
 * Add logger import if not present
 */
function addLoggerImport(content) {
  if (hasLoggerImport(content)) {
    return content;
  }

  // Find last import statement
  const importRegex = /^import .+ from ['"].+['"];?\s*$/gm;
  const imports = content.match(importRegex) || [];
  
  if (imports.length === 0) {
    // No imports, add at the top
    const lines = content.split('\n');
    const firstNonEmptyLine = lines.findIndex(line => line.trim().length > 0);
    lines.splice(firstNonEmptyLine, 0, LOGGER_IMPORT);
    return lines.join('\n');
  }

  // Add after last import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertIndex = lastImportIndex + lastImport.length;
  
  return content.slice(0, insertIndex) + '\n' + LOGGER_IMPORT + '\n' + content.slice(insertIndex);
}

/**
 * Replace console statements with logger
 */
function replaceConsoleStatements(content) {
  let modified = content;

  // Replace each console method
  for (const [consoleMethod, loggerMethod] of Object.entries(CONSOLE_TO_LOGGER)) {
    // Pattern: console.method(...) -> loggerMethod(...)
    const regex = new RegExp(`\\b${consoleMethod.replace('.', '\\.')}\\s*\\(`, 'g');
    
    modified = modified.replace(regex, (match, offset) => {
      // Check if this is inside a comment
      const beforeMatch = modified.substring(0, offset);
      const lastComment = beforeMatch.lastIndexOf('//');
      const lastLineBreak = beforeMatch.lastIndexOf('\n');
      
      if (lastComment > lastLineBreak) {
        // Inside a comment, don't replace
        return match;
      }
      
      return `${loggerMethod}(`;
    });
  }

  return modified;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file has console statements
    const hasConsole = /console\.(log|info|warn|error|debug)/.test(content);
    
    if (!hasConsole) {
      return false; // No console statements to replace
    }

    // Skip files that are already using logger exclusively
    if (hasLoggerImport(content) && !/console\.(log|info|warn|error|debug)/.test(content)) {
      return false;
    }

    // Add logger import if needed
    if (!hasLoggerImport(content)) {
      content = addLoggerImport(content);
      modified = true;
    }

    // Replace console statements
    const newContent = replaceConsoleStatements(content);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modified = true;
      console.log(`✓ Updated: ${path.relative(SRC_DIR, filePath)}`);
    }

    return modified;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Walk directory recursively
 */
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file) && !file.startsWith('.')) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Searching for console statements...\n');
  
  const files = walkDir(SRC_DIR);
  let processed = 0;
  let updated = 0;

  files.forEach(file => {
    processed++;
    if (processFile(file)) {
      updated++;
    }
  });

  console.log(`\n✅ Processed ${processed} files, updated ${updated} files`);
  console.log('\n⚠️  Please review changes and test before committing!');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, replaceConsoleStatements, addLoggerImport };

