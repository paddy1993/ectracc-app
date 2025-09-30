# 🤖 Google Play Store Setup Guide

## 📋 **Prerequisites**

### **Google Play Console Account**
- [ ] Google Play Console developer account ($25 one-time fee)
- [ ] Google Play Console access
- [ ] App signing key and certificates

### **Required Information**
- [ ] App name: "ECTRACC - Carbon Footprint Tracker"
- [ ] Package name: `com.ectracc.app`
- [ ] Default language: English (United States)

## 🏗️ **Google Play Console Setup**

### **Step 1: Create New App**
1. Log into [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - **App name**: ECTRACC - Carbon Footprint Tracker
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Accept Play policies

### **Step 2: App Details**
```
Category: Lifestyle
Tags: carbon footprint, sustainability, eco-friendly, barcode scanner
Contact details: support@ectracc.com
Privacy Policy: https://ectracc.com/privacy
```

### **Step 3: Store Listing**
```
Short description: Scan barcodes, track your carbon footprint, and make sustainable choices with real product data.

Full description: [Use content from ../app-store-copy.md]

App icon: 512x512px PNG (high-res)
Feature graphic: 1024x500px JPG/PNG
Screenshots: 2-8 per device type
```

### **Step 4: Content Rating**
```
Category: Tools or Productivity
Target age group: General audience
Content descriptors: None
Interactive elements: None
Rating: Everyone
```

## 📱 **Build and Upload Process**

### **Using EAS Build (Recommended)**

1. **Build for Android**
```bash
cd ectracc-mobile

# Development build (APK)
eas build --platform android --profile preview

# Production build (AAB)
eas build --platform android --profile production
```

2. **Submit to Google Play**
```bash
eas submit --platform android --profile production
```

### **Manual Build Process (Alternative)**

1. **Generate Android Build**
```bash
cd ectracc-mobile
expo build:android --type app-bundle
```

2. **Download .aab file** from Expo build page

3. **Upload to Google Play Console**
   - Go to "Release" > "Production"
   - Create new release
   - Upload .aab file

## 📝 **Store Listing Details**

### **App Information**
```
App name: ECTRACC - Carbon Footprint Tracker
Short description: (80 characters max)
"Scan barcodes, track carbon footprint, make sustainable choices with real data."

Full description: (4000 characters max)
[Copy from ../app-store-copy.md - Google Play version]
```

### **Graphics Assets**

#### **Required:**
- **App icon**: 512x512px PNG
- **Feature graphic**: 1024x500px JPG/PNG  
- **Screenshots**: At least 2, up to 8 per device type

#### **Optional:**
- **Promo video**: 30 seconds max, YouTube URL
- **TV banner**: 1280x720px JPG/PNG (for Android TV)

### **Screenshots Required**
Upload in this order:
1. **Hero Screen** - Main barcode scanner interface
2. **Scan Results** - Product details with eco-score  
3. **Dashboard** - Personal tracking and charts
4. **Product List** - Search results with ratings
5. **Goal Setting** - Sustainability targets

## 🔒 **Privacy and Data Safety**

### **Data Safety Section**
```
Data Collection:
✓ Does your app collect or share any of the required user data types?
- Personal info: Email addresses (optional, for beta signup)
- App activity: In-app actions (barcode scans, locally stored)

Data Sharing:
✗ Does your app share user data with third parties?

Data Security:
✓ Is all user data encrypted in transit?
✓ Do you provide a way for users to request data deletion?
✗ Have you committed to follow the Play Families Policy?

Data Types:
- Personal info: Email addresses
  - Collected: Yes (optional)
  - Shared: No
  - Ephemeral: No
  - Required: No
  - Purpose: Account management

- App activity: In-app actions
  - Collected: Yes
  - Shared: No  
  - Ephemeral: No
  - Required: Yes
  - Purpose: App functionality
```

### **Permissions**
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## ✅ **Pre-Submission Checklist**

### **Technical Requirements**
- [ ] App builds and runs on Android devices
- [ ] APK/AAB size under 150MB
- [ ] Target SDK version 33+ (Android 13)
- [ ] 64-bit architecture support
- [ ] No crashes or ANRs (Application Not Responding)
- [ ] Proper permission handling

### **Content Requirements**
- [ ] Store listing complete with all required fields
- [ ] Screenshots showcase key features
- [ ] App description accurate and compelling
- [ ] Content rating appropriate
- [ ] Privacy policy accessible

### **Policy Compliance**
- [ ] Google Play Developer Policy compliant
- [ ] No restricted content or functionality
- [ ] Proper data handling and privacy
- [ ] Target audience appropriate

## 🚀 **Release Process**

### **Step 1: Upload App Bundle**
1. Go to "Release" > "Production"
2. Click "Create new release"
3. Upload .aab file (Android App Bundle)
4. Add release notes

### **Step 2: Complete Store Listing**
1. Add app description and screenshots
2. Set content rating and category
3. Complete data safety section
4. Add contact information

### **Step 3: Review and Publish**
1. Review all information
2. Click "Review release"
3. Submit for review
4. Wait for approval (usually 1-3 days)

### **Release Timeline**
- **Review time**: 1-3 days typically
- **Policy violations**: May require fixes and resubmission
- **Updates**: Usually faster approval

## 📊 **Release Tracks**

### **Internal Testing**
- Up to 100 testers
- Immediate availability
- Perfect for team testing

### **Closed Testing (Alpha/Beta)**
- Up to 20,000 testers
- Email list or Google Groups
- Good for beta testing

### **Open Testing**
- Unlimited testers
- Public opt-in
- Great for public beta

### **Production**
- Public release
- Available to all users
- Full store listing

## 📈 **Post-Launch**

### **Google Play Console Analytics**
- Download and install metrics
- User ratings and reviews
- Crash reports and ANRs
- Performance metrics

### **App Store Optimization (ASO)**
- Monitor keyword performance
- A/B test store listing elements
- Respond to user reviews
- Track conversion rates

### **Updates and Maintenance**
- Regular feature updates
- Security patches
- Android version compatibility
- Performance improvements

## 🆘 **Common Issues**

### **Rejection Reasons**
1. **Policy Violations**: Content, privacy, or functionality issues
2. **Technical Issues**: Crashes, poor performance, or broken features
3. **Metadata Issues**: Misleading descriptions or inappropriate content
4. **Privacy Issues**: Incorrect data safety declarations

### **Solutions**
- Test thoroughly on multiple devices
- Follow Google Play policies exactly
- Provide accurate store listing information
- Implement proper error handling
- Use Google Play Console pre-launch reports

## 🛠️ **Development Best Practices**

### **App Bundle Optimization**
- Use Android App Bundle (AAB) format
- Enable Play Asset Delivery for large assets
- Optimize APK size with ProGuard/R8
- Test on various screen sizes and densities

### **Performance**
- Target 60fps for smooth animations
- Minimize app startup time
- Optimize memory usage
- Handle network connectivity changes

### **Security**
- Use HTTPS for all network requests
- Validate all user inputs
- Store sensitive data securely
- Implement certificate pinning if needed

## 📞 **Support Resources**

- **Google Play Console Help**: https://support.google.com/googleplay/android-developer/
- **Developer Policy Center**: https://play.google.com/about/developer-content-policy/
- **Android Developers**: https://developer.android.com/
- **Material Design Guidelines**: https://material.io/design

## 🔧 **Testing Tools**

### **Pre-Launch Report**
- Automatic testing on real devices
- Crash detection and performance issues
- Accessibility and security analysis
- Available in Google Play Console

### **Firebase Test Lab**
- Test on real and virtual devices
- Automated and manual testing
- Performance and stability metrics
- Integration with CI/CD pipelines

**Ready for Google Play Store submission once the mobile app development is complete!** 🤖
