# GitHub Actions Workflows Status

## Current Status

The mobile CI/CD workflows have been temporarily disabled to prevent failed builds while the project is being set up.

### Disabled Workflows

1. **Mobile Tests** (`mobile-test.yml`) - Temporarily disabled
   - **Reason**: Need to install dependencies first
   - **Re-enable when**: After running `npm install` in the root directory

2. **Build iOS App** (`mobile-build-ios.yml`) - Manual trigger only
   - **Reason**: Requires Expo credentials (EXPO_TOKEN) in GitHub Secrets
   - **Re-enable when**: After setting up Expo account and adding secrets

3. **Build Android App** (`mobile-build-android.yml`) - Manual trigger only
   - **Reason**: Requires Expo credentials (EXPO_TOKEN) in GitHub Secrets
   - **Re-enable when**: After setting up Expo account and adding secrets

## How to Enable Workflows

### Step 1: Install Dependencies

```bash
cd /path/to/ectracc-fresh
npm install
```

This will install all dependencies for the monorepo, including:
- Mobile app dependencies
- Shared package dependencies  
- Testing libraries (Jest, React Native Testing Library)

### Step 2: Enable Mobile Tests

Once dependencies are installed locally and tests pass:

1. Edit `.github/workflows/mobile-test.yml`
2. Uncomment the `on:` section:

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

3. Commit and push

### Step 3: Configure Expo for Build Workflows

To enable automated builds:

1. Create an Expo account at https://expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Initialize: `cd ectracc-mobile && eas init`
5. Create auth token: `eas token:create`
6. Add to GitHub Secrets:
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add new secret: `EXPO_TOKEN` with the token from step 5
7. Add other required secrets:
   - `API_BASE_URL`: Your backend API URL
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

### Step 4: Enable Build Workflows

Once Expo is configured:

1. Edit `.github/workflows/mobile-build-ios.yml`
2. Uncomment the `on:` section:

```yaml
on:
  push:
    branches: [main]
  tags:
    - 'v*'
  workflow_dispatch:
```

3. Repeat for `mobile-build-android.yml`
4. Commit and push

## Testing Workflows Manually

All workflows can be triggered manually even when automatic triggers are disabled:

1. Go to GitHub repo → Actions tab
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select branch and options
5. Click "Run workflow"

## Troubleshooting

### Tests Fail with "Cannot find module"

**Solution**: Ensure all dependencies are installed:
```bash
npm install
cd ectracc-mobile && npm install
```

### Build Fails with "Expo token not found"

**Solution**: Add `EXPO_TOKEN` to GitHub Secrets (see Step 3 above)

### Type Errors in Tests

**Solution**: Build the TypeScript packages first:
```bash
npm run build --workspaces
```

## Documentation

For more detailed information, see:
- Testing Guide: `ectracc-mobile/TESTING_GUIDE.md`
- CI/CD Guide: `ectracc-mobile/CI_CD_IMPLEMENTATION_COMPLETE.md`
- Expo Setup: `ectracc-mobile/README.md`

## Contact

If you encounter issues with the workflows, check the documentation or consult the CI/CD implementation guide.

