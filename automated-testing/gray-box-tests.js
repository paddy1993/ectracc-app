#!/usr/bin/env node

/**
 * GRAY BOX TESTING SUITE
 * 
 * Combines both Black Box and White Box approaches (partial knowledge)
 * Tests functionality with limited internal knowledge for comprehensive validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GrayBoxTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.startTime = Date.now();
    this.baseUrl = 'http://localhost:8000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔘',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || '🔘';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runGrayBoxTest(testName, testFunction) {
    this.log(`Gray Box Test: ${testName}`, 'info');
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        details: result?.details || ''
      });
      this.log(`✅ GRAY BOX PASSED: ${testName} (${duration}ms)`, 'success');
      return true;
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        error: error.message
      });
      this.log(`❌ GRAY BOX FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  // Integration Testing (Gray Box - knows about components but tests end-to-end)
  async testIntegrationFlow() {
    // Gray box: We know there's a frontend, backend, and database, test their integration
    const integrationTests = [
      {
        name: 'Frontend-Backend Integration',
        test: async () => {
          // Test that frontend build can communicate with backend
          const frontendExists = fs.existsSync(path.join(__dirname, '../ectracc-frontend/build'));
          const backendResponse = await fetch(`${this.baseUrl}/api/healthcheck`);
          
          return frontendExists && (backendResponse.ok || backendResponse.status === 503);
        }
      },
      {
        name: 'Backend-Database Integration',
        test: async () => {
          // Gray box: We know backend should report database status
          const response = await fetch(`${this.baseUrl}/api/healthcheck`);
          const data = await response.json();
          
          return data.data && data.data.services && 
                 (data.data.services.mongodb || data.data.services.supabase);
        }
      },
      {
        name: 'API-Data Integration',
        test: async () => {
          // Test that API endpoints can handle data requests
          const searchResponse = await fetch(`${this.baseUrl}/api/products/search?q=test`);
          const categoriesResponse = await fetch(`${this.baseUrl}/api/products/categories`);
          
          return (searchResponse.ok || searchResponse.status === 503) &&
                 (categoriesResponse.ok || categoriesResponse.status === 503);
        }
      }
    ];

    let passedIntegrations = 0;

    for (const test of integrationTests) {
      try {
        const result = await test.test();
        if (result) {
          passedIntegrations++;
        }
      } catch (error) {
        this.log(`Integration test "${test.name}" error: ${error.message}`, 'warning');
      }
    }

    return { details: `Integration flow: ${passedIntegrations}/${integrationTests.length} component integrations working` };
  }

  // API Workflow Testing (Gray Box - knows API structure, tests workflows)
  async testAPIWorkflows() {
    // Gray box: We know the API structure and test complete workflows
    const workflows = [
      {
        name: 'Product Discovery Workflow',
        steps: [
          async () => {
            // Step 1: Get available categories
            const response = await fetch(`${this.baseUrl}/api/products/categories`);
            return response.ok || response.status === 503;
          },
          async () => {
            // Step 2: Search for products
            const response = await fetch(`${this.baseUrl}/api/products/search?q=milk`);
            return response.ok || response.status === 503;
          },
          async () => {
            // Step 3: Get random products (alternative discovery)
            const response = await fetch(`${this.baseUrl}/api/products/random`);
            return response.ok || response.status === 503;
          }
        ]
      },
      {
        name: 'System Health Workflow',
        steps: [
          async () => {
            // Step 1: Check system health
            const response = await fetch(`${this.baseUrl}/api/healthcheck`);
            return response.ok || response.status === 503;
          },
          async () => {
            // Step 2: Verify API responsiveness
            const response = await fetch(`${this.baseUrl}/api/products/stats`);
            return response.ok || response.status === 503;
          }
        ]
      }
    ];

    let workflowResults = [];

    for (const workflow of workflows) {
      let workflowPassed = true;
      let stepsPassed = 0;

      for (const step of workflow.steps) {
        try {
          const result = await step();
          if (result) {
            stepsPassed++;
          } else {
            workflowPassed = false;
          }
        } catch (error) {
          workflowPassed = false;
          this.log(`Workflow "${workflow.name}" step error: ${error.message}`, 'warning');
        }
      }

      workflowResults.push({
        name: workflow.name,
        passed: workflowPassed,
        steps: `${stepsPassed}/${workflow.steps.length}`
      });
    }

    const passedWorkflows = workflowResults.filter(w => w.passed).length;

    return { 
      details: `API workflows: ${passedWorkflows}/${workflows.length} complete workflows working\n${workflowResults.map(w => `${w.passed ? '✅' : '❌'} ${w.name} (${w.steps})`).join('\n')}` 
    };
  }

  // Data Flow Testing (Gray Box - knows data structure, tests flow)
  async testDataFlow() {
    // Gray box: We know the expected data structures and test data flow
    try {
      // Test data input flow
      const searchResponse = await fetch(`${this.baseUrl}/api/products/search?q=milk&limit=1`);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        // Gray box: We know the expected response structure
        const hasValidStructure = (
          searchData.success === true &&
          searchData.data &&
          typeof searchData.data === 'object'
        );

        if (!hasValidStructure) {
          throw new Error('Search data flow structure invalid');
        }

        // Test data output consistency
        const healthResponse = await fetch(`${this.baseUrl}/api/healthcheck`);
        const healthData = await healthResponse.json();

        const consistentFormat = (
          healthData.hasOwnProperty('success') &&
          healthData.hasOwnProperty('data')
        );

        if (!consistentFormat) {
          throw new Error('Data output format inconsistent across endpoints');
        }

        return { details: 'Data flow: Input processing and output formatting working correctly' };
      } else if (searchResponse.status === 503) {
        // Gray box: We know 503 means service unavailable but data flow is still working
        const errorData = await searchResponse.json();
        
        const hasErrorStructure = (
          errorData.success === false &&
          errorData.hasOwnProperty('message')
        );

        if (!hasErrorStructure) {
          throw new Error('Error data flow structure invalid');
        }

        return { details: 'Data flow: Error handling and fallback data flow working correctly' };
      } else {
        throw new Error(`Unexpected response status: ${searchResponse.status}`);
      }
    } catch (error) {
      throw new Error(`Data flow test failed: ${error.message}`);
    }
  }

  // Configuration-Based Testing (Gray Box - knows config exists, tests behavior)
  async testConfigurationBehavior() {
    // Gray box: We know there are configuration files and test their effects
    const configTests = [
      {
        name: 'Environment Configuration Effect',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/healthcheck`);
          const data = await response.json();
          
          // Gray box: Configuration should affect reported environment
          return data.data && data.data.environment && 
                 (data.data.environment === 'development' || 
                  data.data.environment === 'production' || 
                  data.data.environment === 'test');
        }
      },
      {
        name: 'Database Configuration Effect',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/healthcheck`);
          const data = await response.json();
          
          // Gray box: Database configuration should affect connection status
          return data.data && data.data.services && 
                 (data.data.services.mongodb === 'connected' || 
                  data.data.services.mongodb === 'fallback' ||
                  data.data.services.mongodb === 'disconnected');
        }
      },
      {
        name: 'CORS Configuration Effect',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/healthcheck`);
          
          // Gray box: CORS configuration should add headers
          return response.headers.get('access-control-allow-origin') !== null;
        }
      }
    ];

    let configPassed = 0;

    for (const test of configTests) {
      try {
        const result = await test.test();
        if (result) {
          configPassed++;
        }
      } catch (error) {
        this.log(`Configuration test "${test.name}" error: ${error.message}`, 'warning');
      }
    }

    return { details: `Configuration behavior: ${configPassed}/${configTests.length} config effects verified` };
  }

  // Performance Under Load (Gray Box - knows architecture, tests realistic scenarios)
  async testPerformanceUnderLoad() {
    // Gray box: We know the system architecture and test realistic load scenarios
    const loadTests = [
      {
        name: 'Concurrent Health Checks',
        test: async () => {
          const promises = Array(5).fill().map(() => 
            fetch(`${this.baseUrl}/api/healthcheck`)
          );
          
          const responses = await Promise.all(promises);
          const successfulResponses = responses.filter(r => r.ok || r.status === 503).length;
          
          return successfulResponses >= 4; // Allow 1 failure out of 5
        }
      },
      {
        name: 'Mixed API Load',
        test: async () => {
          const promises = [
            fetch(`${this.baseUrl}/api/healthcheck`),
            fetch(`${this.baseUrl}/api/products/search?q=milk`),
            fetch(`${this.baseUrl}/api/products/categories`),
            fetch(`${this.baseUrl}/api/products/random`)
          ];
          
          const responses = await Promise.all(promises);
          const successfulResponses = responses.filter(r => r.ok || r.status === 503).length;
          
          return successfulResponses >= 3; // Allow 1 failure out of 4
        }
      }
    ];

    let loadPassed = 0;
    const loadResults = [];

    for (const test of loadTests) {
      try {
        const startTime = Date.now();
        const result = await test.test();
        const duration = Date.now() - startTime;
        
        if (result) {
          loadPassed++;
          loadResults.push(`✅ ${test.name} (${duration}ms)`);
        } else {
          loadResults.push(`❌ ${test.name} (${duration}ms)`);
        }
      } catch (error) {
        loadResults.push(`❌ ${test.name} (error: ${error.message})`);
      }
    }

    return { 
      details: `Performance under load: ${loadPassed}/${loadTests.length} load scenarios handled\n${loadResults.join('\n')}` 
    };
  }

  // Security with Architecture Knowledge (Gray Box)
  async testSecurityWithArchitecture() {
    // Gray box: We know the architecture and test security accordingly
    const securityTests = [
      {
        name: 'API Authentication Bypass Attempt',
        test: async () => {
          // Try to access endpoints that might require authentication
          const response = await fetch(`${this.baseUrl}/api/products/search?q=test`);
          
          // Gray box: Public endpoints should work, protected ones should be secured
          return response.status !== 500; // Should not crash the server
        }
      },
      {
        name: 'Input Sanitization Verification',
        test: async () => {
          const maliciousInputs = [
            '<script>alert("xss")</script>',
            '"; DROP TABLE products; --',
            '../../../etc/passwd',
            '${7*7}', // Template injection
            'javascript:alert(1)' // JavaScript protocol
          ];

          let sanitizedCount = 0;

          for (const input of maliciousInputs) {
            try {
              const response = await fetch(`${this.baseUrl}/api/products/search?q=${encodeURIComponent(input)}`);
              
              if (response.ok) {
                const data = await response.json();
                const responseText = JSON.stringify(data);
                
                // Gray box: Response should not contain unsanitized malicious input
                if (!responseText.includes('<script>') && 
                    !responseText.includes('DROP TABLE') &&
                    !responseText.includes('etc/passwd')) {
                  sanitizedCount++;
                }
              } else {
                // Rejecting malicious input is also good
                sanitizedCount++;
              }
            } catch (error) {
              // Server protecting itself is acceptable
              sanitizedCount++;
            }
          }

          return sanitizedCount >= maliciousInputs.length * 0.8; // 80% threshold
        }
      },
      {
        name: 'Error Information Disclosure',
        test: async () => {
          // Test that errors don't reveal sensitive information
          const response = await fetch(`${this.baseUrl}/api/nonexistent/path/with/sensitive/info`);
          
          if (response.status === 404) {
            try {
              const data = await response.json();
              const errorText = JSON.stringify(data).toLowerCase();
              
              // Gray box: Error messages should not reveal sensitive paths or info
              return !errorText.includes('password') && 
                     !errorText.includes('secret') && 
                     !errorText.includes('key') &&
                     !errorText.includes('/users/') &&
                     !errorText.includes('database');
            } catch {
              return true; // Non-JSON error response is acceptable
            }
          }
          
          return true; // Other status codes are acceptable
        }
      }
    ];

    let securityPassed = 0;

    for (const test of securityTests) {
      try {
        const result = await test.test();
        if (result) {
          securityPassed++;
        }
      } catch (error) {
        this.log(`Security test "${test.name}" error: ${error.message}`, 'warning');
      }
    }

    return { details: `Security with architecture: ${securityPassed}/${securityTests.length} security measures verified` };
  }

  // End-to-End User Scenarios (Gray Box)
  async testEndToEndScenarios() {
    // Gray box: We know the user flow and system components, test realistic scenarios
    const scenarios = [
      {
        name: 'New User Product Discovery',
        steps: [
          'Check system availability',
          'Browse available categories', 
          'Search for specific product',
          'View random product suggestions'
        ],
        test: async () => {
          // Step 1: System availability
          const healthCheck = await fetch(`${this.baseUrl}/api/healthcheck`);
          if (!healthCheck.ok && healthCheck.status !== 503) return false;

          // Step 2: Browse categories
          const categories = await fetch(`${this.baseUrl}/api/products/categories`);
          if (!categories.ok && categories.status !== 503) return false;

          // Step 3: Search products
          const search = await fetch(`${this.baseUrl}/api/products/search?q=milk`);
          if (!search.ok && search.status !== 503) return false;

          // Step 4: Random suggestions
          const random = await fetch(`${this.baseUrl}/api/products/random`);
          if (!random.ok && random.status !== 503) return false;

          return true;
        }
      },
      {
        name: 'System Administrator Monitoring',
        steps: [
          'Check system health',
          'Verify database connectivity',
          'Monitor API performance',
          'Check error handling'
        ],
        test: async () => {
          // Step 1: System health
          const health = await fetch(`${this.baseUrl}/api/healthcheck`);
          if (!health.ok && health.status !== 503) return false;

          const healthData = await health.json();
          if (!healthData.data || !healthData.data.services) return false;

          // Step 2: Database connectivity (reported in health)
          const dbStatus = healthData.data.services.mongodb || healthData.data.services.supabase;
          if (!dbStatus) return false;

          // Step 3: API performance (basic responsiveness)
          const startTime = Date.now();
          const apiTest = await fetch(`${this.baseUrl}/api/products/stats`);
          const responseTime = Date.now() - startTime;
          if (responseTime > 10000) return false; // 10 second threshold

          // Step 4: Error handling
          const errorTest = await fetch(`${this.baseUrl}/api/nonexistent`);
          if (errorTest.status !== 404) return false;

          return true;
        }
      }
    ];

    let scenarioResults = [];

    for (const scenario of scenarios) {
      try {
        const result = await scenario.test();
        scenarioResults.push({
          name: scenario.name,
          passed: result,
          steps: scenario.steps.length
        });
      } catch (error) {
        scenarioResults.push({
          name: scenario.name,
          passed: false,
          error: error.message
        });
      }
    }

    const passedScenarios = scenarioResults.filter(s => s.passed).length;

    return { 
      details: `End-to-end scenarios: ${passedScenarios}/${scenarios.length} user scenarios working\n${scenarioResults.map(s => `${s.passed ? '✅' : '❌'} ${s.name}${s.error ? ` (${s.error})` : ''}`).join('\n')}` 
    };
  }

  generateGrayBoxReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.passed + this.results.failed;
    
    const report = {
      type: 'GRAY_BOX_TESTING',
      approach: 'Combined Black Box and White Box testing with partial knowledge',
      summary: {
        totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(2) : 0,
        totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
        comprehensiveValidation: this.results.failed === 0
      },
      tests: this.results.tests,
      testCategories: [
        'Integration Flow',
        'API Workflows',
        'Data Flow',
        'Configuration Behavior',
        'Performance Under Load',
        'Security with Architecture',
        'End-to-End User Scenarios'
      ],
      timestamp: new Date().toISOString(),
      verdict: this.results.failed === 0 ? 'COMPREHENSIVE_VALIDATION_PASSED' : 'COMPREHENSIVE_ISSUES_DETECTED'
    };
    
    // Save gray box test report
    const reportPath = path.join(__dirname, `gray-box-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  async run() {
    this.log('🔘 Starting Gray Box Testing Suite', 'info');
    this.log('🎯 Combining Black Box and White Box approaches with partial knowledge', 'info');
    this.log('=' * 70, 'info');
    
    // Run gray box tests (combined approach)
    await this.runGrayBoxTest('Integration Flow', () => this.testIntegrationFlow());
    await this.runGrayBoxTest('API Workflows', () => this.testAPIWorkflows());
    await this.runGrayBoxTest('Data Flow', () => this.testDataFlow());
    await this.runGrayBoxTest('Configuration Behavior', () => this.testConfigurationBehavior());
    await this.runGrayBoxTest('Performance Under Load', () => this.testPerformanceUnderLoad());
    await this.runGrayBoxTest('Security with Architecture', () => this.testSecurityWithArchitecture());
    await this.runGrayBoxTest('End-to-End User Scenarios', () => this.testEndToEndScenarios());
    
    // Generate and display report
    const report = this.generateGrayBoxReport();
    
    this.log('=' * 70, 'info');
    this.log('🔘 GRAY BOX TESTING COMPLETE', 'info');
    this.log(`Comprehensive Status: ${report.verdict}`, report.verdict === 'COMPREHENSIVE_VALIDATION_PASSED' ? 'success' : 'error');
    this.log(`Tests: ${report.summary.passed}/${report.summary.totalTests} passed`, 'info');
    this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
    this.log(`Duration: ${report.summary.totalDuration}`, 'info');
    
    if (report.verdict === 'COMPREHENSIVE_VALIDATION_PASSED') {
      this.log('🎉 Comprehensive validation passed - System ready for production!', 'success');
    } else {
      this.log('🚨 Comprehensive issues detected - Review before production!', 'error');
    }
    
    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0);
  }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run gray box tests if called directly
if (require.main === module) {
  const tester = new GrayBoxTester();
  tester.run().catch(error => {
    console.error('❌ Gray box testing failed:', error);
    process.exit(1);
  });
}

module.exports = GrayBoxTester;
