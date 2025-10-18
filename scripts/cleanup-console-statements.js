#!/usr/bin/env node

/**
 * Script to replace console.log/debug/warn with logger utility
 * Keeps console.error as-is since those should always show
 */

const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/ProfileSetupPage.tsx',
  'src/services/productApi.ts',
  'src/services/auth.ts',
  'src/pages/AuthCallbackPage.tsx',
  'src/hooks/useProductDetection.ts',
  'src/utils/offlineSync.ts',
  'src/services/optimisticUI.ts',
  'src/pages/ProductSearchPage.tsx',
  'src/pages/DashboardPage.tsx',
  'src/components/layout/Sidebar.tsx'
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Check if logger is already imported
  const hasLoggerImport = content.includes('import logger from');
  const hasImports = content.includes('import ');
  
  // Replace console.log with logger.log (but not console.error)
  content = content.replace(/console\.log\(/g, 'logger.log(');
  content = content.replace(/console\.debug\(/g, 'logger.debug(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  
  // Add logger import if needed and changes were made
  if (content !== originalContent && !hasLoggerImport && hasImports) {
    // Find the last import statement
    const importRegex = /import .* from .*;\n/g;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      content = content.slice(0, insertIndex) + 
                "import logger from '../utils/logger';\n" +
                content.slice(insertIndex);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  No changes: ${filePath}`);
    return false;
  }
}

console.log('🧹 Cleaning up console statements...\n');

let updatedCount = 0;
files.forEach(file => {
  if (processFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Complete! Updated ${updatedCount} files.`);

