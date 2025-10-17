#!/usr/bin/env node

/**
 * Master Enrichment Pipeline
 * Orchestrates the complete product enrichment process:
 * 1. Export existing barcodes
 * 2. Analyze field availability
 * 3. Extract optimized enrichment data
 * 4. Test on sample dataset
 * 5. Run full batch enrichment (if approved)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '..', 'ectracc-backend', '.env') });

// Script paths
const SCRIPTS_DIR = __dirname;
const SCRIPTS = {
  exportBarcodes: path.join(SCRIPTS_DIR, 'export-existing-barcodes.js'),
  analyzeFields: path.join(SCRIPTS_DIR, 'analyze-openfoodfacts-fields.js'),
  extractData: path.join(SCRIPTS_DIR, 'extract-enrichment-data.js'),
  testSample: path.join(SCRIPTS_DIR, 'test-sample-enrichment.js'),
  batchEnrichment: path.join(SCRIPTS_DIR, 'batch-enrichment-pipeline.js'),
  storageMonitor: path.join(SCRIPTS_DIR, 'storage-monitor.js')
};

class EnrichmentPipelineOrchestrator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.pipelineState = {
      step: 0,
      totalSteps: 6,
      results: {},
      startTime: Date.now()
    };
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  async runScript(scriptPath, description) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Step ${this.pipelineState.step}/${this.pipelineState.totalSteps}: ${description}`);
    console.log(`${'='.repeat(60)}`);
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: path.dirname(scriptPath)
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Step ${this.pipelineState.step} completed successfully`);
          resolve(code);
        } else {
          console.error(`❌ Step ${this.pipelineState.step} failed with exit code ${code}`);
          reject(new Error(`Script failed: ${scriptPath}`));
        }
      });
      
      child.on('error', (error) => {
        console.error(`❌ Error running script: ${error.message}`);
        reject(error);
      });
    });
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check if all scripts exist
    const missingScripts = [];
    Object.entries(SCRIPTS).forEach(([name, scriptPath]) => {
      if (!fs.existsSync(scriptPath)) {
        missingScripts.push(`${name}: ${scriptPath}`);
      }
    });
    
    if (missingScripts.length > 0) {
      throw new Error(`Missing scripts:\n${missingScripts.join('\n')}`);
    }
    
    // Check for Open Food Facts data
    const desktopPath = path.join(require('os').homedir(), 'Desktop');
    const openFoodFactsFile = path.join(desktopPath, 'openfoodfacts-products.jsonl (1).gz');
    
    if (!fs.existsSync(openFoodFactsFile)) {
      throw new Error(`Open Food Facts data file not found: ${openFoodFactsFile}`);
    }
    
    // Check environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    console.log('✅ Prerequisites check passed');
  }

  async showWelcome() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ECTRACC PRODUCT ENRICHMENT               ║
║                        PIPELINE v1.0                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  This pipeline will enrich your product database with       ║
║  11 additional fields from Open Food Facts:                 ║
║                                                              ║
║  📦 Quantity & Measurement:                                  ║
║     • quantity, product_quantity, product_quantity_unit     ║
║     • net_weight, net_weight_unit                           ║
║                                                              ║
║  🏭 Packaging & Manufacturing:                               ║
║     • packaging, packaging_text                             ║
║     • origins, manufacturing_places                         ║
║                                                              ║
║  🏪 Market & Certification:                                  ║
║     • labels, stores, countries                             ║
║                                                              ║
║  💾 Storage: Optimized to stay under 5GB MongoDB limit      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    
    const proceed = await this.askQuestion('Do you want to proceed with the enrichment pipeline? (y/n): ');
    if (proceed !== 'y' && proceed !== 'yes') {
      console.log('👋 Pipeline cancelled by user');
      process.exit(0);
    }
  }

  async runPipelineSteps() {
    try {
      // Step 1: Export existing barcodes
      this.pipelineState.step = 1;
      await this.runScript(SCRIPTS.exportBarcodes, 'Export Existing Product Barcodes');
      
      // Step 2: Analyze field availability
      this.pipelineState.step = 2;
      await this.runScript(SCRIPTS.analyzeFields, 'Analyze Open Food Facts Field Availability');
      
      // Step 3: Extract optimized enrichment data
      this.pipelineState.step = 3;
      await this.runScript(SCRIPTS.extractData, 'Extract Storage-Optimized Enrichment Data');
      
      // Step 4: Test on sample dataset
      this.pipelineState.step = 4;
      await this.runScript(SCRIPTS.testSample, 'Test Enrichment on Sample Dataset');
      
      // Check test results before proceeding
      const testResultsFile = path.join(__dirname, '..', 'data', 'enrichment', 'sample_enrichment_test_results.json');
      if (fs.existsSync(testResultsFile)) {
        const testResults = JSON.parse(fs.readFileSync(testResultsFile, 'utf8'));
        
        console.log(`\n📊 Sample Test Results Summary:`);
        console.log(`✅ Products enriched: ${testResults.products_enriched}`);
        console.log(`💾 Storage per product: ${testResults.storage_per_product_bytes} bytes`);
        console.log(`🔮 Projected final size: ${testResults.projections.projectedFinalSizeGB.toFixed(2)} GB`);
        console.log(`📋 Recommendation: ${testResults.recommendations}`);
        
        if (testResults.recommendations !== 'PROCEED') {
          console.log(`\n⚠️  Sample test recommends not proceeding with full enrichment`);
          console.log(`📊 Projected size (${testResults.projections.projectedFinalSizeGB.toFixed(2)} GB) may exceed 5GB limit`);
          
          const forceProceeed = await this.askQuestion('Do you want to proceed anyway? (y/n): ');
          if (forceProceeed !== 'y' && forceProceeed !== 'yes') {
            console.log('🛑 Pipeline stopped based on sample test results');
            return;
          }
        }
      }
      
      // Step 5: Confirm full enrichment
      console.log(`\n🎯 Ready for Full Batch Enrichment`);
      console.log(`This will enrich all matching products in your database.`);
      console.log(`The process is irreversible and will modify your production data.`);
      
      const confirmFull = await this.askQuestion('Proceed with full batch enrichment? (y/n): ');
      if (confirmFull !== 'y' && confirmFull !== 'yes') {
        console.log('🛑 Full enrichment cancelled by user');
        console.log('✅ Sample testing completed successfully');
        return;
      }
      
      // Step 6: Run full batch enrichment
      this.pipelineState.step = 5;
      await this.runScript(SCRIPTS.batchEnrichment, 'Run Full Batch Enrichment Pipeline');
      
      // Step 7: Final storage check
      this.pipelineState.step = 6;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Step ${this.pipelineState.step}/${this.pipelineState.totalSteps}: Final Storage Verification`);
      console.log(`${'='.repeat(60)}`);
      
      await this.runScript(SCRIPTS.storageMonitor, 'Final Storage Status Check');
      
    } catch (error) {
      console.error(`❌ Pipeline failed at step ${this.pipelineState.step}:`, error.message);
      throw error;
    }
  }

  async showCompletionSummary() {
    const totalTime = Date.now() - this.pipelineState.startTime;
    const minutes = Math.floor(totalTime / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🎉 ENRICHMENT COMPLETE! 🎉                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ✅ All pipeline steps completed successfully                ║
║  ⏱️  Total time: ${minutes}m ${seconds}s                                    ║
║                                                              ║
║  📊 Your product database has been enriched with:           ║
║     • Quantity and measurement data                         ║
║     • Packaging and manufacturing information               ║
║     • Market availability and certifications               ║
║                                                              ║
║  💾 Storage optimizations applied to stay under 5GB limit   ║
║                                                              ║
║  🚀 Your ECTRACC app now has enhanced product data!         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
    
    console.log(`📁 Generated files:`);
    console.log(`   • data/enrichment/existing_barcodes.json`);
    console.log(`   • data/enrichment/field_analysis_results.json`);
    console.log(`   • data/enrichment/enrichment_data.json`);
    console.log(`   • data/enrichment/sample_enrichment_test_results.json`);
    
    console.log(`\n💡 Next steps:`);
    console.log(`   • Test your ECTRACC app with the enriched product data`);
    console.log(`   • Monitor storage usage with: node scripts/storage-monitor.js --continuous`);
    console.log(`   • Check product API responses for new enrichment fields`);
  }

  async cleanup() {
    this.rl.close();
  }

  async run() {
    try {
      await this.showWelcome();
      await this.checkPrerequisites();
      await this.runPipelineSteps();
      await this.showCompletionSummary();
      
    } catch (error) {
      console.error('\n❌ Enrichment pipeline failed:', error.message);
      console.log('\n🔧 Troubleshooting tips:');
      console.log('   • Check MongoDB connection and credentials');
      console.log('   • Ensure Open Food Facts data file is in ~/Desktop/');
      console.log('   • Verify sufficient disk space and MongoDB storage');
      console.log('   • Check individual script logs for detailed error information');
      
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Pipeline interrupted by user');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  const orchestrator = new EnrichmentPipelineOrchestrator();
  orchestrator.run();
}

module.exports = EnrichmentPipelineOrchestrator;
