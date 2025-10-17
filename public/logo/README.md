# ECTRACC Logo Files

This directory contains the master logo files for ECTRACC.

## Files

### `ectracc-icon.svg`
Square icon-only logo for use in:
- App icons (iOS, Android, PWA)
- Favicons
- Social media profile images
- Small spaces where text would be illegible

**Dimensions**: 512×512 (scalable)
**Colors**: Green gradient (#4CAF50 to #388E3C) with blue accents (#2196F3)

### `ectracc-logo.svg`
Horizontal logo with icon and "ECTRACC" text for use in:
- App headers and navigation
- Marketing materials
- Email signatures
- Website headers
- Splash screens

**Dimensions**: 800×200 (scalable)
**Colors**: Same as icon, with dark green text (#2E7D32)

## Usage

These SVG files are the **source of truth** for all ECTRACC branding. All PNG exports are generated from these files.

### Generating PNG Icons

To regenerate all icon sizes from these SVG files:

```bash
npm run generate-icons
```

This will create:
- 16 standard icon sizes in `public/icons/` (16px to 1024px)
- 2 store-specific assets in `store-assets/` (App Store & Play Store)
- 1 favicon in `public/favicon.ico`

### Editing the Logo

1. Open the SVG file in a vector editor (Figma, Illustrator, Inkscape)
2. Make your changes while preserving:
   - The overall shape and concept (leaf + circuit)
   - Brand colors (#4CAF50, #388E3C, #2196F3)
   - Safe zone padding (10% minimum)
3. Save the SVG
4. Run `npm run generate-icons` to update all PNG files
5. Test the new icons across all platforms

## Design Concept

The ECTRACC logo represents:
- **Leaf shape**: Environmental awareness and sustainability
- **Circuit nodes**: Technology and digital tracking
- **Green color**: Eco-friendly focus
- **Blue accents**: Data, trust, and reliability
- **Modern geometry**: Clean, professional, accessible

## Guidelines

For complete usage guidelines, size requirements, and submission checklists, see:
- `store-assets/ICON_USAGE_GUIDE.md` - Comprehensive icon documentation
- `scripts/generate-icons.js` - Icon generation script

## Version

Current version: 1.0.0 (October 2025)

