# 🔄 ECTRACC Development Workflow & Testing Plan

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Purpose**: Comprehensive guide for testing changes and managing commits across Web, Android, and iOS platforms

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Development Workflow](#development-workflow)
3. [Testing Strategy](#testing-strategy)
4. [Commit Guidelines](#commit-guidelines)
5. [Branch Strategy](#branch-strategy)
6. [Platform-Specific Guidelines](#platform-specific-guidelines)
7. [CI/CD Integration](#cicd-integration)
8. [Release Process](#release-process)
9. [Quick Reference](#quick-reference)

---

## 🎯 Overview

### Project Structure
```
ectracc-fresh/
├── src/                    # Web application (React)
├── ectracc-mobile/        # Mobile app (Expo/React Native)
├── ectracc-backend/       # Backend API
├── packages/              # Shared packages
│   ├── shared-core/       # Core utilities
│   ├── shared-services/   # Services layer
│   └── shared-types/      # TypeScript types
└── automated-testing/     # E2E and integration tests
```

### Affected Platforms by Location
| Location | Affects |
|----------|---------|
| `src/**` | Web only |
| `ectracc-mobile/**` | Android + iOS |
| `packages/**` | Web + Android + iOS |
| `ectracc-backend/**` | All platforms (API) |

---

## 🔄 Development Workflow

### Step 1: Before Starting Work

```bash
# 1. Ensure you're on the latest main branch
git checkout main
git pull origin main

# 2. Install/update dependencies
npm install

# 3. Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b chore/maintenance-task
```

### Step 2: Making Changes

#### For Web-Only Changes
```bash
# Edit files in src/
# Example: src/components/Dashboard.tsx

# Test locally
npm run dev
```

#### For Mobile-Only Changes
```bash
# Edit files in ectracc-mobile/
# Example: ectracc-mobile/src/screens/DashboardScreen.tsx

# Test on iOS
cd ectracc-mobile
npm start
# Press 'i' for iOS simulator

# Test on Android
npm start
# Press 'a' for Android emulator
```

#### For Shared Package Changes
```bash
# Edit files in packages/
# Example: packages/shared-core/src/utils/carbonCalculations.ts

# THIS AFFECTS ALL PLATFORMS! Test thoroughly.
```

### Step 3: Running Tests

```bash
# Run ALL tests before committing
npm run test:all

# Or run specific test suites
npm run test:shared      # Shared packages only
npm run test:mobile      # Mobile app only
npm test                 # Web app only

# With coverage
npm run test:coverage
```

### Step 4: Pre-Commit Checklist

- [ ] Code runs without errors
- [ ] All tests pass
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Changes tested on relevant platforms
- [ ] Documentation updated if needed
- [ ] No console.log() or debug code left

### Step 5: Committing Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message (see Commit Guidelines below)
git commit -m "type(scope): description"

# Examples:
git commit -m "feat(web): add dark mode toggle to dashboard"
git commit -m "fix(mobile): resolve crash on barcode scan"
git commit -m "refactor(shared): optimize carbon calculation algorithm"
```

### Step 6: Push and Create PR

```bash
# Push to remote
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# - Fill in PR template
# - Request reviews
# - Link related issues
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
         ╱╲
        ╱  ╲    E2E Tests (Automated Testing Suite)
       ╱────╲   10% - Smoke, Sanity, Regression
      ╱      ╲
     ╱────────╲  Integration Tests (API + Services)
    ╱          ╲ 30% - Test shared services, API endpoints
   ╱────────────╲
  ╱              ╲ Unit Tests (Components + Utils)
 ╱────────────────╲ 60% - Test individual functions/components
```

### 1. Unit Tests (Always Run)

**When**: Before every commit  
**Duration**: < 1 minute  
**Coverage**: Individual components, utilities, functions

```bash
# Web unit tests
npm test -- --watchAll=false

# Mobile unit tests
npm run test:mobile

# Shared packages tests
npm run test:shared

# All unit tests
npm run test:all
```

**What to Test**:
- ✅ Individual React components
- ✅ Utility functions
- ✅ Carbon calculation logic
- ✅ Data formatting functions
- ✅ Business logic in services

### 2. Type Checking (Always Run)

**When**: Before every commit  
**Duration**: < 30 seconds

```bash
# Check web types
npx tsc --noEmit

# Check mobile types
cd ectracc-mobile && npx tsc --noEmit

# Check shared packages
cd packages/shared-core && npx tsc --noEmit
cd packages/shared-services && npx tsc --noEmit
```

### 3. Linting (Always Run)

**When**: Before every commit  
**Duration**: < 30 seconds

```bash
# Lint mobile code
npm run lint --workspace=ectracc-mobile

# Fix auto-fixable issues
npm run lint --workspace=ectracc-mobile -- --fix
```

### 4. Smoke Tests (Run for Major Changes)

**When**: Before merging to main  
**Duration**: ~50 seconds  
**Coverage**: Critical functionality

```bash
cd automated-testing
npm install
npm run test:smoke
```

**What Smoke Tests Check**:
- ✅ Server starts successfully
- ✅ Frontend builds successfully
- ✅ Database connectivity
- ✅ Critical API endpoints
- ✅ Basic security
- ✅ Environment configuration

### 5. Sanity Tests (Run for Specific Area Changes)

**When**: After changing specific areas  
**Duration**: ~2 minutes  
**Coverage**: Focused validation

```bash
cd automated-testing

# Test specific areas
node sanity-tests.js frontend   # Frontend changes
node sanity-tests.js backend    # Backend changes
node sanity-tests.js database   # Database changes

# Or run all sanity tests
npm run test:sanity
```

### 6. Regression Tests (Run Before Release)

**When**: Before production deployment  
**Duration**: ~5 minutes  
**Coverage**: Comprehensive

```bash
cd automated-testing
npm run test:regression
```

### 7. Platform-Specific Manual Testing

#### Web Testing Checklist
```bash
# 1. Start dev server
npm run dev

# 2. Test in browsers
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile browsers (responsive mode)

# 3. Test key features
- [ ] Authentication (login/signup)
- [ ] Dashboard loads
- [ ] Barcode scanner (via webcam)
- [ ] Product search
- [ ] Carbon footprint tracking
- [ ] Profile updates
- [ ] Data persistence
```

#### iOS Testing Checklist
```bash
# 1. Start iOS simulator
cd ectracc-mobile
npm start
# Press 'i'

# 2. Test on multiple simulators
- [ ] iPhone 15 Pro (latest iOS)
- [ ] iPhone 13 (older device)
- [ ] iPad (tablet layout)

# 3. Test key features
- [ ] Authentication
- [ ] Camera/barcode scanning
- [ ] Navigation
- [ ] Offline functionality
- [ ] Push notifications (if implemented)
- [ ] Dark mode
```

#### Android Testing Checklist
```bash
# 1. Start Android emulator
cd ectracc-mobile
npm start
# Press 'a'

# 2. Test on multiple emulators
- [ ] Pixel 7 (latest Android)
- [ ] Older Android version (API 28+)
- [ ] Tablet (different screen size)

# 3. Test key features
- [ ] Authentication
- [ ] Camera/barcode scanning
- [ ] Navigation
- [ ] Offline functionality
- [ ] Push notifications (if implemented)
- [ ] Dark mode
```

### 8. Testing Matrix by Change Type

| Change Type | Unit Tests | Type Check | Lint | Smoke | Sanity | Regression | Manual |
|-------------|:----------:|:----------:|:----:|:-----:|:------:|:----------:|:------:|
| **Bug fix (single component)** | ✅ | ✅ | ✅ | - | - | - | ✅ |
| **New feature** | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| **Refactoring** | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| **Shared package change** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| **Backend/API change** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| **Before release** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |

---

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(mobile): add barcode history filter` |
| `fix` | Bug fix | `fix(web): resolve dashboard loading issue` |
| `refactor` | Code refactoring | `refactor(shared): optimize carbon calculations` |
| `style` | Formatting, styling | `style(mobile): update button colors` |
| `test` | Adding tests | `test(shared): add carbon calculation tests` |
| `docs` | Documentation | `docs: update API documentation` |
| `chore` | Maintenance | `chore: update dependencies` |
| `perf` | Performance improvement | `perf(web): optimize dashboard rendering` |
| `ci` | CI/CD changes | `ci: add mobile build workflow` |
| `build` | Build system changes | `build: update webpack config` |
| `revert` | Revert previous commit | `revert: revert "feat: add feature X"` |

### Scopes

| Scope | Description | Affects |
|-------|-------------|---------|
| `web` | Web-specific changes | Web only |
| `mobile` | Mobile-specific changes | iOS + Android |
| `ios` | iOS-specific changes | iOS only |
| `android` | Android-specific changes | Android only |
| `shared` | Shared package changes | All platforms |
| `backend` | Backend API changes | All platforms |
| `api` | API endpoint changes | All platforms |
| `auth` | Authentication changes | All platforms |
| `scanner` | Barcode scanner changes | All platforms |
| `dashboard` | Dashboard changes | All platforms |

### Examples

```bash
# Good commits
git commit -m "feat(mobile): add pull-to-refresh on history screen"
git commit -m "fix(web): resolve crash when scanning unknown barcode"
git commit -m "refactor(shared): extract carbon calculation to utility"
git commit -m "test(mobile): add scanner screen tests"
git commit -m "docs: update deployment guide"
git commit -m "perf(web): lazy load dashboard charts"

# Multi-platform changes
git commit -m "feat(shared): add product caching layer

- Implements in-memory cache for products
- Reduces API calls by 60%
- Affects: web, iOS, Android

Closes #123"

# Breaking changes
git commit -m "feat(api): update carbon calculation endpoint

BREAKING CHANGE: API endpoint /api/carbon/calculate now requires
product_id parameter. Update client apps accordingly.

Migration: 
- Mobile: Update src/services/carbonApi.ts
- Web: Update src/services/api.ts"
```

### Commit Best Practices

1. **Keep commits atomic**: One logical change per commit
2. **Write clear subjects**: Limit to 50 characters
3. **Use imperative mood**: "add" not "added", "fix" not "fixed"
4. **Reference issues**: Include `Closes #123` or `Fixes #456`
5. **Explain why, not what**: The diff shows what changed, explain why
6. **Test before committing**: All tests should pass

---

## 🌿 Branch Strategy

### Branch Types

```
main (production)
  │
  ├── develop (integration)
  │     │
  │     ├── feature/add-dark-mode
  │     ├── feature/improve-scanner
  │     └── fix/dashboard-crash
  │
  └── hotfix/critical-bug
```

### Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-product-favorites` |
| Bug Fix | `fix/description` | `fix/scanner-crash-android` |
| Hotfix | `hotfix/description` | `hotfix/login-not-working` |
| Chore | `chore/description` | `chore/update-dependencies` |
| Refactor | `refactor/description` | `refactor/carbon-calculation-logic` |

### Branch Workflow

#### For Regular Development

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature

# 2. Make changes and commit
git add .
git commit -m "feat(scope): description"

# 3. Keep branch updated
git fetch origin main
git rebase origin/main

# 4. Push and create PR
git push origin feature/your-feature
```

#### For Critical Hotfixes

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Make minimal fix
git add .
git commit -m "fix(scope): critical issue description"

# 3. Push and create PR
git push origin hotfix/critical-issue

# 4. Merge to main immediately after review
# 5. Tag release
git tag -a v1.0.1 -m "Hotfix: critical issue"
git push origin v1.0.1
```

### Pull Request Guidelines

#### PR Title Format
```
[Platform] Type: Description
```

Examples:
- `[Web] feat: Add dark mode toggle`
- `[Mobile] fix: Resolve scanner crash on Android`
- `[All] refactor: Optimize carbon calculations`
- `[Backend] feat: Add product caching endpoint`

#### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Platforms Affected
- [ ] Web
- [ ] iOS
- [ ] Android
- [ ] Backend/API

## Testing Completed
- [ ] Unit tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Manual testing on affected platforms
- [ ] Smoke tests (if applicable)
- [ ] Regression tests (if major change)

## Screenshots/Videos
(If UI changes)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing

## Related Issues
Closes #123
```

---

## 🎯 Platform-Specific Guidelines

### Web Application

#### Local Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Test production build
npm run build && npx serve -s build
```

#### Testing Checklist
- [ ] Test on Chrome, Safari, Firefox
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test with slow network (throttle in DevTools)
- [ ] Check console for errors/warnings
- [ ] Verify all links work
- [ ] Test with browser back/forward
- [ ] Test authentication flows
- [ ] Test with ad blockers enabled

#### Deployment
- **Platform**: Vercel
- **Auto-deploy**: Pushes to `main` branch
- **Preview**: PRs get preview deployments
- **Environment**: Set in Vercel dashboard

### iOS Application

#### Local Development
```bash
cd ectracc-mobile

# Start development
npm start
# Press 'i' for iOS simulator

# Run on device
npm run ios
```

#### Testing Checklist
- [ ] Test on iPhone simulator (latest iOS)
- [ ] Test on older iPhone model (iOS 13+)
- [ ] Test on iPad
- [ ] Test dark mode
- [ ] Test offline mode
- [ ] Test camera permissions
- [ ] Test deep linking
- [ ] Check app performance (no lag)
- [ ] Verify memory usage is reasonable

#### Building & Deployment
```bash
# Development build
eas build --platform ios --profile development

# Preview build (for TestFlight)
eas build --platform ios --profile preview

# Production build
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --latest

# Or use GitHub Actions
# Actions → Build iOS App → Run workflow → Select profile
```

#### Version Management
- Update `version` in `ectracc-mobile/app.json`
- `buildNumber` auto-increments in production builds
- Follow semantic versioning: `1.0.0`, `1.0.1`, `1.1.0`, `2.0.0`

### Android Application

#### Local Development
```bash
cd ectracc-mobile

# Start development
npm start
# Press 'a' for Android emulator

# Run on device
npm run android
```

#### Testing Checklist
- [ ] Test on Pixel emulator (latest Android)
- [ ] Test on older Android version (API 28+)
- [ ] Test on tablet
- [ ] Test dark mode
- [ ] Test offline mode
- [ ] Test camera permissions
- [ ] Test deep linking
- [ ] Check app performance
- [ ] Verify APK/AAB size is reasonable

#### Building & Deployment
```bash
# Development build
eas build --platform android --profile development

# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --latest

# Or use GitHub Actions
# Actions → Build Android App → Run workflow → Select profile
```

#### Version Management
- Update `version` in `ectracc-mobile/app.json`
- `versionCode` auto-increments in production builds
- Keep version in sync with iOS version

### Shared Packages

#### Development
```bash
# Work in packages directory
cd packages/shared-core

# Run tests
npm test

# Type check
npx tsc --noEmit
```

#### Testing Requirements
⚠️ **CRITICAL**: Changes to shared packages affect ALL platforms!

Must test:
- [ ] Unit tests pass
- [ ] Type checking passes
- [ ] Web app works
- [ ] iOS app works
- [ ] Android app works
- [ ] No performance regressions

#### Publishing Changes
```bash
# After making changes
npm run test:shared

# Test in each platform
npm run dev           # Web
cd ectracc-mobile && npm start  # Mobile
```

---

## 🤖 CI/CD Integration

### GitHub Actions Workflows

#### 1. Mobile Tests Workflow
**Triggers**: Manual (currently disabled for auto-trigger)  
**File**: `.github/workflows/mobile-test.yml`

```bash
# Run manually
GitHub → Actions → Mobile Tests → Run workflow

# Or enable auto-trigger by uncommenting in workflow file
```

**What it does**:
- ✅ Runs shared package tests
- ✅ Runs mobile app tests
- ✅ Lints mobile code
- ✅ Type checks all TypeScript
- ✅ Uploads coverage reports

#### 2. Build iOS App Workflow
**Triggers**: Manual or tags  
**File**: `.github/workflows/mobile-build-ios.yml`

```bash
# Run manually
GitHub → Actions → Build iOS App → Run workflow
# Select profile: development | preview | production

# Or push tag for auto-build
git tag v1.0.1
git push origin v1.0.1
```

**What it does**:
- ✅ Runs all tests
- ✅ Builds iOS app via EAS
- ✅ Submits to TestFlight (if production on main)
- ✅ Uploads build logs

#### 3. Build Android App Workflow
**Triggers**: Manual or tags  
**File**: `.github/workflows/mobile-build-android.yml`

```bash
# Run manually
GitHub → Actions → Build Android App → Run workflow
# Select profile: development | preview | production

# Or push tag for auto-build
git tag v1.0.1
git push origin v1.0.1
```

**What it does**:
- ✅ Runs all tests
- ✅ Builds Android app via EAS
- ✅ Submits to Google Play (if production on main)
- ✅ Uploads build logs

### Enabling Auto-Triggers

To enable automatic workflow triggers on push/PR:

1. **Mobile Tests** (uncomment in `.github/workflows/mobile-test.yml`):
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

2. **Mobile Builds** (uncomment in build workflows):
```yaml
on:
  push:
    branches: [main]
    tags:
      - 'v*'
```

### Required Secrets

Set these in GitHub → Settings → Secrets:

| Secret | Description | Where to get |
|--------|-------------|--------------|
| `EXPO_TOKEN` | EAS authentication | https://expo.dev/accounts/[account]/settings/access-tokens |
| `API_BASE_URL` | Backend API URL | Your backend URL |
| `SUPABASE_URL` | Supabase project URL | Supabase dashboard |
| `SUPABASE_ANON_KEY` | Supabase anon key | Supabase dashboard → Settings → API |

### Continuous Testing Integration

```bash
# Run in CI/CD pipeline
cd automated-testing
npm install
npm run test:ci

# Or specific test types
npm run test:smoke       # Quick validation (30s)
npm run test:sanity      # Focused testing (2min)
npm run test:regression  # Comprehensive (5min)
```

---

## 🚀 Release Process

### Version Numbering

Follow Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Release Workflow

#### Step 1: Prepare Release

```bash
# 1. Ensure main is clean
git checkout main
git pull origin main

# 2. Run full test suite
npm run test:all
npm run test:coverage

# 3. Run automated testing
cd automated-testing
npm run test:regression

# 4. Manual testing on all platforms
- [ ] Web (Chrome, Safari, Firefox)
- [ ] iOS (simulator + device)
- [ ] Android (emulator + device)
```

#### Step 2: Update Versions

**For Mobile Apps** (Update `ectracc-mobile/app.json`):
```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

**For Web App** (Update `package.json`):
```json
{
  "version": "1.1.0"
}
```

#### Step 3: Create Release Commit

```bash
# Commit version updates
git add ectracc-mobile/app.json package.json
git commit -m "chore: bump version to 1.1.0"
git push origin main
```

#### Step 4: Tag Release

```bash
# Create and push tag
git tag -a v1.1.0 -m "Release version 1.1.0

New Features:
- Add dark mode support
- Improve barcode scanner accuracy
- Add product favorites

Bug Fixes:
- Fix dashboard crash on iOS
- Resolve Android permission issues

Breaking Changes:
- None"

git push origin v1.1.0
```

#### Step 5: Deploy Platforms

**Web** (Automatic):
```bash
# Vercel auto-deploys from main branch
# Monitor deployment at vercel.com
```

**iOS**:
```bash
# Option 1: GitHub Actions
# Actions → Build iOS App → Run workflow → Select "production"

# Option 2: Manual
cd ectracc-mobile
eas build --platform ios --profile production
eas submit --platform ios --latest
```

**Android**:
```bash
# Option 1: GitHub Actions
# Actions → Build Android App → Run workflow → Select "production"

# Option 2: Manual
cd ectracc-mobile
eas build --platform android --profile production
eas submit --platform android --latest
```

#### Step 6: Create GitHub Release

```bash
# On GitHub
1. Go to Releases
2. Click "Create new release"
3. Select tag: v1.1.0
4. Title: "Version 1.1.0"
5. Add release notes (features, fixes, breaking changes)
6. Attach build artifacts (optional)
7. Publish release
```

#### Step 7: Monitor & Rollout

**Week 1**:
- Monitor crash rates (target: < 1%)
- Watch error logs (Sentry if configured)
- Check app store reviews
- Monitor analytics (usage patterns)

**iOS TestFlight**:
- Release to internal testing first
- Then external testing (if configured)
- Finally submit for App Store review

**Android Internal Testing**:
- Release to internal track first
- Promote to alpha → beta → production
- Use phased rollout (10% → 25% → 50% → 100%)

### Hotfix Release Process

For critical bugs in production:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix the bug (minimal changes)
# Edit files...
git add .
git commit -m "fix: resolve critical login issue"

# 3. Test thoroughly
npm run test:all

# 4. Merge to main
git checkout main
git merge hotfix/critical-bug

# 5. Bump PATCH version (1.0.0 → 1.0.1)
# Update version in app.json and package.json

# 6. Tag and deploy
git tag -a v1.0.1 -m "Hotfix: Critical login issue"
git push origin main --tags

# 7. Build and deploy immediately
# Use GitHub Actions or EAS CLI
```

### Rollback Strategy

If a release has critical issues:

**Web**:
```bash
# Vercel rollback
vercel rollback [deployment-url]
# Or use Vercel dashboard
```

**Mobile**:
```bash
# iOS: Remove app from sale temporarily
# Android: Halt rollout, release previous version

# Then fix and release hotfix
```

---

## 📚 Quick Reference

### Daily Development Workflow

```bash
# Start your day
git checkout main
git pull origin main
git checkout -b feature/my-feature

# Make changes
# Edit files...

# Test changes
npm run test:all
npx tsc --noEmit

# Commit
git add .
git commit -m "feat(scope): description"

# Push
git push origin feature/my-feature
# Create PR on GitHub
```

### Before Merging PR

```bash
# Checklist
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Code reviewed
- [ ] Manual testing completed
- [ ] CI/CD checks pass
- [ ] Documentation updated
```

### Testing Quick Commands

```bash
# Unit tests
npm run test:all

# Type check
npx tsc --noEmit

# Lint
npm run lint --workspace=ectracc-mobile

# Smoke tests
cd automated-testing && npm run test:smoke

# Full test suite
cd automated-testing && npm run test:continuous
```

### Building for Production

```bash
# Web
npm run build

# iOS (via GitHub Actions)
# Actions → Build iOS App → production

# Android (via GitHub Actions)
# Actions → Build Android App → production

# Or manual via EAS
cd ectracc-mobile
eas build --platform all --profile production
```

### Common Issues & Solutions

#### Issue: Tests failing after dependency update
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
rm -rf ectracc-mobile/node_modules
npm install
```

#### Issue: TypeScript errors in shared packages
```bash
# Solution: Rebuild packages
cd packages/shared-core
npm run build
cd ../shared-services
npm run build
```

#### Issue: Mobile app not connecting to API
```bash
# Solution: Check environment variables
cd ectracc-mobile
# Verify .env file exists with:
# EXPO_PUBLIC_API_BASE_URL
# EXPO_PUBLIC_SUPABASE_URL
# EXPO_PUBLIC_SUPABASE_ANON_KEY
```

#### Issue: Build failing on GitHub Actions
```bash
# Solution: Check secrets are set
# GitHub → Settings → Secrets
# Required: EXPO_TOKEN, API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY
```

---

## 📊 Testing Coverage Goals

| Platform | Unit Tests | Integration | E2E | Manual |
|----------|:----------:|:-----------:|:---:|:------:|
| Web | ≥ 70% | ≥ 50% | ≥ 30% | 100% |
| iOS | ≥ 60% | ≥ 40% | ≥ 20% | 100% |
| Android | ≥ 60% | ≥ 40% | ≥ 20% | 100% |
| Shared | ≥ 80% | ≥ 60% | - | - |

---

## 🎯 Key Principles

1. **Test Before Commit**: All tests must pass
2. **Commit Atomically**: One logical change per commit
3. **Write Clear Messages**: Future you will thank you
4. **Review Before Merge**: Never merge without review
5. **Test on Real Devices**: Simulators aren't enough
6. **Monitor Production**: Watch for issues post-deploy
7. **Document Everything**: Update docs with code changes
8. **Communicate Changes**: Keep team informed

---

## 🔗 Related Documentation

- `AUTOMATED_TESTING_IMPLEMENTATION_REPORT.md` - Automated testing details
- `NEXT_STEPS_FOR_LAUNCH.md` - Launch preparation guide
- `ectracc-mobile/TESTING_GUIDE.md` - Mobile testing guide
- `ectracc-mobile/CI_CD_IMPLEMENTATION_COMPLETE.md` - CI/CD details
- `.github/workflows/README.md` - Workflow documentation

---

**Last Updated**: October 18, 2025  
**Maintained By**: Development Team  
**Version**: 1.0.0  

🚀 **Happy Coding!**

