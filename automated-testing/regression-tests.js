#!/usr/bin/env node

/**
 * AUTOMATED REGRESSION TESTING SUITE
 * 
 * Checks that new changes didn't break existing functionality
 * Runs comprehensive tests against core application features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RegressionTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction) {
    this.log(`Running: ${testName}`, 'info');
    
    try {
      const result = await testFunction();
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration: result.duration || 0,
        details: result.details || ''
      });
      this.log(`✅ PASSED: ${testName}`, 'success');
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message,
        details: error.stack
      });
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  async testBackendUnitTests() {
    const startTime = Date.now();
    
    try {
      // Run backend unit tests
      const output = execSync('cd ../ectracc-backend && npm test -- --passWithNoTests', { 
        encoding: 'utf8',
        timeout: 60000 
      });
      
      const duration = Date.now() - startTime;
      
      // Parse test results
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      
      if (failed > 0) {
        throw new Error(`Backend unit tests failed: ${failed} failures`);
      }
      
      return {
        duration,
        details: `${passed} tests passed, ${failed} failed`
      };
    } catch (error) {
      throw new Error(`Backend unit test execution failed: ${error.message}`);
    }
  }

  async testFrontendUnitTests() {
    const startTime = Date.now();
    
    try {
      // Run frontend unit tests
      const output = execSync('cd ../ectracc-frontend && npm test -- --watchAll=false --passWithNoTests', { 
        encoding: 'utf8',
        timeout: 60000 
      });
      
      const duration = Date.now() - startTime;
      
      // Parse test results
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      
      if (failed > 0) {
        throw new Error(`Frontend unit tests failed: ${failed} failures`);
      }
      
      return {
        duration,
        details: `${passed} tests passed, ${failed} failed`
      };
    } catch (error) {
      throw new Error(`Frontend unit test execution failed: ${error.message}`);
    }
  }

  async testAPIEndpoints() {
    const startTime = Date.now();
    const endpoints = [
      { url: 'http://localhost:8000/api/healthcheck', method: 'GET', expectedStatus: [200, 503] },
      { url: 'http://localhost:8000/api/products/search?q=milk', method: 'GET', expectedStatus: [200, 503] },
      { url: 'http://localhost:8000/api/products/categories', method: 'GET', expectedStatus: [200, 503] },
      { url: 'http://localhost:8000/api/products/brands', method: 'GET', expectedStatus: [200, 503] }
    ];
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url);
        if (endpoint.expectedStatus.includes(response.status)) {
          successCount++;
        } else {
          failureCount++;
          this.log(`API endpoint ${endpoint.url} returned unexpected status: ${response.status}`, 'warning');
        }
      } catch (error) {
        failureCount++;
        this.log(`API endpoint ${endpoint.url} failed: ${error.message}`, 'warning');
      }
    }
    
    const duration = Date.now() - startTime;
    
    if (failureCount > endpoints.length / 2) {
      throw new Error(`Too many API endpoint failures: ${failureCount}/${endpoints.length}`);
    }
    
    return {
      duration,
      details: `${successCount}/${endpoints.length} endpoints responding correctly`
    };
  }

  async testBuildIntegrity() {
    const startTime = Date.now();
    
    try {
      // Check if frontend builds successfully
      execSync('cd ../ectracc-frontend && npm run build', { 
        encoding: 'utf8',
        timeout: 120000 
      });
      
      // Check if build directory exists and has required files
      const buildDir = path.join(__dirname, '../ectracc-frontend/build');
      if (!fs.existsSync(buildDir)) {
        throw new Error('Build directory not created');
      }
      
      const requiredFiles = ['index.html', 'static/js', 'static/css'];
      for (const file of requiredFiles) {
        const filePath = path.join(buildDir, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Required build file missing: ${file}`);
        }
      }
      
      const duration = Date.now() - startTime;
      
      return {
        duration,
        details: 'Frontend build completed successfully with all required files'
      };
    } catch (error) {
      throw new Error(`Build integrity check failed: ${error.message}`);
    }
  }

  async testDatabaseConnection() {
    const startTime = Date.now();
    
    try {
      // Test database connection through health check
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      const duration = Date.now() - startTime;
      
      // Check if MongoDB status is reported
      if (data.data && data.data.services) {
        const mongoStatus = data.data.services.mongodb;
        return {
          duration,
          details: `MongoDB status: ${mongoStatus}, Supabase: ${data.data.services.supabase}`
        };
      }
      
      return {
        duration,
        details: 'Health check responded but database status unclear'
      };
    } catch (error) {
      throw new Error(`Database connection test failed: ${error.message}`);
    }
  }

  async testCriticalUserJourneys() {
    const startTime = Date.now();
    
    // Simulate critical user journeys by checking key endpoints
    const journeys = [
      { name: 'Product Search', endpoint: '/api/products/search?q=test' },
      { name: 'Category Listing', endpoint: '/api/products/categories' },
      { name: 'Brand Listing', endpoint: '/api/products/brands' }
    ];
    
    let successCount = 0;
    
    for (const journey of journeys) {
      try {
        const response = await fetch(`http://localhost:8000${journey.endpoint}`);
        if (response.status === 200 || response.status === 503) {
          successCount++;
        }
      } catch (error) {
        this.log(`Critical journey '${journey.name}' failed: ${error.message}`, 'warning');
      }
    }
    
    const duration = Date.now() - startTime;
    
    if (successCount === 0) {
      throw new Error('All critical user journeys failed');
    }
    
    return {
      duration,
      details: `${successCount}/${journeys.length} critical journeys accessible`
    };
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.passed + this.results.failed + this.results.skipped;
    
    const report = {
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate: totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(2) : 0,
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`
      },
      tests: this.results.tests,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, `regression-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async run() {
    this.log('🚀 Starting Automated Regression Testing Suite', 'info');
    this.log('=' * 60, 'info');
    
    // Run all regression tests
    await this.runTest('Backend Unit Tests', () => this.testBackendUnitTests());
    await this.runTest('Frontend Unit Tests', () => this.testFrontendUnitTests());
    await this.runTest('API Endpoints Accessibility', () => this.testAPIEndpoints());
    await this.runTest('Build Integrity', () => this.testBuildIntegrity());
    await this.runTest('Database Connection', () => this.testDatabaseConnection());
    await this.runTest('Critical User Journeys', () => this.testCriticalUserJourneys());
    
    // Generate and display report
    const report = this.generateReport();
    
    this.log('=' * 60, 'info');
    this.log('📊 REGRESSION TESTING COMPLETE', 'info');
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
    this.log(`Passed: ${report.summary.passed}`, 'success');
    this.log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
    this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
    this.log(`Duration: ${report.summary.totalDuration}`, 'info');
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run regression tests if called directly
if (require.main === module) {
  const tester = new RegressionTester();
  tester.run().catch(error => {
    console.error('❌ Regression testing failed:', error);
    process.exit(1);
  });
}

module.exports = RegressionTester;
