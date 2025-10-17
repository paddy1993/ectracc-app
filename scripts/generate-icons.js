#!/usr/bin/env node

/**
 * ECTRACC Icon Generator
 * 
 * Generates all required icon sizes from SVG source files for:
 * - iOS App Store (1024x1024, 180x180, 167x167, 152x152, 120x120, 76x76)
 * - Google Play Store (512x512, 192x192, 144x144, 96x96, 72x72, 48x48)
 * - PWA/Web (512x512, 384x384, 192x192, 152x152, 144x144, 128x128, 96x96, 72x72)
 * - Favicons (32x32, 16x16)
 * - Store assets with proper padding
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const SVG_ICON = path.join(ROOT_DIR, 'public/logo/ectracc-icon.svg');
const ICONS_DIR = path.join(ROOT_DIR, 'public/icons');
const STORE_ASSETS_DIR = path.join(ROOT_DIR, 'store-assets');

// Icon sizes required
const ICON_SIZES = [
  // iOS App Store
  { size: 1024, name: 'icon-1024x1024.png', purpose: 'iOS App Store' },
  { size: 180, name: 'icon-180x180.png', purpose: 'iPhone @3x' },
  { size: 167, name: 'icon-167x167.png', purpose: 'iPad Pro @2x' },
  { size: 152, name: 'icon-152x152.png', purpose: 'iPad @2x' },
  { size: 120, name: 'icon-120x120.png', purpose: 'iPhone @2x' },
  { size: 76, name: 'icon-76x76.png', purpose: 'iPad @1x' },
  
  // Google Play Store & PWA
  { size: 512, name: 'icon-512x512.png', purpose: 'Play Store / PWA Large' },
  { size: 384, name: 'icon-384x384.png', purpose: 'PWA Medium' },
  { size: 192, name: 'icon-192x192.png', purpose: 'Play Store xxxhdpi / PWA' },
  { size: 144, name: 'icon-144x144.png', purpose: 'Play Store xxhdpi / Windows Tile' },
  { size: 128, name: 'icon-128x128.png', purpose: 'PWA Small' },
  { size: 96, name: 'icon-96x96.png', purpose: 'Play Store xhdpi / Shortcuts' },
  { size: 72, name: 'icon-72x72.png', purpose: 'Play Store hdpi' },
  { size: 48, name: 'icon-48x48.png', purpose: 'Play Store mdpi' },
  
  // Favicons
  { size: 32, name: 'icon-32x32.png', purpose: 'Favicon' },
  { size: 16, name: 'icon-16x16.png', purpose: 'Favicon Small' },
];

// Store-specific assets with padding
const STORE_ASSETS = [
  {
    size: 1024,
    name: 'app-store-icon-1024.png',
    purpose: 'iOS App Store Listing',
    padding: 0, // No padding, fill the space
    background: '#4CAF50', // Solid background, no transparency
  },
  {
    size: 512,
    name: 'play-store-icon-512.png',
    purpose: 'Google Play Store Listing',
    padding: 64, // 12.5% padding for safe zone
    background: 'transparent', // Keep transparency for Play Store
  },
];

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created directory: ${dirPath}`);
  }
}

/**
 * Generate a single icon
 */
async function generateIcon(svgPath, outputPath, size, background = 'transparent', padding = 0) {
  const effectiveSize = size - (padding * 2);
  
  try {
    let image = sharp(svgPath)
      .resize(effectiveSize, effectiveSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    
    // Add padding if needed
    if (padding > 0) {
      const bgColor = background === 'transparent' 
        ? { r: 0, g: 0, b: 0, alpha: 0 }
        : { r: 76, g: 175, b: 80, alpha: 1 }; // #4CAF50
      
      image = image.extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: bgColor
      });
    }
    
    // Apply background color if needed (for App Store)
    if (background !== 'transparent') {
      image = image.flatten({ background: { r: 76, g: 175, b: 80 } });
    }
    
    await image.png({ quality: 100, compressionLevel: 9 }).toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate ${outputPath}:`, error.message);
    return false;
  }
}

/**
 * Generate favicon.ico (multi-resolution)
 */
async function generateFavicon(svgPath, outputPath) {
  try {
    // Generate 32x32 PNG for favicon (browsers will scale as needed)
    await sharp(svgPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(outputPath);
    
    console.log(`✓ Generated favicon.ico (32x32 PNG)`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to generate favicon:`, error.message);
    return false;
  }
}

/**
 * Main generation function
 */
async function generateAllIcons() {
  console.log('🎨 ECTRACC Icon Generator\n');
  
  // Check if source SVG exists
  try {
    await fs.access(SVG_ICON);
    console.log(`✓ Found source SVG: ${SVG_ICON}\n`);
  } catch {
    console.error(`✗ Source SVG not found: ${SVG_ICON}`);
    process.exit(1);
  }
  
  // Ensure output directories exist
  await ensureDir(ICONS_DIR);
  await ensureDir(STORE_ASSETS_DIR);
  
  console.log('\n📱 Generating standard icons...\n');
  
  // Generate standard icons
  let successCount = 0;
  for (const { size, name, purpose } of ICON_SIZES) {
    const outputPath = path.join(ICONS_DIR, name);
    const success = await generateIcon(SVG_ICON, outputPath, size);
    
    if (success) {
      console.log(`✓ ${name.padEnd(25)} (${size}x${size}) - ${purpose}`);
      successCount++;
    }
  }
  
  console.log(`\n✓ Generated ${successCount}/${ICON_SIZES.length} standard icons\n`);
  
  // Generate store-specific assets
  console.log('🏪 Generating store-specific assets...\n');
  
  for (const { size, name, purpose, padding, background } of STORE_ASSETS) {
    const outputPath = path.join(STORE_ASSETS_DIR, name);
    const success = await generateIcon(SVG_ICON, outputPath, size, background, padding);
    
    if (success) {
      const paddingInfo = padding > 0 ? ` (${padding}px padding)` : '';
      console.log(`✓ ${name.padEnd(30)} (${size}x${size}${paddingInfo}) - ${purpose}`);
    }
  }
  
  // Generate favicon
  console.log('\n🌐 Generating favicon...\n');
  const faviconPath = path.join(ROOT_DIR, 'public/favicon.ico');
  await generateFavicon(SVG_ICON, faviconPath);
  
  console.log('\n✅ Icon generation complete!\n');
  console.log('Generated files:');
  console.log(`  - ${ICON_SIZES.length} icons in public/icons/`);
  console.log(`  - ${STORE_ASSETS.length} store assets in store-assets/`);
  console.log(`  - 1 favicon in public/`);
  console.log('\n📝 Next steps:');
  console.log('  1. Review generated icons in public/icons/');
  console.log('  2. Check store assets in store-assets/');
  console.log('  3. Test favicon in your browser');
  console.log('  4. Submit store icons to App Store and Play Store\n');
}

// Run the generator
if (require.main === module) {
  generateAllIcons().catch(error => {
    console.error('\n❌ Icon generation failed:', error);
    process.exit(1);
  });
}

module.exports = { generateAllIcons };

