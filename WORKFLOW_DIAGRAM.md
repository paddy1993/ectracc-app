# 📊 ECTRACC Development Workflow Diagrams

Visual representations of development, testing, and deployment workflows.

---

## 🔄 Complete Development Cycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FEATURE DEVELOPMENT                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. CREATE BRANCH                                                   │
│  git checkout -b feature/my-feature                                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. CODE CHANGES                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Web    │  │  Mobile  │  │  Shared  │  │  Backend │          │
│  │  src/    │  │ ectracc- │  │ packages/│  │ ectracc- │          │
│  │          │  │  mobile/ │  │          │  │ backend/ │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. LOCAL TESTING                                                   │
│  ┌─────────────────────┐ ┌─────────────────────┐                  │
│  │   Unit Tests        │ │   Type Checking     │                  │
│  │   npm run test:all  │ │   npx tsc --noEmit  │                  │
│  └─────────────────────┘ └─────────────────────┘                  │
│  ┌─────────────────────┐ ┌─────────────────────┐                  │
│  │   Linting           │ │   Manual Testing    │                  │
│  │   npm run lint      │ │   Browser/Simulator │                  │
│  └─────────────────────┘ └─────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. COMMIT                                                          │
│  git commit -m "type(scope): description"                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. PUSH & CREATE PR                                                │
│  git push origin feature/my-feature                                 │
│  → Create Pull Request on GitHub                                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. CI/CD CHECKS                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                  │
│  │ Unit Tests  │ │ Type Check  │ │  Linting    │                  │
│  │   GitHub    │ │   GitHub    │ │   GitHub    │                  │
│  │   Actions   │ │   Actions   │ │   Actions   │                  │
│  └─────────────┘ └─────────────┘ └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. CODE REVIEW                                                     │
│  Reviewer checks code, tests, documentation                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  8. MERGE TO MAIN                                                   │
│  PR approved → Merge to main branch                                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  9. AUTO-DEPLOY (Web)                                               │
│  Vercel automatically deploys web app                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Decision Tree

```
                        ┌─────────────────┐
                        │  Made Changes?  │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  What did you change?  │
                    └────────┬───────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ Single File  │  │ Feature  │  │ Shared/API   │
    │   Bug Fix    │  │   New    │  │   Changes    │
    └──────┬───────┘  └─────┬────┘  └──────┬───────┘
           │                │               │
           │                │               │
    ┌──────▼───────┐  ┌─────▼────┐  ┌──────▼───────┐
    │ Quick Tests  │  │ Standard │  │ Full Tests   │
    │              │  │  Tests   │  │              │
    │ • Unit tests │  │ • Unit   │  │ • Unit       │
    │ • Type check │  │ • Type   │  │ • Type       │
    │ • Manual     │  │ • Lint   │  │ • Lint       │
    │              │  │ • Smoke  │  │ • Smoke      │
    │              │  │ • Manual │  │ • Sanity     │
    │              │  │          │  │ • Regression │
    │              │  │          │  │ • Test ALL   │
    │              │  │          │  │   platforms  │
    └──────┬───────┘  └─────┬────┘  └──────┬───────┘
           │                │               │
           │                │               │
           └────────────────┼───────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  All Passed?  │
                    └───┬───────┬───┘
                        │       │
                   Yes  │       │  No
                        │       │
                        ▼       ▼
                    ┌─────┐  ┌─────────┐
                    │Commit│  │Fix Issues│
                    └─────┘  └────┬────┘
                                  │
                                  └──────┐
                                         │
                                         ▼
                                   ┌──────────┐
                                   │Test Again│
                                   └──────────┘
```

---

## 🚀 Release Process Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PREPARE RELEASE                              │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  1. RUN FULL TEST SUITE                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Unit Tests  │ │ Smoke Tests  │ │  Regression  │               │
│  │ npm run test │ │ 30 seconds   │ │  5 minutes   │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. MANUAL TESTING                                                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                      │
│  │    Web    │  │    iOS    │  │  Android  │                      │
│  │  Chrome   │  │ Simulator │  │ Emulator  │                      │
│  │  Safari   │  │  Device   │  │  Device   │                      │
│  │  Firefox  │  └───────────┘  └───────────┘                      │
│  └───────────┘                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. UPDATE VERSIONS                                                 │
│  ectracc-mobile/app.json: "version": "1.1.0"                        │
│  package.json: "version": "1.1.0"                                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. COMMIT & TAG                                                    │
│  git commit -m "chore: bump version to 1.1.0"                       │
│  git tag -a v1.1.0 -m "Release 1.1.0"                               │
│  git push origin main --tags                                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. DEPLOY                                                          │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                       WEB APP                            │       │
│  │  ┌──────────┐         ┌──────────┐       ┌──────────┐  │       │
│  │  │ Push to  │  ─────→ │  Vercel  │  ───→ │   LIVE   │  │       │
│  │  │   main   │         │  builds  │       │          │  │       │
│  │  └──────────┘         └──────────┘       └──────────┘  │       │
│  └─────────────────────────────────────────────────────────┘       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                      IOS APP                             │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │       │
│  │  │  GitHub  │→ │EAS Build │→ │TestFlight│→ │AppStore│  │       │
│  │  │ Actions  │  │          │  │          │  │        │  │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │       │
│  │                    2-3 hours    1-7 days     Live      │       │
│  └─────────────────────────────────────────────────────────┘       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                    ANDROID APP                           │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │       │
│  │  │  GitHub  │→ │EAS Build │→ │ Internal │→ │Play    │  │       │
│  │  │ Actions  │  │          │  │ Testing  │  │Store   │  │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │       │
│  │                    2-3 hours    1-2 days     Live      │       │
│  └─────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. MONITOR                                                         │
│  • Crash rates (< 1%)                                               │
│  • Error logs                                                       │
│  • User reviews                                                     │
│  • Analytics                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Platform Impact Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CHANGE IMPACT ANALYSIS                          │
└─────────────────────────────────────────────────────────────────────┘

File Location              │ Web │ iOS │ Android │ Test Requirements
───────────────────────────┼─────┼─────┼─────────┼──────────────────
src/**                     │  ✅ │     │         │ Unit → Manual
ectracc-mobile/**          │     │  ✅ │   ✅    │ Unit → Manual (both)
packages/shared-core/**    │  ✅ │  ✅ │   ✅    │ FULL (all platforms)
packages/shared-services/**│  ✅ │  ✅ │   ✅    │ FULL (all platforms)
packages/shared-types/**   │  ✅ │  ✅ │   ✅    │ Type check all
ectracc-backend/**         │  ✅ │  ✅ │   ✅    │ FULL + API tests

Legend:
✅ = Platform affected
FULL = Unit + Type + Lint + Smoke + Sanity + Regression + Manual (all)
```

---

## 🔀 Branch & PR Strategy

```
                        ┌──────────┐
                        │   main   │  ← Production
                        └────┬─────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │   feature/   │  │     fix/     │  │   hotfix/    │
    │  add-dark-   │  │   scanner-   │  │   critical-  │
    │     mode     │  │    crash     │  │      bug     │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                  │
           │                 │                  │
           ▼                 ▼                  ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Work here   │  │  Work here   │  │  Work here   │
    │  Multiple    │  │  Few commits │  │  Minimal     │
    │   commits    │  │              │  │  changes     │
    └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
           │                 │                  │
           └─────────┬───────┴──────────────────┘
                     │
                     ▼
              ┌─────────────┐
              │ Pull Request│
              └──────┬──────┘
                     │
                     ▼
            ┌────────────────┐
            │   CI/CD Tests  │
            │   Code Review  │
            └────────┬───────┘
                     │
                     ▼
            ┌────────────────┐
            │  Merge to main │
            └────────┬───────┘
                     │
                     ▼
              ┌─────────────┐
              │Auto-Deploy  │
              │    (Web)    │
              └─────────────┘
```

---

## 🏗️ Build & Deploy Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS WORKFLOWS                         │
└─────────────────────────────────────────────────────────────────────┘

TRIGGER: Push to main or PR
    │
    ├─→ Mobile Tests Workflow
    │   ├─→ Test Shared Packages (1 min)
    │   ├─→ Test Mobile App (1 min)
    │   ├─→ Lint Mobile Code (30s)
    │   └─→ Type Check (30s)
    │
    └─→ If tests pass → Continue


TRIGGER: Manual or Tag (v*)
    │
    ├─→ Build iOS App Workflow
    │   ├─→ Checkout code
    │   ├─→ Setup Node.js
    │   ├─→ Setup Expo/EAS
    │   ├─→ Install dependencies
    │   ├─→ Run tests (npm run test:all)
    │   ├─→ Build iOS (eas build --platform ios)
    │   │   └─→ Profile: development | preview | production
    │   └─→ Submit to TestFlight (if production + main)
    │
    └─→ Build Android App Workflow
        ├─→ Checkout code
        ├─→ Setup Node.js
        ├─→ Setup Expo/EAS
        ├─→ Install dependencies
        ├─→ Run tests (npm run test:all)
        ├─→ Build Android (eas build --platform android)
        │   └─→ Profile: development | preview | production
        └─→ Submit to Google Play (if production + main)


TRIGGER: Push to main (Auto)
    │
    └─→ Vercel Deployment
        ├─→ Build web app (npm run build)
        ├─→ Deploy to Vercel
        └─→ Generate preview URL → LIVE


Time Estimates:
├─ Tests: 2-3 minutes
├─ Web Deploy: 3-5 minutes
├─ iOS Build: 20-30 minutes
└─ Android Build: 15-25 minutes
```

---

## ⚡ Quick Decision Flowchart

```
START: I need to make a change
    │
    ▼
┌──────────────────────┐
│ What am I changing?  │
└──────┬───────────────┘
       │
       ├─→ Single bug fix → Quick tests → Commit → PR
       │
       ├─→ New feature → Full tests → Manual test → Commit → PR
       │
       ├─→ Shared code → FULL TESTS ALL PLATFORMS → PR
       │
       └─→ Emergency → Hotfix branch → Minimal fix → Fast track
           
    
All paths lead to:
    │
    ▼
┌──────────────────────┐
│ Create Pull Request │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐      ┌─────────────┐
│ CI checks pass?      │─No──→│ Fix issues  │
└──────┬───────────────┘      └──────┬──────┘
       │ Yes                         │
       │←────────────────────────────┘
       ▼
┌──────────────────────┐      ┌─────────────┐
│ Code reviewed?       │─No──→│ Wait/fix    │
└──────┬───────────────┘      └─────────────┘
       │ Yes
       ▼
┌──────────────────────┐
│ Merge to main        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Auto-deploy (web)    │
│ Manual build (mobile)│
└──────────────────────┘
```

---

## 🎯 Testing Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TEST PYRAMID                                │
└─────────────────────────────────────────────────────────────────────┘

                          ╱╲
                         ╱  ╲
                        ╱    ╲      E2E Tests
                       ╱  10% ╲     • Smoke (30s)
                      ╱────────╲    • Sanity (2min)
                     ╱          ╲   • Regression (5min)
                    ╱            ╲  Manual testing
                   ╱      30%     ╲ 
                  ╱────────────────╲ Integration Tests
                 ╱                  ╲ • API tests
                ╱                    ╲ • Service tests
               ╱                      ╲ • Database tests
              ╱          60%           ╲
             ╱──────────────────────────╲ Unit Tests
            ╱                            ╲ • Component tests
           ╱                              ╲ • Utility tests
          ╱________________________________╲ • Business logic tests

Run Frequency:
└─ Unit Tests: Every commit
└─ Integration: Before PR merge
└─ E2E: Before release
└─ Manual: Before release
```

---

## 📊 Version Management

```
Semantic Versioning: MAJOR.MINOR.PATCH

┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  v1.0.0  ─────→  v1.0.1  ─────→  v1.1.0  ─────→  v2.0.0           │
│    │               │               │                │               │
│    │               │               │                │               │
│  Initial        Bug fix      New feature     Breaking change        │
│  Release        (Patch)       (Minor)          (Major)              │
│                                                                     │
│  No changes    Backwards      Backwards        Not backwards       │
│  to API        compatible     compatible       compatible          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Examples:
├─ 1.0.0 → 1.0.1: Fixed scanner crash
├─ 1.0.1 → 1.1.0: Added dark mode
├─ 1.1.0 → 1.1.1: Fixed dark mode bug
└─ 1.1.1 → 2.0.0: New API breaking old clients
```

---

## 🎨 Git Workflow Visualization

```
main branch (production)
│
├─── commit ───┬─── commit ─── commit ─── commit ───► (continues)
│              │
│              └─── feature/add-feature
│                   │
│                   ├─── commit 1
│                   ├─── commit 2
│                   ├─── commit 3
│                   └─── merge back to main
│
├─── commit ───┬─── commit ─── commit ───► (continues)
│              │
│              └─── fix/bug-fix
│                   │
│                   ├─── commit 1
│                   └─── merge back to main
│
└─── v1.0.0 ─── v1.0.1 ─── v1.1.0 ─── v2.0.0 (tags)
```

---

**For detailed written instructions, see**:
- `DEVELOPMENT_WORKFLOW_PLAN.md` - Complete workflow guide
- `DEVELOPER_QUICK_START.md` - Quick reference cheat sheet

---

**Last Updated**: October 18, 2025  
**Version**: 1.0.0

