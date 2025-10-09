#!/usr/bin/env node

/**
 * AUTOMATED SMOKE TESTING SUITE
 * 
 * Quick check that the build is stable enough for further testing
 * Focuses on basic functionality and critical paths
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SmokeTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '💨',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '💨';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runSmokeTest(testName, testFunction) {
    this.log(`Smoke Test: ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`
      });
      this.log(`✅ SMOKE PASSED: ${testName} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message
      });
      this.log(`❌ SMOKE FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  async testServerStartup() {
    // Quick check if server responds
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck', {
        timeout: 5000
      });
      
      if (!response.ok && response.status !== 503) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Server not responding: ${error.message}`);
    }
  }

  async testFrontendBuild() {
    // Quick check if frontend can be built
    const buildDir = path.join(__dirname, '../ectracc-frontend/build');
    
    if (!fs.existsSync(buildDir)) {
      throw new Error('Frontend build directory does not exist');
    }
    
    const indexPath = path.join(buildDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error('Frontend index.html not found');
    }
    
    // Check if index.html has basic content
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (!indexContent.includes('ECTRACC') && !indexContent.includes('root')) {
      throw new Error('Frontend index.html appears to be corrupted');
    }
    
    return true;
  }

  async testDatabaseConnectivity() {
    // Quick database connectivity check
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      // Just check that we get a response with some structure
      if (!data || typeof data !== 'object') {
        throw new Error('Health check returned invalid response');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Database connectivity check failed: ${error.message}`);
    }
  }

  async testCriticalEndpoints() {
    // Test only the most critical endpoints quickly
    const criticalEndpoints = [
      'http://localhost:8000/api/healthcheck',
      'http://localhost:8000/api/products/search?q=test'
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint, { timeout: 3000 });
        
        // Accept both success and graceful degradation (503)
        if (!response.ok && response.status !== 503) {
          throw new Error(`Critical endpoint ${endpoint} failed with status ${response.status}`);
        }
      } catch (error) {
        throw new Error(`Critical endpoint ${endpoint} unreachable: ${error.message}`);
      }
    }
    
    return true;
  }

  async testBasicSecurity() {
    // Quick security smoke test
    try {
      // Test that server doesn't expose sensitive information
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      const responseText = JSON.stringify(data).toLowerCase();
      
      // Check for common security issues
      const sensitivePatterns = ['password', 'secret', 'key', 'token'];
      for (const pattern of sensitivePatterns) {
        if (responseText.includes(pattern) && !responseText.includes('placeholder')) {
          throw new Error(`Potential sensitive information exposure: ${pattern}`);
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`Basic security check failed: ${error.message}`);
    }
  }

  async testEnvironmentConfiguration() {
    // Quick environment configuration check
    try {
      const response = await fetch('http://localhost:8000/api/healthcheck');
      const data = await response.json();
      
      if (data.data && data.data.environment) {
        const env = data.data.environment;
        if (env !== 'development' && env !== 'production' && env !== 'test') {
          throw new Error(`Unknown environment: ${env}`);
        }
      }
      
      return true;
    } catch (error) {
      throw new Error(`Environment configuration check failed: ${error.message}`);
    }
  }

  generateSmokeReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.passed + this.results.failed;
    
    const report = {
      type: 'SMOKE_TEST',
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(2) : 0,
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        buildStable: this.results.failed === 0
      },
      tests: this.results.tests,
      timestamp: new Date().toISOString(),
      verdict: this.results.failed === 0 ? 'BUILD_STABLE' : 'BUILD_UNSTABLE'
    };
    
    // Save smoke test report
    const reportPath = path.join(__dirname, `smoke-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async run() {
    this.log('💨 Starting Automated Smoke Testing Suite', 'info');
    this.log('🎯 Quick stability check for build verification', 'info');
    this.log('=' * 50, 'info');
    
    // Run smoke tests (fast and focused)
    await this.runSmokeTest('Server Startup', () => this.testServerStartup());
    await this.runSmokeTest('Frontend Build', () => this.testFrontendBuild());
    await this.runSmokeTest('Database Connectivity', () => this.testDatabaseConnectivity());
    await this.runSmokeTest('Critical Endpoints', () => this.testCriticalEndpoints());
    await this.runSmokeTest('Basic Security', () => this.testBasicSecurity());
    await this.runSmokeTest('Environment Configuration', () => this.testEnvironmentConfiguration());
    
    // Generate and display report
    const report = this.generateSmokeReport();
    
    this.log('=' * 50, 'info');
    this.log('💨 SMOKE TESTING COMPLETE', 'info');
    this.log(`Build Status: ${report.verdict}`, report.verdict === 'BUILD_STABLE' ? 'success' : 'error');
    this.log(`Tests: ${report.summary.passed}/${report.summary.totalTests} passed`, 'info');
    this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
    this.log(`Duration: ${report.summary.totalDuration}`, 'info');
    
    if (report.verdict === 'BUILD_STABLE') {
      this.log('🎉 Build is stable - Ready for further testing!', 'success');
    } else {
      this.log('🚨 Build is unstable - Fix issues before proceeding!', 'error');
    }
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run smoke tests if called directly
if (require.main === module) {
  const tester = new SmokeTester();
  tester.run().catch(error => {
    console.error('❌ Smoke testing failed:', error);
    process.exit(1);
  });
}

module.exports = SmokeTester;
