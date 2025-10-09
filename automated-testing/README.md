# 🤖 ECTRACC Automated Testing Framework

Comprehensive automated testing suite implementing **Regression Testing**, **Smoke Testing**, **Sanity Testing**, and **Continuous Testing** for the ECTRACC Carbon Footprint Tracker application.

## 📋 Testing Types Implemented

### 1. **Regression Testing** 🔄
- **Purpose**: Checks that new changes didn't break existing functionality
- **Scope**: Comprehensive tests against core application features
- **When to Use**: After major changes, before releases
- **Script**: `regression-tests.js`

### 2. **Smoke Testing** 💨
- **Purpose**: Quick check that the build is stable enough for further testing
- **Scope**: Basic functionality and critical paths
- **When to Use**: After builds, before detailed testing
- **Script**: `smoke-tests.js`

### 3. **Sanity Testing** 🔍
- **Purpose**: Focused recheck of specific areas after a small change
- **Scope**: Targeted validation of recent changes
- **When to Use**: After bug fixes, minor updates
- **Script**: `sanity-tests.js`

### 4. **Continuous Testing** 🔄
- **Purpose**: Automated testing integrated into CI/CD pipelines
- **Scope**: Orchestrates different test types based on triggers
- **When to Use**: Automated in CI/CD, on commits, deployments
- **Script**: `continuous-testing.js`

## 🚀 Quick Start

### Install Dependencies
```bash
cd automated-testing
npm install
```

### Run Individual Test Suites

```bash
# Smoke Tests (Fast - 30 seconds)
npm run test:smoke

# Sanity Tests (Medium - 1-2 minutes)
npm run test:sanity

# Regression Tests (Comprehensive - 3-5 minutes)
npm run test:regression

# Full Continuous Testing Pipeline
npm run test:continuous
```

### Advanced Usage

```bash
# Run full test suite
npm run test:all

# Run tests in parallel (faster)
npm run test:parallel

# CI/CD Integration
npm run test:ci        # For commit triggers
npm run test:deploy    # For deployment triggers

# Focus sanity testing on specific area
node sanity-tests.js frontend
node sanity-tests.js backend
node sanity-tests.js database
```

## 📊 Test Categories & Coverage

### **Regression Testing Coverage**
- ✅ Backend Unit Tests
- ✅ Frontend Unit Tests  
- ✅ API Endpoints Accessibility
- ✅ Build Integrity
- ✅ Database Connection
- ✅ Critical User Journeys

### **Smoke Testing Coverage**
- ✅ Server Startup
- ✅ Frontend Build
- ✅ Database Connectivity
- ✅ Critical Endpoints
- ✅ Basic Security
- ✅ Environment Configuration

### **Sanity Testing Coverage**
- ✅ Frontend Component Syntax
- ✅ Frontend Test Suite
- ✅ Backend API Responses
- ✅ Backend Database Connection
- ✅ Database Data Integrity
- ✅ Authentication Endpoints
- ✅ API Response Format
- ✅ Basic Security Headers

### **Continuous Testing Pipeline**
- ✅ Pre-flight Checks
- ✅ Environment Setup
- ✅ Orchestrated Test Execution
- ✅ Parallel/Sequential Execution
- ✅ Comprehensive Reporting
- ✅ CI/CD Integration

## 🔧 Configuration Options

### Continuous Testing Configuration

```bash
# Trigger Types
--trigger-type=commit    # For commit-based testing
--trigger-type=pr        # For pull request testing  
--trigger-type=deploy    # For deployment testing
--trigger-type=manual    # For manual testing

# Test Suites
--test-suite=smoke       # Quick smoke tests only
--test-suite=sanity      # Sanity tests only
--test-suite=regression  # Regression tests only
--test-suite=full        # All test types

# Execution Options
--parallel=true          # Run tests in parallel
--timeout=300000         # Set timeout (ms)
```

## 📈 Test Reports

All test suites generate detailed JSON reports:

- `smoke-report-{timestamp}.json` - Smoke test results
- `sanity-report-{timestamp}.json` - Sanity test results  
- `regression-report-{timestamp}.json` - Regression test results
- `continuous-testing-report-{timestamp}.json` - Full pipeline results

### Report Structure
```json
{
  "summary": {
    "totalTests": 10,
    "passed": 8,
    "failed": 2,
    "successRate": "80.00%",
    "totalDuration": "45.32s"
  },
  "tests": [...],
  "timestamp": "2025-10-08T23:00:00.000Z",
  "verdict": "BUILD_STABLE"
}
```

## 🎯 CI/CD Integration

### GitHub Actions Example
```yaml
name: Automated Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd automated-testing && npm install
      - run: cd automated-testing && npm run test:ci
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    stages {
        stage('Smoke Tests') {
            steps {
                sh 'cd automated-testing && npm run test:smoke'
            }
        }
        stage('Full Testing') {
            when { branch 'main' }
            steps {
                sh 'cd automated-testing && npm run test:all'
            }
        }
    }
}
```

## 🔍 Test Execution Flow

### 1. **Commit Trigger**
```
Smoke Tests → Sanity Tests (focused area) → Report
```

### 2. **Pull Request Trigger**  
```
Smoke Tests → Sanity Tests → Regression Tests → Report
```

### 3. **Deployment Trigger**
```
Full Pipeline: Smoke → Sanity → Regression → Integration → Report
```

### 4. **Manual Testing**
```
User Choice: Any combination of test suites
```

## 📋 Prerequisites

### System Requirements
- Node.js 14+ 
- npm 6+
- ECTRACC application running on localhost:8000

### Application Requirements
- Backend server accessible
- Frontend build available
- Database connection configured (optional - graceful degradation)

## 🛠️ Troubleshooting

### Common Issues

**Server Not Running**
```bash
# Start the ECTRACC server first
cd .. && npm start
```

**Port Conflicts**
```bash
# Check if server is running on correct port
curl http://localhost:8000/api/healthcheck
```

**Dependency Issues**
```bash
# Reinstall dependencies
npm install
cd ../ectracc-backend && npm install
cd ../ectracc-frontend && npm install
```

**Test Timeouts**
```bash
# Increase timeout for slower systems
node continuous-testing.js --timeout=600000
```

## 📊 Performance Benchmarks

| Test Suite | Duration | Coverage | Use Case |
|------------|----------|----------|----------|
| Smoke | 30s | Basic | Build verification |
| Sanity | 1-2min | Focused | Change validation |
| Regression | 3-5min | Comprehensive | Release testing |
| Full Pipeline | 5-10min | Complete | Production deployment |

## 🎉 Success Criteria

### **Build Stable** ✅
- All smoke tests pass
- Critical endpoints responding
- Basic functionality working

### **Changes Valid** ✅  
- Sanity tests pass for affected areas
- No regression in core features
- API responses consistent

### **Release Ready** ✅
- All regression tests pass
- Full user journeys working
- Performance within acceptable limits

## 🔄 Continuous Improvement

The automated testing framework is designed to evolve with the application:

1. **Add New Tests**: Extend test suites as features are added
2. **Performance Monitoring**: Track test execution times
3. **Coverage Analysis**: Identify gaps in test coverage
4. **CI/CD Optimization**: Improve pipeline efficiency

## 📞 Support

For issues with the automated testing framework:

1. Check the generated test reports for detailed error information
2. Review the troubleshooting section above
3. Ensure all prerequisites are met
4. Check server logs for backend issues

---

**Happy Testing! 🚀**

*Automated Testing Framework v1.0.0*  
*Built for ECTRACC Carbon Footprint Tracker*
