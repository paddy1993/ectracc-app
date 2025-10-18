#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const additionalFiles = [
  'src/pages/EnhancedUIDemo.tsx',
  'src/hooks/useAdminAuth.ts',
  'src/services/pendingProductApi.ts',
  'src/utils/scannerUtils.ts',
  'src/hooks/useContinuousScanner.ts',
  'src/components/CameraScanner.tsx',
  'src/pages/ScannerPage.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/components/ProfileSetupModal.tsx',
  'src/i18n/index.ts',
  'src/services/serviceWorkerRegistration.ts',
  'src/services/pwaInstaller.ts',
  'src/services/performanceMonitor.ts',
  'src/services/offlineStorage.ts',
  'src/services/analytics.ts',
  'src/index.tsx',
  'src/App.tsx',
  'src/pages/ProductDetailPage.tsx',
  'src/pages/HistoryPageNew.tsx',
  'src/pages/HistoryPage.tsx',
  'src/hooks/useSearchHistory.ts',
  'src/hooks/usePerformanceOptimization.ts',
  'src/hooks/useBarcodeScanner.ts',
  'src/services/notificationService.ts',
  'src/components/MobileEnhancements.tsx',
  'src/components/tracker/ProductSubmissionForm.tsx',
  'src/pages/ProfilePage.tsx',
  'src/services/carbonApi.ts'
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  const hasLoggerImport = content.includes('import logger from');
  const hasImports = content.includes('import ');
  
  content = content.replace(/console\.log\(/g, 'logger.log(');
  content = content.replace(/console\.debug\(/g, 'logger.debug(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  
  if (content !== originalContent && !hasLoggerImport && hasImports) {
    const importRegex = /import .* from .*;\n/g;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      
      // Determine correct path depth
      const depth = (filePath.match(/\//g) || []).length - 1;
      const loggerPath = '../'.repeat(depth) + 'utils/logger';
      
      content = content.slice(0, insertIndex) + 
                `import logger from '${loggerPath}';\n` +
                content.slice(insertIndex);
    }
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
    return true;
  }
  return false;
}

console.log('🧹 Cleaning up remaining console statements...\n');

let updatedCount = 0;
additionalFiles.forEach(file => {
  if (processFile(file)) {
    updatedCount++;
  }
});

console.log(`\n✨ Complete! Updated ${updatedCount} more files.`);

