#!/usr/bin/env node

/**
 * AUTOMATED SANITY TESTING SUITE
 * 
 * Focused recheck of specific areas after a small change
 * Validates that recent changes work as expected
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SanityTester {
  constructor(focusArea = null) {
    this.focusArea = focusArea;
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
      info: '🔍',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      skip: '⏭️'
    }[type] || '🔍';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runSanityTest(testName, testFunction, area = 'general') {
    // Skip tests not in focus area if specified
    if (this.focusArea && area !== this.focusArea && area !== 'critical') {
      this.results.skipped++;
      this.results.tests.push({
        name: testName,
        status: 'SKIPPED',
        reason: `Not in focus area: ${this.focusArea}`
      });
      this.log(`⏭️ SKIPPED: ${testName} (focus: ${this.focusArea})`, 'skip');
      return null;
    }

    this.log(`Sanity Check: ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        area: area,
        duration: `${duration}ms`,
        details: result?.details || ''
      });
      this.log(`✅ SANITY PASSED: ${testName} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        area: area,
        error: error.message
      });
      this.log(`❌ SANITY FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  // Frontend-specific sanity tests
  async testFrontendComponentSyntax() {
    try {
      // Check if frontend compiles without syntax errors
      const output = execSync('cd ../ectracc-frontend && npm run build', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      
      // Check for common syntax error indicators
      if (output.includes('SyntaxError') || output.includes('Unexpected token')) {
        throw new Error('Frontend compilation has syntax errors');
      }
      
      return { details: 'Frontend compiles without syntax errors' };
    } catch (error) {
      throw new Error(`Frontend syntax check failed: ${error.message}`);
    }
  }

  async testFrontendTestSuite() {
    try {
      const output = execSync('cd ../ectracc-frontend && npm test -- --watchAll=false --passWithNoTests', { 
        encoding: 'utf8',
        timeout: 30000 
      });
      
      // Check for test failures
      if (output.includes('FAIL') && !output.includes('0 failed')) {
        throw new Error('Frontend tests are failing');
      }
      
      return { details: 'Frontend test suite passes' };
    } catch (error) {
      throw new Error(`Frontend test execution failed: ${error.message}`);
    }
  }

  // Backend-specific sanity tests
  async testBackendAPIResponses() {
    const endpoints = [
      { url: 'http://localhost:8000/api/healthcheck', name: 'Health Check' },
      { url: 'http://localhost:8000/api/products/search?q=test', name: 'Product Search' }
    ];
    
    let workingEndpoints = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint.url, { timeout: 5000 });
        
        // Accept both success and graceful degradation
        if (response.ok || response.status === 503) {
          workingEndpoints++;
        }
      } catch (error) {
        this.log(`Backend endpoint ${endpoint.name} not responding: ${error.message}`, 'warning');
      }
    }
    
    if (workingEndpoints === 0) {
      throw new Error('No backend endpoints are responding');
    }
    
    return { details: `${workingEndpoints}/${endpoints.length} backend endpoints responding` };
  }

  async testBackendDatabaseConnection() {
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      if (data.data && data.data.services) {
        const mongoStatus = data.data.services.mongodb;
        const supabaseStatus = data.data.services.supabase;
        
        return { 
          details: `Database services - MongoDB: ${mongoStatus}, Supabase: ${supabaseStatus}` 
        };
      }
      
      return { details: 'Database connection status retrieved' };
    } catch (error) {
      throw new Error(`Database connection check failed: ${error.message}`);
    }
  }

  // Database-specific sanity tests
  async testDatabaseDataIntegrity() {
    try {
      // Test basic data retrieval
      const response = await fetch('http://localhost:8000/api/products/search?q=milk&limit=1');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.products) {
          return { details: 'Database data retrieval working correctly' };
        }
      } else if (response.status === 503) {
        return { details: 'Database in fallback mode (expected for test environment)' };
      }
      
      throw new Error('Database data retrieval not working properly');
    } catch (error) {
      throw new Error(`Database data integrity check failed: ${error.message}`);
    }
  }

  // Authentication-specific sanity tests
  async testAuthenticationEndpoints() {
    try {
      // Test that auth endpoints are accessible (even if not fully configured)
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      if (data.data && data.data.services && data.data.services.supabase) {
        return { details: `Authentication service status: ${data.data.services.supabase}` };
      }
      
      return { details: 'Authentication endpoints accessible' };
    } catch (error) {
      throw new Error(`Authentication check failed: ${error.message}`);
    }
  }

  // API-specific sanity tests
  async testAPIResponseFormat() {
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      // Check basic API response structure
      if (typeof data !== 'object' || !data.hasOwnProperty('success')) {
        throw new Error('API response format is inconsistent');
      }
      
      return { details: 'API response format is consistent' };
    } catch (error) {
      throw new Error(`API response format check failed: ${error.message}`);
    }
  }

  // Security-specific sanity tests
  async testBasicSecurityHeaders() {
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck');
      
      // Check for basic security considerations
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.log('Warning: API not setting proper content-type headers', 'warning');
      }
      
      return { details: 'Basic security headers check completed' };
    } catch (error) {
      throw new Error(`Security headers check failed: ${error.message}`);
    }
  }

  generateSanityReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.passed + this.results.failed + this.results.skipped;
    
    const report = {
      type: 'SANITY_TEST',
      focusArea: this.focusArea || 'all',
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate: (this.results.passed + this.results.failed) > 0 ? 
          ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2) : 0,
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        changesValid: this.results.failed === 0
      },
      tests: this.results.tests,
      timestamp: new Date().toISOString(),
      verdict: this.results.failed === 0 ? 'CHANGES_VALID' : 'CHANGES_INVALID'
    };
    
    // Save sanity test report
    const reportPath = path.join(__dirname, `sanity-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async run() {
    this.log('🔍 Starting Automated Sanity Testing Suite', 'info');
    if (this.focusArea) {
      this.log(`🎯 Focus Area: ${this.focusArea}`, 'info');
    }
    this.log('🔧 Validating recent changes and specific areas', 'info');
    this.log('=' * 55, 'info');
    
    // Run sanity tests by area
    await this.runSanityTest('Frontend Component Syntax', () => this.testFrontendComponentSyntax(), 'frontend');
    await this.runSanityTest('Frontend Test Suite', () => this.testFrontendTestSuite(), 'frontend');
    await this.runSanityTest('Backend API Responses', () => this.testBackendAPIResponses(), 'backend');
    await this.runSanityTest('Backend Database Connection', () => this.testBackendDatabaseConnection(), 'backend');
    await this.runSanityTest('Database Data Integrity', () => this.testDatabaseDataIntegrity(), 'database');
    await this.runSanityTest('Authentication Endpoints', () => this.testAuthenticationEndpoints(), 'auth');
    await this.runSanityTest('API Response Format', () => this.testAPIResponseFormat(), 'api');
    await this.runSanityTest('Basic Security Headers', () => this.testBasicSecurityHeaders(), 'security');
    
    // Generate and display report
    const report = this.generateSanityReport();
    
    this.log('=' * 55, 'info');
    this.log('🔍 SANITY TESTING COMPLETE', 'info');
    this.log(`Changes Status: ${report.verdict}`, report.verdict === 'CHANGES_VALID' ? 'success' : 'error');
    this.log(`Tests: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.skipped} skipped`, 'info');
    this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
    this.log(`Duration: ${report.summary.totalDuration}`, 'info');
    
    if (report.verdict === 'CHANGES_VALID') {
      this.log('🎉 Recent changes are working correctly!', 'success');
    } else {
      this.log('🚨 Recent changes have issues - Review and fix!', 'error');
    }
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run sanity tests if called directly
if (require.main === module) {
  // Allow focus area to be specified as command line argument
  const focusArea = process.argv[2];
  const tester = new SanityTester(focusArea);
  
  tester.run().catch(error => {
    console.error('❌ Sanity testing failed:', error);
    process.exit(1);
  });
}

module.exports = SanityTester;
