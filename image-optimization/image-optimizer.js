/**
 * Image Optimizer for UnleashAI Website
 * 
 * This script optimizes images in the dist/assets/img/photos directory
 * Creating versions with different widths and WebP format
 * 
 * Usage: node image-optimizer.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

// Configuration
const config = {
  sourceDir: '../dist/assets/img/photos/',
  targetDir: '../dist/assets/img/photos/optimized/',
  sizes: [800, 1200, 1600, 2400, 3200], // Added higher resolution sizes
  quality: 85,  // Increased quality slightly
  formats: ['webp'], // Default to WebP only for better performance/size
  generateJpg: false, // Set to true if you need JPG fallbacks
  sourceFormats: ['jpg', 'jpeg', 'png'] // Source formats to process
};

// Ensure target directory exists
if (!fs.existsSync(config.targetDir)) {
  fs.mkdirSync(config.targetDir, { recursive: true });
}

// Process all images in source directory
async function processImages() {
  // Create a pattern to match all specified source formats
  const pattern = config.sourceFormats.map(format => path.join(config.sourceDir, `*.${format}`));
  const files = [];
  
  // Gather all files matching the patterns
  pattern.forEach(pat => {
    files.push(...glob.sync(pat));
  });
  
  console.log(`Found ${files.length} images to process`);
  
  for (const file of files) {
    const filename = path.basename(file, path.extname(file));
    const sourceFormat = path.extname(file).substring(1).toLowerCase();
    console.log(`Processing ${filename}.${sourceFormat}...`);
    
    // Load the image
    const image = sharp(file);
    const metadata = await image.metadata();
    
    // Only generate smaller sizes
    const sizes = config.sizes.filter(size => size < metadata.width);
    
    // Determine output formats
    const outputFormats = [...config.formats];
    if (config.generateJpg && !outputFormats.includes('jpg')) {
      outputFormats.push('jpg');
    }
    
    // Process each size and format
    for (const size of sizes) {
      for (const format of outputFormats) {
        const outputFilename = `${filename}-${size}.${format}`;
        const outputPath = path.join(config.targetDir, outputFilename);
        
        // Skip if file already exists (for incremental processing)
        if (fs.existsSync(outputPath)) {
          console.log(`Skipping existing file: ${outputPath}`);
          continue;
        }
        
        // Resize and convert
        let pipeline = image.clone().resize(size, null, { 
          fit: 'inside',
          withoutEnlargement: true
        });
        
        // Set format-specific options
        if (format === 'webp') {
          pipeline = pipeline.webp({ 
            quality: config.quality,
            effort: 4 // 0-6, higher means better compression but slower
          });
        } else if (format === 'jpg' || format === 'jpeg') {
          pipeline = pipeline.jpeg({ 
            quality: config.quality, 
            mozjpeg: true, // Use mozjpeg for better compression
            trellisQuantisation: true
          });
        }
        
        // Save the image
        await pipeline.toFile(outputPath);
        console.log(`Created ${outputPath}`);
      }
    }
    
    // Always create a WebP version of the original size (non-resized but compressed)
    const originalWebP = `${filename}.webp`;
    const originalWebPPath = path.join(config.targetDir, originalWebP);
    
    if (!fs.existsSync(originalWebPPath)) {
      await image.clone()
        .webp({ 
          quality: config.quality,
          effort: 5 // Higher effort for full-size version
        })
        .toFile(originalWebPPath);
      console.log(`Created ${originalWebPPath}`);
    } else {
      console.log(`Skipping existing file: ${originalWebPPath}`);
    }
  }
  
  console.log('Image optimization complete!');
}

// Create an HTML snippet helper
function createPictureElements() {
  // Get all images of all configured source formats
  const files = [];
  config.sourceFormats.forEach(format => {
    files.push(...glob.sync(path.join(config.sourceDir, `*.${format}`)));
  });
  
  let html = '<!-- Generated Picture Elements -->\n';
  
  for (const file of files) {
    const filename = path.basename(file, path.extname(file));
    const sourceFormat = path.extname(file).substring(1).toLowerCase();
    
    // Use all configured sizes that would be generated
    const metadata = fs.statSync(file);
    const availableSizes = config.sizes.filter(size => size < 5000); // Approximate check
    
    html += `<picture>\n`;
    html += `  <!-- ${filename} -->\n`;
    html += `  <source type="image/webp" srcset="photos/optimized/${filename}.webp">\n`;
    
    // Add responsive sizes for WebP
    if (availableSizes.length > 0) {
      html += `  <source type="image/webp" \n`;
      html += `    srcset="${availableSizes.map(size => `photos/optimized/${filename}-${size}.webp ${size}w`).join(',\n             ')}" \n`;
      html += `    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw">\n`;
    }
    
    // Add responsive sizes for original format (if generating JPGs)
    if (config.generateJpg && availableSizes.length > 0) {
      const mimeType = sourceFormat === 'png' ? 'image/png' : 'image/jpeg';
      html += `  <source type="${mimeType}" \n`;
      html += `    srcset="${availableSizes.map(size => `photos/optimized/${filename}-${size}.${sourceFormat === 'png' ? 'png' : 'jpg'} ${size}w`).join(',\n             ')}" \n`;
      html += `    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw">\n`;
    }
    
    html += `  <img src="photos/${filename}.${sourceFormat}" alt="${filename}" loading="lazy" decoding="async" class="rounded">\n`;
    html += `</picture>\n\n`;
  }
  
  // Save the HTML snippets to a file
  fs.writeFileSync('../picture-elements.html', html);
  console.log('Created picture-elements.html with reusable picture elements');
}

// Run the optimization
processImages().then(() => {
  createPictureElements();
}).catch(err => {
  console.error('Error processing images:', err);
}); 