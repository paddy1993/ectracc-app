# 🍎 iOS App Store Setup Guide

## 📋 **Prerequisites**

### **Apple Developer Account**
- [ ] Apple Developer Program membership ($99/year)
- [ ] App Store Connect access
- [ ] Certificates and provisioning profiles

### **Required Information**
- [ ] App name: "ECTRACC - Carbon Footprint Tracker"
- [ ] Bundle ID: `com.ectracc.app`
- [ ] SKU: `ectracc-ios-v1`
- [ ] Primary language: English (U.S.)

## 🏗️ **App Store Connect Setup**

### **Step 1: Create New App**
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to "My Apps" > "+" > "New App"
3. Fill in app information:
   - **Platforms**: iOS
   - **Name**: ECTRACC - Carbon Footprint Tracker
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.ectracc.app
   - **SKU**: ectracc-ios-v1

### **Step 2: App Information**
```
Category: Lifestyle
Secondary Category: Health & Fitness
Content Rights: No, it does not contain, show, or access third-party content
Age Rating: 4+ (Safe for all ages)
```

### **Step 3: Pricing and Availability**
```
Price: Free
Availability: All countries/regions
App Store Distribution: Available on the App Store
```

### **Step 4: App Privacy**
```
Data Collection:
- Contact Info: Email addresses (for beta signup only)
- Usage Data: Product scans (stored locally)
- Identifiers: None

Data Use:
- Analytics: Basic app usage (anonymous)
- App Functionality: Barcode scanning and tracking

Third-Party Partners: None
```

## 📱 **Build and Upload Process**

### **Using EAS Build (Recommended)**

1. **Install EAS CLI**
```bash
npm install -g @expo/eas-cli
```

2. **Login to Expo**
```bash
eas login
```

3. **Configure Project**
```bash
cd ectracc-mobile
eas build:configure
```

4. **Build for iOS**
```bash
# Development build
eas build --platform ios --profile development

# Production build for App Store
eas build --platform ios --profile production
```

5. **Submit to App Store**
```bash
eas submit --platform ios --profile production
```

### **Manual Build Process (Alternative)**

1. **Generate iOS Build**
```bash
cd ectracc-mobile
expo build:ios
```

2. **Download .ipa file** from Expo build page

3. **Upload via Transporter**
   - Download Apple Transporter
   - Upload .ipa file
   - Wait for processing

## 📝 **App Store Listing**

### **App Store Preview**
Copy the content from `../app-store-copy.md` for:
- App name and subtitle
- Description
- Keywords
- What's New section

### **Screenshots Required**
Upload screenshots in this order:
1. **Hero/Main Screen** - Barcode scanner interface
2. **Scan Results** - Product details with eco-score
3. **Dashboard** - Personal tracking charts
4. **Product Comparison** - Side-by-side ratings
5. **Goal Setting** - Sustainability targets

### **App Review Information**
```
First Name: [Your First Name]
Last Name: [Your Last Name]
Phone: [Your Phone Number]
Email: [Your Email]

Demo Account: Not required (app works without login)

Review Notes:
"ECTRACC is a carbon footprint tracking app that helps users make sustainable choices. The app scans product barcodes and displays environmental impact data. No user account is required - all data is stored locally on the device for privacy. Camera permission is requested for barcode scanning functionality."
```

## 🔒 **Privacy and Compliance**

### **Privacy Policy Requirements**
- [ ] Privacy policy hosted at: https://ectracc.com/privacy
- [ ] Data collection practices clearly stated
- [ ] User rights and data retention explained
- [ ] Contact information for privacy questions

### **App Tracking Transparency (iOS 14.5+)**
```xml
<!-- Info.plist -->
<key>NSUserTrackingUsageDescription</key>
<string>This app does not track users across other apps and websites.</string>
```

### **Camera Usage Description**
```xml
<key>NSCameraUsageDescription</key>
<string>ECTRACC needs camera access to scan product barcodes and calculate carbon footprints.</string>
```

## ✅ **Pre-Submission Checklist**

### **Technical Requirements**
- [ ] App builds and runs on physical iOS devices
- [ ] All features work as described
- [ ] No crashes or major bugs
- [ ] Proper handling of camera permissions
- [ ] Offline functionality works
- [ ] App follows iOS Human Interface Guidelines

### **Content Requirements**
- [ ] App metadata complete and accurate
- [ ] Screenshots showcase key features
- [ ] App description is clear and compelling
- [ ] Keywords optimized for discovery
- [ ] Privacy policy accessible and compliant

### **Legal Requirements**
- [ ] Terms of Service available
- [ ] Privacy Policy compliant with regulations
- [ ] Content appropriate for 4+ rating
- [ ] No trademark violations

## 🚀 **Submission Process**

### **Step 1: Upload Build**
1. Upload .ipa file via EAS Submit or Transporter
2. Wait for processing (can take 1-2 hours)
3. Select build in App Store Connect

### **Step 2: Complete Metadata**
1. Add app description and keywords
2. Upload screenshots and app icon
3. Set pricing and availability
4. Complete privacy information

### **Step 3: Submit for Review**
1. Click "Submit for Review"
2. Answer export compliance questions
3. Add review notes if needed
4. Submit and wait

### **Review Timeline**
- **Typical**: 24-48 hours
- **Holiday seasons**: Up to 7 days
- **First submission**: May take longer

## 📊 **Post-Launch**

### **App Store Optimization (ASO)**
- Monitor keyword rankings
- A/B test screenshots and descriptions
- Respond to user reviews
- Track download and conversion metrics

### **Analytics Setup**
- App Store Connect analytics
- Crash reporting (if implemented)
- User acquisition tracking

### **Updates**
- Regular feature updates
- Bug fixes based on user feedback
- iOS version compatibility updates

## 🆘 **Common Issues**

### **Rejection Reasons**
1. **Metadata Rejection**: Incorrect or misleading information
2. **Binary Rejection**: App crashes or doesn't work as described
3. **Design Rejection**: Poor user experience or interface issues
4. **Legal Rejection**: Privacy policy or content issues

### **Solutions**
- Test thoroughly on physical devices
- Follow Apple's review guidelines exactly
- Provide clear, accurate descriptions
- Respond promptly to reviewer feedback

## 📞 **Support Resources**

- **Apple Developer Support**: https://developer.apple.com/support/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **App Store Connect Help**: https://help.apple.com/app-store-connect/

**Ready for iOS App Store submission once the mobile app development is complete!** 🍎
