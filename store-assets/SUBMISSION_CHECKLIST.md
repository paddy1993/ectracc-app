# ECTRACC App Store Submission Checklist

Quick reference checklist for submitting ECTRACC to app stores.

---

## 📱 iOS App Store Submission

### Icon Requirements ✅

- [x] **1024×1024 App Icon** - `store-assets/app-store-icon-1024.png`
  - Format: PNG (no transparency)
  - Color space: sRGB
  - File size: 26 KB
  - **Ready to upload**

### Pre-Submission Checklist

- [ ] App Store Connect account set up
- [ ] Bundle ID registered (e.g., com.ectracc.app)
- [ ] Certificates and provisioning profiles created
- [ ] App built and archived in Xcode
- [ ] TestFlight testing completed (optional but recommended)

### Required Assets

**App Icon** ✅
- [ ] Upload `store-assets/app-store-icon-1024.png` to App Store Connect

**Screenshots** (Create these separately)
- [ ] iPhone 6.7" (1290×2796) - At least 1 required
- [ ] iPhone 6.5" (1242×2688) - At least 1 required  
- [ ] iPad Pro 12.9" (2048×2732) - If supporting iPad
- [ ] iPad Pro 11" (1668×2388) - If supporting iPad

**App Preview Videos** (Optional)
- [ ] iPhone 6.7" (1080×1920, 30fps, H.264)
- [ ] iPad Pro 12.9" (1200×1600, 30fps, H.264)

### App Information

**Required Text**
- [ ] App name (max 30 characters): "ECTRACC"
- [ ] Subtitle (max 30 characters): "Carbon Footprint Tracker"
- [ ] Description (max 4000 characters) - Use `store-assets/app-store-copy.md`
- [ ] Keywords (max 100 characters): "carbon,footprint,tracking,sustainability,eco,environment,green,climate"
- [ ] Support URL: https://ectracc.com/support
- [ ] Marketing URL: https://ectracc.com

**Category Selection**
- Primary: Lifestyle
- Secondary: Health & Fitness

**Age Rating**
- Age rating: 4+ (no objectionable content)

**Privacy Policy**
- [ ] Privacy policy URL: https://ectracc.com/legal/privacy-policy

### Review Information

- [ ] Demo account credentials (if login required)
- [ ] Contact information for App Review team
- [ ] Notes for reviewer (explain key features)

---

## 🤖 Google Play Store Submission

### Icon Requirements ✅

- [x] **512×512 App Icon** - `store-assets/play-store-icon-512.png`
  - Format: 32-bit PNG (with alpha)
  - Safe zone: 64px padding
  - File size: 9 KB
  - **Ready to upload**

### Pre-Submission Checklist

- [ ] Google Play Console account set up ($25 one-time fee)
- [ ] App bundle or APK built and signed
- [ ] Internal testing completed (optional but recommended)
- [ ] Privacy policy hosted at public URL

### Required Assets

**App Icon** ✅
- [ ] Upload `store-assets/play-store-icon-512.png` to Play Console

**Feature Graphic** (Create separately)
- [ ] 1024×500 banner image
- [ ] JPG or 24-bit PNG
- [ ] Highlights key feature or app name

**Screenshots** (Create these separately)
- [ ] Phone: At least 2, up to 8 (16:9 or 9:16 aspect ratio)
  - Minimum: 320px
  - Maximum: 3840px
- [ ] 7" tablet: Optional, up to 8
- [ ] 10" tablet: Optional, up to 8

**Promo Video** (Optional)
- [ ] YouTube video URL
- [ ] 30 seconds to 2 minutes

### Store Listing

**Required Text**
- [ ] App name (max 50 characters): "ECTRACC - Carbon Footprint Tracker"
- [ ] Short description (max 80 characters): "Track your carbon footprint and make sustainable choices"
- [ ] Full description (max 4000 characters) - Write compelling copy
- [ ] Category: Lifestyle

**Contact Details**
- [ ] Email: support@ectracc.com
- [ ] Phone: (optional)
- [ ] Website: https://ectracc.com
- [ ] Privacy policy: https://ectracc.com/legal/privacy-policy

**Content Rating**
- [ ] Complete questionnaire (typically rated: Everyone)

**Target Audience**
- [ ] Target age: 18 and over (or appropriate age)

### Pricing & Distribution

- [ ] Free or Paid: Free
- [ ] Countries: Select all or specific countries
- [ ] Device categories: Phone, Tablet, Wear OS (if applicable)

### Release Management

**Release Types**
- [ ] Internal testing (optional) - Up to 100 testers
- [ ] Closed testing (optional) - Closed group
- [ ] Open testing (optional) - Public beta
- [ ] Production - Public release

**App Bundle**
- [ ] Upload signed AAB (Android App Bundle)
- [ ] Version code and version name set correctly
- [ ] All required permissions declared

---

## 🌐 Progressive Web App (PWA)

### Icon Requirements ✅

All icons already configured in `public/manifest.json`:

- [x] 512×512 - `public/icons/icon-512x512.png`
- [x] 384×384 - `public/icons/icon-384x384.png`
- [x] 192×192 - `public/icons/icon-192x192.png`
- [x] 152×152 - `public/icons/icon-152x152.png`
- [x] 144×144 - `public/icons/icon-144x144.png`
- [x] 128×128 - `public/icons/icon-128x128.png`
- [x] 96×96 - `public/icons/icon-96x96.png`
- [x] 72×72 - `public/icons/icon-72x72.png`

### PWA Deployment Checklist

- [x] Manifest.json configured with all icons
- [x] Service worker registered
- [x] HTTPS enabled on production domain
- [x] Favicon configured
- [x] Apple touch icons configured
- [ ] Deploy to production (Vercel/Render)
- [ ] Test installation on mobile devices
- [ ] Test offline functionality

### PWA Testing

- [ ] Test on Chrome (Android)
- [ ] Test on Safari (iOS)
- [ ] Test on Edge (Windows)
- [ ] Verify "Add to Home Screen" works
- [ ] Check icon displays correctly after installation
- [ ] Test offline mode and service worker

---

## 📋 General Submission Tips

### Before Submitting

1. **Test thoroughly**
   - All features work as expected
   - No crashes or critical bugs
   - Performance is acceptable
   - Handles edge cases gracefully

2. **Review guidelines**
   - [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
   - [Google Play Developer Policy Center](https://play.google.com/about/developer-content-policy/)

3. **Prepare for rejection**
   - Have a plan to address common issues
   - Respond quickly to reviewer feedback
   - Be ready to resubmit with fixes

### Common Rejection Reasons

**iOS**
- Incomplete information
- App crashes or has bugs
- Misleading app name or description
- Privacy policy issues
- Using copyrighted content

**Android**
- Inappropriate content
- Intellectual property violations
- Malware or deceptive behavior
- Privacy policy missing or inadequate
- Feature not working as described

### After Approval

1. **Monitor reviews**
   - Respond to user feedback
   - Address reported issues quickly
   - Update app regularly

2. **Analytics**
   - Track downloads and installs
   - Monitor user engagement
   - A/B test store listing elements

3. **Marketing**
   - Share on social media
   - Create press release
   - Reach out to tech bloggers

---

## 🆘 Support Resources

### Apple Resources
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/)

### Google Resources
- [Play Console Help Center](https://support.google.com/googleplay/android-developer/)
- [Material Design Guidelines](https://material.io/design)
- [Google Play Academy](https://playacademy.exceedlms.com/)

### ECTRACC Resources
- Icon Usage Guide: `store-assets/ICON_USAGE_GUIDE.md`
- Logo Files: `public/logo/`
- All Generated Icons: `public/icons/`
- Store Assets: `store-assets/`

---

## ✅ Final Pre-Launch Checklist

- [ ] Icons uploaded and displaying correctly
- [ ] Screenshots prepared and uploaded
- [ ] App description written and compelling
- [ ] Keywords optimized for search
- [ ] Privacy policy accessible
- [ ] Support email set up and monitored
- [ ] App tested on multiple devices
- [ ] No critical bugs or crashes
- [ ] Legal documents (terms, privacy) in place
- [ ] Marketing materials ready
- [ ] Launch announcement prepared

---

**Good luck with your submission!** 🚀

If you need to regenerate icons or update the logo:
```bash
npm run generate-icons
```

For questions, refer to `store-assets/ICON_USAGE_GUIDE.md`

