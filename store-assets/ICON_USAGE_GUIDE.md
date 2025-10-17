# ECTRACC Icon Usage Guide

Complete guide for using ECTRACC logos and icons across all platforms.

## 📁 File Locations

### Master Logo Files (Source)
- `public/logo/ectracc-icon.svg` - Square icon-only logo (SVG)
- `public/logo/ectracc-logo.svg` - Horizontal logo with text (SVG)

### Generated Icons (PNG)
- `public/icons/` - All standard app icons (16x16 to 1024x1024)
- `public/favicon.ico` - Multi-resolution favicon for web browsers

### Store Submission Assets
- `store-assets/app-store-icon-1024.png` - iOS App Store listing (1024x1024)
- `store-assets/play-store-icon-512.png` - Google Play Store listing (512x512)

## 🎨 Design Specifications

### Logo Concept
The ECTRACC logo combines **eco-friendly** and **technology** themes:
- **Leaf shape** represents environmental awareness
- **Circuit nodes** and **connection lines** represent carbon tracking technology
- **Blue nodes** symbolize data and digital tracking
- **Green gradient** reinforces the eco-conscious mission

### Color Palette
- **Primary Green**: `#4CAF50` - Main brand color
- **Dark Green**: `#388E3C` - Gradient endpoint, text color
- **Tech Blue**: `#2196F3` - Circuit nodes, secondary accent
- **White**: `#FFFFFF` - High contrast, text on logo

### Safe Zones
- **Minimum padding**: 10% of icon size on all sides
- **Text clearance**: 20% horizontal padding around logo text
- **Don't crop** the circular badge or leaf elements

## 📱 Platform-Specific Requirements

### iOS App Store

#### Icon Sizes Required
| Size | File | Purpose |
|------|------|---------|
| 1024×1024 | `app-store-icon-1024.png` | App Store listing |
| 180×180 | `icon-180x180.png` | iPhone @3x |
| 167×167 | `icon-167x167.png` | iPad Pro @2x |
| 152×152 | `icon-152x152.png` | iPad @2x |
| 120×120 | `icon-120x120.png` | iPhone @2x |
| 76×76 | `icon-76x76.png` | iPad @1x |

#### Technical Requirements
- **Format**: PNG (24-bit or 32-bit)
- **Color Space**: sRGB or P3
- **Transparency**: Not allowed (alpha channel must be removed)
- **Background**: Must be opaque - use solid color or gradient
- **Layers**: Flattened, no transparency

#### Apple Guidelines
- No alpha/transparency in App Store icon
- Corner radius applied by iOS automatically
- No text that can't be read at small sizes
- No photos of actual Apple products

**✓ Our icons meet these requirements**: The `app-store-icon-1024.png` has been flattened with a green background.

### Google Play Store

#### Icon Sizes Required
| Size | File | Purpose |
|------|------|---------|
| 512×512 | `play-store-icon-512.png` | Play Store listing |
| 192×192 | `icon-192x192.png` | xxxhdpi launcher |
| 144×144 | `icon-144x144.png` | xxhdpi launcher |
| 96×96 | `icon-96x96.png` | xhdpi launcher |
| 72×72 | `icon-72x72.png` | hdpi launcher |
| 48×48 | `icon-48x48.png` | mdpi launcher |

#### Technical Requirements
- **Format**: 32-bit PNG with alpha channel
- **Transparency**: Allowed and recommended
- **Safe zone**: 12.5% padding (64px for 512px icon)
- **Shape**: Adaptive icon support (circular, rounded square, squircle)
- **Background**: Can be transparent or solid

#### Google Guidelines
- Use safe zone to ensure icon isn't clipped
- Test in circular, rounded square, and squircle shapes
- Icon should work with various backgrounds
- Consistent visual language across Android

**✓ Our icons meet these requirements**: The `play-store-icon-512.png` includes 64px padding and maintains transparency.

### Progressive Web App (PWA)

#### Icon Sizes Required
All icons are already configured in `public/manifest.json`:

| Size | File | Purpose |
|------|------|---------|
| 512×512 | `icon-512x512.png` | Splash screen, install prompt |
| 384×384 | `icon-384x384.png` | Large icon |
| 192×192 | `icon-192x192.png` | Standard icon, Android home screen |
| 152×152 | `icon-152x152.png` | iOS web clip |
| 144×144 | `icon-144x144.png` | Windows tile |
| 128×128 | `icon-128x128.png` | Small icon |
| 96×96 | `icon-96x96.png` | Shortcuts |
| 72×72 | `icon-72x72.png` | Legacy support |

#### Maskable Icons
PWA icons are marked as `"purpose": "maskable any"` in the manifest, meaning:
- They adapt to different device shapes
- Safe zone ensures critical content isn't cropped
- Works on any background color

### Web Favicons

#### Files Created
- `public/favicon.ico` - Standard favicon (32×32)
- `public/icons/icon-16x16.png` - Small favicon
- `public/icons/icon-32x32.png` - Standard favicon

These are already linked in `public/index.html`.

## 🔧 Regenerating Icons

If you need to update the logo or regenerate icons:

### Step 1: Edit Source SVG
Edit the master SVG files:
```bash
# Edit icon
open public/logo/ectracc-icon.svg

# Edit full logo
open public/logo/ectracc-logo.svg
```

### Step 2: Run Generator Script
```bash
npm run generate-icons
```

This will:
- Read `public/logo/ectracc-icon.svg`
- Generate all 16 PNG sizes in `public/icons/`
- Create store-specific assets in `store-assets/`
- Update `public/favicon.ico`

### Step 3: Verify Generated Files
Check the output:
- All icons should have transparent backgrounds (except App Store)
- Colors should match the brand palette
- No pixelation or artifacts
- Proper padding on store assets

## ✅ App Store Submission Checklist

### iOS App Store
- [ ] Use `store-assets/app-store-icon-1024.png` (1024×1024)
- [ ] Verify no transparency/alpha channel
- [ ] Test icon on light and dark backgrounds
- [ ] Ensure icon meets Apple's design guidelines
- [ ] Check icon displays correctly in App Store Connect
- [ ] Prepare other assets (screenshots, preview videos)

### Google Play Store
- [ ] Use `store-assets/play-store-icon-512.png` (512×512)
- [ ] Verify 64px safe zone padding
- [ ] Test icon in circular, rounded square, squircle masks
- [ ] Ensure transparency works on various backgrounds
- [ ] Upload to Google Play Console
- [ ] Preview in different device shapes
- [ ] Prepare feature graphic (1024×500)

## 🎯 Brand Guidelines

### Do's ✓
- Use the official SVG files as source
- Maintain aspect ratio when scaling
- Use approved color variations only
- Ensure adequate padding and spacing
- Test on light and dark backgrounds
- Use high-resolution PNGs for print

### Don'ts ✗
- Don't distort or stretch the logo
- Don't change colors outside the palette
- Don't add drop shadows or effects
- Don't rotate or skew the icon
- Don't place on low-contrast backgrounds
- Don't use low-resolution files

## 📐 Icon Sizes Reference

### Complete Size List
```
16×16    - Favicon (small)
32×32    - Favicon (standard)
48×48    - Play Store mdpi
72×72    - Play Store hdpi
76×76    - iPad @1x
96×96    - Play Store xhdpi, shortcuts
120×120  - iPhone @2x
128×128  - PWA small
144×144  - Play Store xxhdpi, Windows tile
152×152  - iPad @2x, iOS web clip
167×167  - iPad Pro @2x
180×180  - iPhone @3x
192×192  - Play Store xxxhdpi, PWA standard
384×384  - PWA medium
512×512  - Play Store listing, PWA large
1024×1024 - App Store listing
```

## 🔄 Version Control

**Current Version**: 1.0.0 (October 2025)

**Change Log**:
- v1.0.0 - Initial logo design with leaf + circuit concept
- All standard sizes generated for iOS, Android, and PWA
- Store-specific assets created with proper padding

## 📞 Questions?

For logo usage questions or custom size requests, refer to:
- `scripts/generate-icons.js` - Icon generation script
- `public/manifest.json` - PWA icon configuration
- This guide for platform requirements

---

**Generated**: October 2025  
**Logo Designer**: ECTRACC Team  
**Generator Script**: `scripts/generate-icons.js`

