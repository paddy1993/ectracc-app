# 🤖 GitHub Actions Workflows

Automated CI/CD workflows for ECTRACC application.

---

## 📋 Available Workflows

### 1. Mobile Tests (`mobile-test.yml`)

**Purpose**: Run automated tests on mobile app and shared packages  
**Trigger**: Manual (workflow_dispatch) - Currently disabled for auto-trigger  
**Duration**: ~3 minutes

#### Jobs
1. **test-shared-packages**: Tests shared-core and shared-services packages
2. **test-mobile**: Tests mobile app
3. **lint-mobile**: Lints mobile code
4. **type-check**: TypeScript type checking

#### How to Run
```bash
# Via GitHub UI
GitHub → Actions → Mobile Tests → Run workflow

# Or enable auto-trigger by uncommenting in workflow file
```

#### Enable Auto-Trigger
Uncomment lines 4-12 in `mobile-test.yml`:
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
    paths:
      - 'ectracc-mobile/**'
      - 'packages/**'
      - '.github/workflows/mobile-test.yml'
```

---

### 2. Build iOS App (`mobile-build-ios.yml`)

**Purpose**: Build iOS application using EAS Build  
**Trigger**: Manual or git tags (v*)  
**Duration**: ~25-30 minutes

#### Jobs
1. **build**: Builds iOS app
   - Runs tests
   - Builds with EAS
   - Uploads logs
   
2. **submit**: Submits to TestFlight (only if production + main branch)

#### Build Profiles
- **development**: Development build with dev client
- **preview**: Internal testing build (simulator compatible)
- **production**: Production build for App Store

#### How to Run
```bash
# Via GitHub UI
GitHub → Actions → Build iOS App → Run workflow
# Select profile: development | preview | production

# Via git tag (auto-trigger)
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin v1.0.1
```

#### Enable Auto-Trigger
Uncomment lines 4-8 in `mobile-build-ios.yml`:
```yaml
on:
  push:
    branches: [main]
    tags:
      - 'v*'
```

---

### 3. Build Android App (`mobile-build-android.yml`)

**Purpose**: Build Android application using EAS Build  
**Trigger**: Manual or git tags (v*)  
**Duration**: ~20-25 minutes

#### Jobs
1. **build**: Builds Android app
   - Runs tests
   - Builds with EAS
   - Uploads logs
   
2. **submit**: Submits to Google Play (only if production + main branch)

#### Build Profiles
- **development**: Development build with dev client
- **preview**: Internal testing build (APK)
- **production**: Production build for Play Store (AAB)

#### How to Run
```bash
# Via GitHub UI
GitHub → Actions → Build Android App → Run workflow
# Select profile: development | preview | production

# Via git tag (auto-trigger)
git tag -a v1.0.1 -m "Release 1.0.1"
git push origin v1.0.1
```

#### Enable Auto-Trigger
Uncomment lines 4-8 in `mobile-build-android.yml`:
```yaml
on:
  push:
    branches: [main]
    tags:
      - 'v*'
```

---

## 🔐 Required Secrets

Set these in: **GitHub → Settings → Secrets and variables → Actions**

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `EXPO_TOKEN` | EAS/Expo authentication token | [Expo Dashboard](https://expo.dev/accounts/[account]/settings/access-tokens) |
| `API_BASE_URL` | Backend API URL | Your backend deployment URL |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Project Settings → API |

### How to Get EXPO_TOKEN

1. Go to https://expo.dev
2. Log in to your account
3. Navigate to Account Settings → Access Tokens
4. Click "Create Token"
5. Name: "GitHub Actions"
6. Copy the token (save it - you won't see it again!)
7. Add to GitHub Secrets as `EXPO_TOKEN`

---

## 📊 Workflow Status

Check workflow status:
- **GitHub UI**: Repository → Actions tab
- **Badge**: Add to README.md:
  ```markdown
  ![Mobile Tests](https://github.com/yourusername/ectracc/actions/workflows/mobile-test.yml/badge.svg)
  ![iOS Build](https://github.com/yourusername/ectracc/actions/workflows/mobile-build-ios.yml/badge.svg)
  ![Android Build](https://github.com/yourusername/ectracc/actions/workflows/mobile-build-android.yml/badge.svg)
  ```

---

## 🔄 Typical Workflow Usage

### During Development
```bash
# Run tests before committing
GitHub → Actions → Mobile Tests → Run workflow
# Wait for results (~3 min)
# If tests pass, commit and push
```

### For Testing Builds
```bash
# Build preview version
GitHub → Actions → Build iOS App → Run workflow → Select "preview"
GitHub → Actions → Build Android App → Run workflow → Select "preview"

# Download builds from EAS
# Test on devices
```

### For Production Release
```bash
# 1. Update version in app.json
# 2. Commit and push to main
# 3. Create and push tag
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0

# 4. Builds automatically trigger (if auto-trigger enabled)
# OR manually trigger:
GitHub → Actions → Build iOS App → Run workflow → Select "production"
GitHub → Actions → Build Android App → Run workflow → Select "production"

# 5. Apps automatically submit to stores (if on main branch)
```

---

## 🚨 Troubleshooting

### Workflow Fails: "Expo token not found"
**Solution**: Add `EXPO_TOKEN` to GitHub Secrets
```bash
GitHub → Settings → Secrets → New repository secret
Name: EXPO_TOKEN
Value: [your-expo-token]
```

### Workflow Fails: Tests Timeout
**Solution**: Tests might be failing. Run locally:
```bash
npm run test:all
```

### Build Fails: "Module not found"
**Solution**: Dependencies might be out of sync
```bash
# Ensure package-lock.json is committed
# In workflow, `npm ci` is used (not `npm install`)
```

### Submit Fails: "Invalid credentials"
**Solution**: Check EAS credentials:
```bash
cd ectracc-mobile
eas credentials
# Verify Apple/Google credentials are configured
```

### Workflow Not Triggering Automatically
**Solution**: Check workflow file has correct triggers uncommented
```yaml
# Should have:
on:
  push:
    branches: [main]
```

---

## 📈 Optimization Tips

### Cache Dependencies
Already implemented in workflows:
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Parallel Jobs
Test jobs run in parallel for faster execution:
- test-shared-packages (parallel)
- test-mobile (parallel)
- lint-mobile (parallel)
- type-check (parallel)

### Skip CI for Docs
Add to commit message to skip CI:
```bash
git commit -m "docs: update README [skip ci]"
```

---

## 🔗 Related Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ECTRACC Development Workflow](../../DEVELOPMENT_WORKFLOW_PLAN.md)

---

## 📝 Workflow Maintenance

### Update Node Version
Change in all workflow files:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '18'  # Update this
```

### Update Actions Versions
Periodically update action versions:
```yaml
- uses: actions/checkout@v4      # Check for v5
- uses: actions/setup-node@v4    # Check for updates
- uses: expo/expo-github-action@v8  # Check for v9
```

### Add New Workflow
1. Create `.github/workflows/new-workflow.yml`
2. Define triggers, jobs, steps
3. Test with manual trigger first
4. Enable auto-trigger when stable

---

## 🎯 Best Practices

1. **Always test locally first**: Run `npm run test:all` before pushing
2. **Use manual trigger initially**: Test workflow before enabling auto-trigger
3. **Monitor workflow runs**: Check Actions tab regularly
4. **Keep secrets secure**: Never log or expose secrets
5. **Use build profiles**: development → preview → production
6. **Review logs**: Even if workflow succeeds, check logs for warnings
7. **Keep workflows updated**: Update dependencies and actions regularly

---

**Last Updated**: October 18, 2025  
**Maintained By**: Development Team
