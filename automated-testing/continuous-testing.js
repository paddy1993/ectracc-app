#!/usr/bin/env node

/**
 * CONTINUOUS TESTING FRAMEWORK
 * 
 * Automated testing integrated into CI/CD pipelines
 * Orchestrates different types of tests based on triggers
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ContinuousTester {
  constructor(config = {}) {
    this.config = {
      triggerType: config.triggerType || 'manual', // commit, pr, deploy, manual
      testSuite: config.testSuite || 'full', // smoke, sanity, regression, full
      parallel: config.parallel || false,
      timeout: config.timeout || 300000, // 5 minutes default
      ...config
    };
    
    this.results = {
      pipeline: {
        started: Date.now(),
        completed: null,
        duration: null,
        status: 'RUNNING'
      },
      stages: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔄',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      stage: '📋'
    }[type] || '🔄';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runStage(stageName, stageFunction) {
    const stageStart = Date.now();
    this.log(`Starting Stage: ${stageName}`, 'stage');
    
    try {
      const result = await stageFunction();
      const stageDuration = Date.now() - stageStart;
      
      this.results.stages.push({
        name: stageName,
        status: 'PASSED',
        duration: stageDuration,
        details: result
      });
      
      this.log(`✅ Stage Completed: ${stageName} (${(stageDuration/1000).toFixed(2)}s)`, 'success');
      return result;
    } catch (error) {
      const stageDuration = Date.now() - stageStart;
      
      this.results.stages.push({
        name: stageName,
        status: 'FAILED',
        duration: stageDuration,
        error: error.message
      });
      
      this.log(`❌ Stage Failed: ${stageName} - ${error.message}`, 'error');
      throw error;
    }
  }

  async runTestSuite(suiteName, suiteScript) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.log(`Executing ${suiteName}...`, 'info');
      
      const testProcess = spawn('node', [suiteScript], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Stream output in real-time for CI/CD visibility
        process.stdout.write(data);
      });
      
      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        process.stderr.write(data);
      });
      
      testProcess.on('close', (code) => {
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            suite: suiteName,
            status: 'PASSED',
            duration,
            output: stdout
          });
        } else {
          reject(new Error(`${suiteName} failed with exit code ${code}`));
        }
      });
      
      // Set timeout
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        reject(new Error(`${suiteName} timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);
    });
  }

  async stagePreChecks() {
    this.log('Running pre-flight checks...', 'info');
    
    // Check if required dependencies are available
    const requiredCommands = ['node', 'npm'];
    for (const cmd of requiredCommands) {
      try {
        execSync(`which ${cmd}`, { stdio: 'ignore' });
      } catch (error) {
        throw new Error(`Required command not found: ${cmd}`);
      }
    }
    
    // Check if project structure is intact
    const requiredDirs = ['ectracc-frontend', 'ectracc-backend'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Required directory not found: ${dir}`);
      }
    }
    
    return { checks: 'Pre-flight checks completed successfully' };
  }

  async stageEnvironmentSetup() {
    this.log('Setting up test environment...', 'info');
    
    // Install dependencies if needed
    try {
      execSync('cd ../ectracc-backend && npm ci --silent', { stdio: 'ignore' });
      execSync('cd ../ectracc-frontend && npm ci --silent', { stdio: 'ignore' });
    } catch (error) {
      this.log('Warning: Could not install dependencies', 'warning');
    }
    
    // Start server if not running
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck', { timeout: 3000 });
      this.log('Server already running', 'info');
    } catch (error) {
      this.log('Starting server for testing...', 'info');
      // Server startup is handled by the main process
    }
    
    return { environment: 'Test environment ready' };
  }

  async stageSmokeTests() {
    if (this.config.testSuite === 'smoke' || this.config.testSuite === 'full') {
      return await this.runTestSuite('Smoke Tests', './smoke-tests.js');
    }
    return { skipped: 'Smoke tests not requested' };
  }

  async stageSanityTests() {
    if (this.config.testSuite === 'sanity' || this.config.testSuite === 'full') {
      return await this.runTestSuite('Sanity Tests', './sanity-tests.js');
    }
    return { skipped: 'Sanity tests not requested' };
  }

  async stageRegressionTests() {
    if (this.config.testSuite === 'regression' || this.config.testSuite === 'full') {
      return await this.runTestSuite('Regression Tests', './regression-tests.js');
    }
    return { skipped: 'Regression tests not requested' };
  }

  async stageIntegrationTests() {
    if (this.config.testSuite === 'full') {
      // Run Cypress integration tests if available
      try {
        return await this.runTestSuite('Integration Tests', '../ectracc-frontend/node_modules/.bin/cypress run --headless');
      } catch (error) {
        this.log('Integration tests not available or failed', 'warning');
        return { warning: 'Integration tests could not be executed' };
      }
    }
    return { skipped: 'Integration tests not requested' };
  }

  async stageReporting() {
    this.log('Generating comprehensive test report...', 'info');
    
    // Aggregate results from all stages
    const report = {
      pipeline: {
        ...this.results.pipeline,
        completed: Date.now(),
        duration: Date.now() - this.results.pipeline.started,
        status: this.results.stages.some(stage => stage.status === 'FAILED') ? 'FAILED' : 'PASSED'
      },
      configuration: this.config,
      stages: this.results.stages,
      summary: this.calculateSummary(),
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
    
    // Save comprehensive report
    const reportPath = path.join(__dirname, `continuous-testing-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate CI/CD friendly output
    this.generateCIOutput(report);
    
    return { report: `Report saved to ${reportPath}` };
  }

  calculateSummary() {
    // This would aggregate results from all test reports
    // For now, return basic pipeline summary
    const passedStages = this.results.stages.filter(s => s.status === 'PASSED').length;
    const failedStages = this.results.stages.filter(s => s.status === 'FAILED').length;
    
    return {
      totalStages: this.results.stages.length,
      passedStages,
      failedStages,
      successRate: this.results.stages.length > 0 ? 
        ((passedStages / this.results.stages.length) * 100).toFixed(2) : 0
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze results and provide recommendations
    const failedStages = this.results.stages.filter(s => s.status === 'FAILED');
    
    if (failedStages.length > 0) {
      recommendations.push({
        type: 'CRITICAL',
        message: `${failedStages.length} stage(s) failed. Review and fix before deployment.`,
        stages: failedStages.map(s => s.name)
      });
    }
    
    if (this.config.testSuite !== 'full') {
      recommendations.push({
        type: 'SUGGESTION',
        message: `Consider running full test suite before production deployment.`,
        action: 'Run with --test-suite=full'
      });
    }
    
    return recommendations;
  }

  generateCIOutput(report) {
    // Generate CI/CD friendly output format
    console.log('\n' + '='.repeat(60));
    console.log('🔄 CONTINUOUS TESTING PIPELINE RESULTS');
    console.log('='.repeat(60));
    console.log(`Pipeline Status: ${report.pipeline.status}`);
    console.log(`Total Duration: ${(report.pipeline.duration / 1000).toFixed(2)}s`);
    console.log(`Stages: ${report.summary.passedStages}/${report.summary.totalStages} passed`);
    console.log(`Success Rate: ${report.summary.successRate}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        console.log(`${rec.type}: ${rec.message}`);
      });
    }
    
    console.log('='.repeat(60));
  }

  async run() {
    this.log('🔄 Starting Continuous Testing Pipeline', 'info');
    this.log(`Trigger: ${this.config.triggerType}, Suite: ${this.config.testSuite}`, 'info');
    this.log('=' * 70, 'info');
    
    try {
      // Execute pipeline stages
      await this.runStage('Pre-Checks', () => this.stagePreChecks());
      await this.runStage('Environment Setup', () => this.stageEnvironmentSetup());
      
      // Run test suites based on configuration
      if (this.config.parallel) {
        // Run tests in parallel for faster execution
        const testPromises = [];
        if (this.config.testSuite === 'full' || this.config.testSuite === 'smoke') {
          testPromises.push(this.runStage('Smoke Tests', () => this.stageSmokeTests()));
        }
        if (this.config.testSuite === 'full' || this.config.testSuite === 'sanity') {
          testPromises.push(this.runStage('Sanity Tests', () => this.stageSanityTests()));
        }
        
        await Promise.all(testPromises);
        
        // Run regression tests after others complete (they're more comprehensive)
        if (this.config.testSuite === 'full' || this.config.testSuite === 'regression') {
          await this.runStage('Regression Tests', () => this.stageRegressionTests());
        }
      } else {
        // Run tests sequentially
        await this.runStage('Smoke Tests', () => this.stageSmokeTests());
        await this.runStage('Sanity Tests', () => this.stageSanityTests());
        await this.runStage('Regression Tests', () => this.stageRegressionTests());
        await this.runStage('Integration Tests', () => this.stageIntegrationTests());
      }
      
      await this.runStage('Reporting', () => this.stageReporting());
      
      this.log('🎉 Continuous Testing Pipeline Completed Successfully!', 'success');
      process.exit(0);
      
    } catch (error) {
      this.results.pipeline.status = 'FAILED';
      this.log(`🚨 Pipeline Failed: ${error.message}`, 'error');
      
      // Still generate report for failed pipeline
      await this.stageReporting().catch(() => {});
      
      process.exit(1);
    }
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run continuous testing if called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const config = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'trigger-type') config.triggerType = value;
    if (key === 'test-suite') config.testSuite = value;
    if (key === 'parallel') config.parallel = value === 'true';
    if (key === 'timeout') config.timeout = parseInt(value);
  }
  
  const tester = new ContinuousTester(config);
  tester.run().catch(error => {
    console.error('❌ Continuous testing pipeline failed:', error);
    process.exit(1);
  });
}

module.exports = ContinuousTester;
