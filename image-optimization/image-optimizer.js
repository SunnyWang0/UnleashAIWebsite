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
  sizes: [1200, 2400, 3600], // Higher quality responsive image sizes
  quality: {
    standard: 85,    // Quality for regular sizes
    maximum: 90      // Higher quality for largest images
  },
  formats: ['jpg', 'webp'], // Output formats
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
    
    // If original is smaller than our largest size, include the original dimensions
    if (sizes.length === 0 || (sizes.length < config.sizes.length && metadata.width < config.sizes[config.sizes.length - 1])) {
      sizes.push(metadata.width);
    }
    
    // Process each size and format
    for (const size of sizes) {
      // Determine quality setting based on size
      const isLargeImage = size >= 2400;
      const qualitySetting = isLargeImage ? config.quality.maximum : config.quality.standard;
      
      for (const format of config.formats) {
        const outputFilename = `${filename}-${size}.${format}`;
        const outputPath = path.join(config.targetDir, outputFilename);
        
        // Resize and convert
        let pipeline = image.clone().resize(size, null, { 
          fit: 'inside',
          withoutEnlargement: true
        });
        
        // Set format-specific options
        if (format === 'webp') {
          pipeline = pipeline.webp({ 
            quality: qualitySetting,
            effort: 4 // Higher effort level for better compression
          });
        } else if (format === 'jpg' || format === 'jpeg') {
          pipeline = pipeline.jpeg({ 
            quality: qualitySetting, 
            mozjpeg: true,
            trellisQuantisation: true,
            overshootDeringing: true,
            optimizeScans: true
          });
        }
        
        // Save the image
        await pipeline.toFile(outputPath);
        console.log(`Created ${outputPath}`);
      }
    }
    
    // Also create a full-size WebP version in maximum quality
    const originalWebP = `${filename}.webp`;
    const originalWebPPath = path.join(config.targetDir, originalWebP);
    await image.clone()
      .webp({ 
        quality: config.quality.maximum,
        effort: 5 // Maximum effort for original size
      })
      .toFile(originalWebPPath);
    console.log(`Created ${originalWebPPath} (full size)`);
    
    // Create a full-size JPG version in maximum quality
    const originalJpg = `${filename}.jpg`;
    const originalJpgPath = path.join(config.targetDir, originalJpg);
    await image.clone()
      .jpeg({ 
        quality: config.quality.maximum,
        mozjpeg: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true
      })
      .toFile(originalJpgPath);
    console.log(`Created ${originalJpgPath} (full size)`);
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
    const sizes = config.sizes;
    
    html += `<picture>\n`;
    html += `  <!-- ${filename} -->\n`;
    html += `  <source type="image/webp" srcset="photos/optimized/${filename}.webp">\n`;
    
    // Add responsive sizes for WebP
    if (sizes.length > 0) {
      html += `  <source type="image/webp" \n`;
      html += `    srcset="photos/optimized/${filename}.webp, ${sizes.map(size => `\n             photos/optimized/${filename}-${size}.webp ${size}w`).join(',')}" \n`;
      html += `    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 100vw">\n`;
    }
    
    // Add responsive sizes for original format
    if (sizes.length > 0) {
      const mimeType = sourceFormat === 'png' ? 'image/png' : 'image/jpeg';
      html += `  <source type="${mimeType}" \n`;
      html += `    srcset="photos/optimized/${filename}.jpg, ${sizes.map(size => `\n             photos/optimized/${filename}-${size}.${sourceFormat === 'png' ? 'jpg' : 'jpg'} ${size}w`).join(',')}" \n`;
      html += `    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 100vw">\n`;
    }
    
    // Default to the highest quality image
    html += `  <img src="photos/optimized/${filename}.${sourceFormat}" alt="${filename}" loading="lazy" decoding="async" class="rounded">\n`;
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