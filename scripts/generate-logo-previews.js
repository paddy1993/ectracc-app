#!/usr/bin/env node

/**
 * Generate preview images for logo options
 */

const sharp = require('sharp');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const LOGO_DIR = path.join(ROOT_DIR, 'public/logo');
const OUTPUT_DIR = path.join(ROOT_DIR, 'logo-previews');

async function generatePreviews() {
  console.log('🎨 Generating logo preview images...\n');
  
  const fs = require('fs').promises;
  
  // Create output directory
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (e) {}
  
  // Generate previews for both options
  const options = ['option1', 'option2'];
  const sizes = [512, 256, 128, 64];
  
  for (const option of options) {
    console.log(`\n📱 Generating ${option} previews:`);
    const svgPath = path.join(LOGO_DIR, `ectracc-icon-${option}.svg`);
    
    for (const size of sizes) {
      const outputPath = path.join(OUTPUT_DIR, `${option}-${size}x${size}.png`);
      
      try {
        await sharp(svgPath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .png({ quality: 100 })
          .toFile(outputPath);
        
        console.log(`  ✓ Generated ${size}x${size} preview`);
      } catch (error) {
        console.error(`  ✗ Failed to generate ${size}x${size}:`, error.message);
      }
    }
  }
  
  console.log(`\n✅ Preview images saved to: ${OUTPUT_DIR}\n`);
  console.log('View the previews to decide which design you prefer!');
  console.log('\nOption 1: Simplified leaf with clear veins and data nodes');
  console.log('Option 2: Carbon footprint with plant growing from it\n');
}

generatePreviews().catch(console.error);

