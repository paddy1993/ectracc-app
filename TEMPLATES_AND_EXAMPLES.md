# 📝 Templates & Examples

Ready-to-use templates for commits, PRs, releases, and more.

---

## 🔖 Commit Message Templates

### Feature Commit
```bash
git commit -m "feat(scope): add feature description

- Detailed point about what was added
- Another detail
- Why this feature is needed

Affects: [Web|iOS|Android|All]"
```

**Example**:
```bash
git commit -m "feat(mobile): add barcode history filtering

- Users can now filter history by date range
- Added filter button in history screen header
- Implements persistent filter preferences
- Improves user experience for power users

Affects: iOS, Android
Closes #145"
```

### Bug Fix Commit
```bash
git commit -m "fix(scope): resolve issue description

- What was broken
- Root cause
- How it was fixed

Fixes #issue-number"
```

**Example**:
```bash
git commit -m "fix(web): resolve dashboard crash on empty data

- Dashboard crashed when user had no footprint entries
- Root cause: undefined check missing in TrendChart component
- Added null safety checks and empty state handling

Fixes #234"
```

### Refactoring Commit
```bash
git commit -m "refactor(scope): improve code description

- What was refactored
- Why refactoring was needed
- Benefits gained"
```

**Example**:
```bash
git commit -m "refactor(shared): extract carbon calculation logic

- Moved calculation functions to shared-core package
- Eliminates code duplication across web and mobile
- Improves maintainability and testability
- Reduces bundle size by 15KB

Affects: All platforms"
```

### Breaking Change Commit
```bash
git commit -m "feat(api)!: change endpoint behavior

BREAKING CHANGE: Detailed description of breaking change

Migration guide:
- Step 1
- Step 2

Affects: All platforms"
```

**Example**:
```bash
git commit -m "feat(api)!: update authentication flow

BREAKING CHANGE: Authentication endpoints now require
access token in Authorization header instead of query parameter

Migration guide:
- Web: Update src/services/api.ts, add Authorization header
- Mobile: Update AuthContext.tsx, change token passing method

Before: GET /api/user?token=xxx
After: GET /api/user (with header: Authorization: Bearer xxx)

Affects: All platforms
Closes #189"
```

---

## 📋 Pull Request Templates

### Feature PR Template
```markdown
## 🎯 Description
Brief description of the feature and why it's needed.

## 📱 Platforms Affected
- [ ] Web
- [ ] iOS
- [ ] Android

## 🎨 Type of Change
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Enhancement (improvement to existing functionality)

## 🧪 Testing Completed
- [ ] Unit tests added/updated
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes
- [ ] Manual testing on affected platforms
- [ ] Smoke tests pass (if applicable)

### Manual Test Results:
**Web**:
- [x] Chrome - ✅ Works
- [x] Safari - ✅ Works
- [x] Firefox - ✅ Works

**Mobile** (if applicable):
- [x] iOS Simulator - ✅ Works
- [x] iOS Device - ✅ Works
- [x] Android Emulator - ✅ Works
- [x] Android Device - ✅ Works

## 📸 Screenshots/Videos
<!-- Add screenshots or screen recordings here -->

### Before:
<!-- Screenshot before changes -->

### After:
<!-- Screenshot after changes -->

## 📝 Implementation Details
- Key technical decisions made
- Any performance considerations
- Security considerations

## 📚 Documentation
- [ ] Code comments added where needed
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)

## ✅ Pre-Merge Checklist
- [ ] Self-review completed
- [ ] No console.log() or debug code
- [ ] No commented-out code
- [ ] All tests passing
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] Branch is up to date with main

## 🔗 Related Issues
Closes #issue-number
Related to #other-issue

## 💡 Additional Notes
Any additional context, concerns, or discussion points.
```

### Bug Fix PR Template
```markdown
## 🐛 Bug Description
What was the bug? How did users experience it?

## 🔍 Root Cause
What caused the bug?

## 🔧 Fix Description
How was it fixed?

## 📱 Platforms Affected
- [ ] Web
- [ ] iOS
- [ ] Android

## 🎨 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] Critical hotfix (urgent production issue)

## 🧪 Testing Completed
- [ ] Unit tests added to prevent regression
- [ ] Manual testing on affected platforms
- [ ] Verified bug no longer occurs

### Reproduction Steps (Before Fix):
1. Step 1
2. Step 2
3. Bug occurs

### Verification (After Fix):
- [x] Cannot reproduce bug anymore
- [x] No new issues introduced
- [x] All existing tests still pass

## 📸 Before/After
<!-- Screenshots demonstrating the bug was fixed -->

## ✅ Pre-Merge Checklist
- [ ] Self-review completed
- [ ] Regression test added
- [ ] All tests passing
- [ ] Verified on all affected platforms

## 🔗 Related Issues
Fixes #issue-number

## ⚠️ Additional Notes
Any deployment notes or monitoring requirements.
```

### Shared Package PR Template
```markdown
## ⚠️ SHARED PACKAGE CHANGE

**WARNING**: This PR modifies shared packages and affects ALL platforms!

## 📝 Description
What changed in the shared package?

## 🎯 Reason for Change
Why was this change needed?

## 📱 Platforms Affected
- [x] Web
- [x] iOS  
- [x] Android

## 🎨 Type of Change
- [ ] Non-breaking change
- [ ] Breaking change (requires updates in consuming apps)

## 🧪 Comprehensive Testing Required
- [ ] Shared package unit tests pass
- [ ] Web app tested
- [ ] iOS app tested
- [ ] Android app tested
- [ ] Integration tests pass
- [ ] Smoke tests pass
- [ ] Sanity tests pass

### Test Results by Platform:

**Shared Packages**:
```bash
npm run test:shared
✅ All tests pass (XX/XX)
```

**Web**:
- [x] Builds successfully
- [x] All features work
- [x] No console errors
- [x] No performance regression

**iOS**:
- [x] Builds successfully
- [x] All features work
- [x] No crashes
- [x] No performance regression

**Android**:
- [x] Builds successfully
- [x] All features work
- [x] No crashes
- [x] No performance regression

## 💥 Breaking Changes (if applicable)
List any breaking changes and migration steps needed.

## 📚 Documentation
- [ ] Package README updated
- [ ] Type definitions updated
- [ ] Usage examples updated

## ✅ Extra Verification
- [ ] No circular dependencies introduced
- [ ] Bundle size impact acceptable
- [ ] Performance benchmarks acceptable

## 🔗 Related Issues
Related to #issue-number
```

---

## 🏷️ Release Note Templates

### Regular Release Template
```markdown
# Version 1.1.0

**Release Date**: October 18, 2025

## 🎉 What's New

### Features
- **Dark Mode Support**: Toggle between light and dark themes in settings
- **Product Favorites**: Save your frequently scanned products for quick access
- **Improved Scanner**: 2x faster barcode recognition and better camera handling

### Enhancements  
- Dashboard charts now load 40% faster
- Reduced app size by 2MB
- Improved offline mode reliability

### Bug Fixes
- Fixed crash when scanning unknown barcodes
- Resolved login issue on older Android devices
- Fixed dashboard not updating after manual entry

## 📱 Platforms

- **Web**: v1.1.0 (Live now)
- **iOS**: v1.1.0 (Build 12) - Available on App Store
- **Android**: v1.1.0 (Build 12) - Available on Google Play

## 🔧 Technical Updates

- Updated dependencies to latest stable versions
- Improved error handling and logging
- Enhanced security measures
- Performance optimizations across all platforms

## 📊 Stats

- 15 issues closed
- 23 PRs merged
- 95% test coverage maintained
- 0 known critical bugs

## 🙏 Credits

Thanks to all contributors who made this release possible!

## 🔗 Links

- [Full Changelog](https://github.com/yourusername/ectracc/compare/v1.0.0...v1.1.0)
- [Documentation](https://docs.ectracc.com)
- [Report Issues](https://github.com/yourusername/ectracc/issues)
```

### Hotfix Release Template
```markdown
# Version 1.0.1 (Hotfix)

**Release Date**: October 18, 2025  
**Type**: Critical Hotfix

## 🚨 Urgent Fix

This hotfix addresses a critical issue affecting user authentication.

### What Was Fixed
- **Critical**: Login not working for users with email addresses containing special characters
- **Impact**: Affected approximately 5% of users
- **Resolution**: Fixed email validation and sanitization

## 📱 Deployment

- **Web**: v1.0.1 (Deployed immediately)
- **iOS**: v1.0.1 (Build 11) - Expedited review requested
- **Android**: v1.0.1 (Build 11) - Staged rollout at 100%

## ⚡ Action Required

None - all users will receive the update automatically.

## 🔗 Details

- [Issue #234](https://github.com/yourusername/ectracc/issues/234)
- [Commit](https://github.com/yourusername/ectracc/commit/abc123)
```

---

## 📊 Testing Checklist Templates

### Pre-Commit Testing Checklist
```markdown
## ✅ Pre-Commit Checklist

Date: __________
Branch: __________
Developer: __________

### Code Quality
- [ ] Code follows project style guidelines
- [ ] No console.log() or debug statements
- [ ] No commented-out code
- [ ] Meaningful variable and function names
- [ ] Complex code has comments

### Testing
- [ ] `npm run test:all` - All tests pass
- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] `npm run lint` - No linting errors
- [ ] Manual testing completed

### Platform Testing (if applicable)
- [ ] Web: Tested in Chrome/Safari/Firefox
- [ ] iOS: Tested in simulator
- [ ] Android: Tested in emulator

### Documentation
- [ ] README updated (if needed)
- [ ] Code comments added
- [ ] Types/interfaces documented

### Git
- [ ] Commit message follows format
- [ ] All changes staged
- [ ] Branch up to date with main

**Notes**:
_____________________________
```

### Pre-Release Testing Checklist
```markdown
## ✅ Pre-Release Testing Checklist

Version: __________
Release Date: __________
Tester: __________

### Automated Tests
- [ ] Unit tests: `npm run test:all` (Result: __/__ passed)
- [ ] Type checking: `npx tsc --noEmit` (✅ Pass / ❌ Fail)
- [ ] Linting: `npm run lint` (✅ Pass / ❌ Fail)
- [ ] Smoke tests: `cd automated-testing && npm run test:smoke` (Result: __/__ passed)
- [ ] Sanity tests: `npm run test:sanity` (Result: __/__ passed)
- [ ] Regression tests: `npm run test:regression` (Result: __/__ passed)

### Web Application Testing

**Browsers**:
- [ ] Chrome (latest) - Tested on version: ____
- [ ] Safari (latest) - Tested on version: ____
- [ ] Firefox (latest) - Tested on version: ____
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

**Core Functionality**:
- [ ] User registration
- [ ] User login
- [ ] Password reset
- [ ] Profile updates
- [ ] Dashboard loads and displays data
- [ ] Barcode scanner (webcam)
- [ ] Manual product entry
- [ ] Product search
- [ ] Carbon footprint calculation
- [ ] History view and filtering
- [ ] Data export
- [ ] Logout

**Responsive Design**:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### iOS Application Testing

**Devices Tested**:
- [ ] iPhone 15 Pro (Simulator) - iOS 17.x
- [ ] iPhone 13 (Device) - iOS 16.x
- [ ] iPad (Simulator) - iOS 17.x

**Core Functionality**:
- [ ] App launches without crash
- [ ] User registration
- [ ] User login
- [ ] Push notifications (if implemented)
- [ ] Camera permissions
- [ ] Barcode scanner
- [ ] Product search
- [ ] Carbon footprint tracking
- [ ] History synchronization
- [ ] Offline mode
- [ ] Pull-to-refresh
- [ ] Deep linking
- [ ] Dark mode
- [ ] Logout

**Performance**:
- [ ] App launches in < 2 seconds
- [ ] No UI lag or stuttering
- [ ] No memory leaks (checked with Instruments)
- [ ] Battery usage acceptable

### Android Application Testing

**Devices Tested**:
- [ ] Pixel 7 (Emulator) - Android 13
- [ ] Older device (Emulator) - Android 10
- [ ] Tablet (Emulator)

**Core Functionality**:
- [ ] App launches without crash
- [ ] User registration
- [ ] User login
- [ ] Push notifications (if implemented)
- [ ] Camera permissions
- [ ] Barcode scanner
- [ ] Product search
- [ ] Carbon footprint tracking
- [ ] History synchronization
- [ ] Offline mode
- [ ] Pull-to-refresh
- [ ] Deep linking
- [ ] Dark mode
- [ ] Logout

**Performance**:
- [ ] App launches in < 2 seconds
- [ ] No UI lag or stuttering
- [ ] No memory leaks
- [ ] Battery usage acceptable
- [ ] APK/AAB size: ____ MB (target: < 50MB)

### Cross-Platform Testing

**Data Synchronization**:
- [ ] Data syncs between web and mobile
- [ ] Changes on web appear on mobile
- [ ] Changes on mobile appear on web
- [ ] No data conflicts or loss

### Security Testing
- [ ] Authentication tokens secure
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Input validation working

### Performance Testing
- [ ] Page load times acceptable (< 3s)
- [ ] API response times acceptable (< 1s)
- [ ] No memory leaks
- [ ] CPU usage acceptable
- [ ] Network usage reasonable

### Edge Cases
- [ ] Poor network connectivity
- [ ] No network connectivity
- [ ] Large datasets (100+ entries)
- [ ] Special characters in inputs
- [ ] Long text inputs
- [ ] Rapid button clicking
- [ ] App backgrounding/foregrounding
- [ ] Low battery mode
- [ ] Low storage space

### Issues Found
| Issue | Severity | Platform | Status |
|-------|----------|----------|--------|
| Description | High/Medium/Low | Web/iOS/Android | Open/Fixed |

### Sign-Off

- [ ] All critical issues resolved
- [ ] All tests passed
- [ ] Ready for production release

**Tester Signature**: _____________  
**Date**: _____________  
**Approved By**: _____________  
**Date**: _____________
```

---

## 🔧 Development Session Templates

### Daily Stand-up Template
```markdown
## Daily Stand-up

**Date**: October 18, 2025  
**Developer**: Your Name

### Yesterday
- Completed dark mode implementation for iOS
- Fixed barcode scanner crash on Android
- Reviewed 2 PRs

### Today
- Implement dark mode for Android
- Add unit tests for scanner component
- Deploy hotfix for login issue

### Blockers
- Waiting for design approval on new dashboard layout
- Need access to production logs for debugging
```

### Sprint Planning Template
```markdown
## Sprint Planning

**Sprint**: #15  
**Duration**: October 18 - November 1, 2025  
**Team**: Your Team Name

### Sprint Goal
Improve app performance and implement dark mode across all platforms

### Planned Work

#### High Priority
- [ ] Implement dark mode (Web, iOS, Android)
- [ ] Fix critical performance issues
- [ ] Deploy security updates

#### Medium Priority
- [ ] Add product favorites feature
- [ ] Improve scanner accuracy
- [ ] Update dashboard charts

#### Low Priority
- [ ] Refactor legacy code
- [ ] Update documentation
- [ ] Dependency updates

### Capacity
- 80 hours total
- 2 developers
- 2 weeks

### Risks
- Dark mode requires significant testing
- Performance fixes might need backend changes
```

---

## 🚀 Deployment Checklist Template

```markdown
## 🚀 Deployment Checklist

**Version**: _______  
**Date**: _______  
**Environment**: Production  
**Deployer**: _______

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Version numbers updated
- [ ] Release notes prepared
- [ ] Stakeholders notified
- [ ] Backup plan ready
- [ ] Rollback plan prepared

### Deployment Steps

#### Web Application
- [ ] Run production build: `npm run build`
- [ ] Verify build success
- [ ] Push to main branch
- [ ] Monitor Vercel deployment
- [ ] Verify deployment URL
- [ ] Smoke test production site

#### iOS Application
- [ ] Build: `eas build --platform ios --profile production`
- [ ] Download IPA
- [ ] Submit to TestFlight
- [ ] Internal testing
- [ ] Submit to App Store review
- [ ] Monitor review status

#### Android Application
- [ ] Build: `eas build --platform android --profile production`
- [ ] Download AAB
- [ ] Upload to Google Play Console
- [ ] Internal testing track
- [ ] Promote to production
- [ ] Staged rollout (10% → 50% → 100%)

### Post-Deployment
- [ ] Verify all platforms live
- [ ] Run smoke tests on production
- [ ] Monitor error logs
- [ ] Check analytics
- [ ] Monitor crash rates
- [ ] Check user feedback
- [ ] Update documentation
- [ ] Notify team of successful deployment

### Rollback (If Needed)
- [ ] Web: Revert to previous deployment in Vercel
- [ ] Mobile: Halt rollout, communicate with users
- [ ] Identify issues
- [ ] Prepare hotfix

### Monitoring (First 24 Hours)
- [ ] Hour 1: Check crash rate
- [ ] Hour 4: Check error logs
- [ ] Hour 8: Check user reports
- [ ] Hour 24: Full health check

**Notes**:
_____________________________

**Deployment Status**: ✅ Success / ❌ Rolled Back / ⚠️ Issues Found
```

---

## 📞 Support & Contact Templates

### Bug Report Template
```markdown
## 🐛 Bug Report

**Date**: _______  
**Reporter**: _______

### Description
Brief description of the bug

### Platform
- [ ] Web
- [ ] iOS
- [ ] Android

### Environment
- Browser/OS Version: _______
- App Version: _______
- Device: _______

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Screenshots/Videos
<!-- Attach here -->

### Console Errors
```
<!-- Paste any error messages -->
```

### Additional Context
Any other relevant information
```

### Feature Request Template
```markdown
## ✨ Feature Request

**Date**: _______  
**Requester**: _______

### Feature Description
Brief description of the feature

### Problem It Solves
What user problem does this address?

### Proposed Solution
How should it work?

### Platforms
- [ ] Web
- [ ] iOS
- [ ] Android
- [ ] All

### Alternative Solutions
Other ways to solve this problem

### Priority
- [ ] High - Blocking user workflows
- [ ] Medium - Nice to have
- [ ] Low - Future enhancement

### Additional Context
Any mockups, examples, or references
```

---

**Use these templates to maintain consistency across your development workflow!**

**Related Documents**:
- `DEVELOPMENT_WORKFLOW_PLAN.md` - Complete workflow guide
- `DEVELOPER_QUICK_START.md` - Quick reference
- `WORKFLOW_DIAGRAM.md` - Visual workflows

