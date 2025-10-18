# 🚀 Developer Quick Start Guide

Quick reference for daily development tasks across Web, iOS, and Android platforms.

---

## 🏃 Quick Start

### Setup New Feature
```bash
git checkout main && git pull
git checkout -b feature/my-feature
npm install
```

### Test Everything
```bash
npm run test:all          # Run all tests
npx tsc --noEmit          # Type check
npm run lint --workspace=ectracc-mobile  # Lint mobile
```

### Commit & Push
```bash
git add .
git commit -m "feat(scope): description"
git push origin feature/my-feature
# Then create PR on GitHub
```

---

## 🧪 Testing Cheat Sheet

### Quick Tests (Always Run)
```bash
npm run test:all          # < 1 min - Unit tests
npx tsc --noEmit          # < 30s - Type check
```

### Platform Testing
```bash
# Web
npm run dev               # Test at localhost:3000

# iOS
cd ectracc-mobile && npm start  # Press 'i'

# Android  
cd ectracc-mobile && npm start  # Press 'a'
```

### Automated Testing
```bash
cd automated-testing
npm run test:smoke        # 30s - Quick validation
npm run test:sanity       # 2min - Focused testing
npm run test:regression   # 5min - Before release
```

---

## 📝 Commit Message Guide

### Format
```
type(scope): description

Examples:
feat(web): add dark mode toggle
fix(mobile): resolve scanner crash
refactor(shared): optimize calculations
```

### Common Types
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `test` - Add tests
- `docs` - Documentation
- `chore` - Maintenance

### Common Scopes
- `web` - Web only
- `mobile` - iOS + Android
- `ios` - iOS only
- `android` - Android only
- `shared` - All platforms
- `backend` - API changes

---

## 🎯 Testing Matrix

| Your Change | What to Test |
|-------------|--------------|
| **Single component fix** | Unit tests → Manual test |
| **New feature** | Unit → Type → Lint → Smoke → Manual |
| **Shared package** | Unit → Type → Smoke → Test ALL platforms |
| **Backend/API** | Unit → Smoke → Regression → Test ALL platforms |
| **Before release** | EVERYTHING |

---

## 🏗️ Build Commands

### Web
```bash
npm run build             # Production build
npx serve -s build        # Test build locally
```

### Mobile (via GitHub Actions)
```bash
# Go to: GitHub → Actions → Select workflow
# iOS: Build iOS App → Run → Select profile
# Android: Build Android App → Run → Select profile
```

### Mobile (via EAS CLI)
```bash
cd ectracc-mobile

# Development
eas build --platform ios --profile development
eas build --platform android --profile development

# Production
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## 🐛 Troubleshooting

### Tests Failing After npm install
```bash
rm -rf node_modules package-lock.json
npm install
npm run test:all
```

### TypeScript Errors
```bash
cd packages/shared-core && npm run build
cd ../shared-services && npm run build
npx tsc --noEmit
```

### Mobile App Not Starting
```bash
cd ectracc-mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### API Connection Issues
```bash
# Check .env in ectracc-mobile/
EXPO_PUBLIC_API_BASE_URL=your-api-url
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

---

## 📱 Platform Impact Guide

| You're Editing | Affects |
|----------------|---------|
| `src/**` | Web only |
| `ectracc-mobile/**` | iOS + Android |
| `packages/**` | **ALL platforms** ⚠️ |
| `ectracc-backend/**` | **ALL platforms** ⚠️ |

**⚠️ Warning**: Changes to `packages/` or `ectracc-backend/` affect all platforms - test thoroughly!

---

## ✅ Pre-Merge Checklist

Before creating PR:
- [ ] `npm run test:all` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Manual testing completed
- [ ] No console errors
- [ ] No leftover debug code
- [ ] Commit messages follow format

Before merging to main:
- [ ] PR approved by reviewer
- [ ] CI/CD checks pass
- [ ] Documentation updated
- [ ] No merge conflicts

---

## 🚀 Release Checklist

### Update Versions
```bash
# ectracc-mobile/app.json
"version": "1.1.0"

# package.json  
"version": "1.1.0"
```

### Run Full Tests
```bash
npm run test:all
cd automated-testing && npm run test:regression
```

### Tag & Deploy
```bash
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0
# Builds trigger automatically via GitHub Actions
```

---

## 📞 Need Help?

- **Full workflow**: `DEVELOPMENT_WORKFLOW_PLAN.md`
- **Testing details**: `AUTOMATED_TESTING_IMPLEMENTATION_REPORT.md`
- **Mobile deployment**: `NEXT_STEPS_FOR_LAUNCH.md`
- **CI/CD setup**: `.github/workflows/README.md`

---

**Pro Tip**: Bookmark this page! You'll use it daily. 🔖

