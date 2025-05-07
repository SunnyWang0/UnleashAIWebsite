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
  sizes: [800, 1200, 1600], // Responsive image sizes
  quality: 80,  // JPEG/WebP quality
  formats: ['jpg', 'webp'] // Output formats
};

// Ensure target directory exists
if (!fs.existsSync(config.targetDir)) {
  fs.mkdirSync(config.targetDir, { recursive: true });
}

// Process all JPG images in source directory
async function processImages() {
  const files = glob.sync(path.join(config.sourceDir, '*.jpg'));
  
  console.log(`Found ${files.length} images to process`);
  
  for (const file of files) {
    const filename = path.basename(file, path.extname(file));
    console.log(`Processing ${filename}...`);
    
    // Load the image
    const image = sharp(file);
    const metadata = await image.metadata();
    
    // Only generate smaller sizes
    const sizes = config.sizes.filter(size => size < metadata.width);
    
    // Process each size and format
    for (const size of sizes) {
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
          pipeline = pipeline.webp({ quality: config.quality });
        } else if (format === 'jpg' || format === 'jpeg') {
          pipeline = pipeline.jpeg({ quality: config.quality, mozjpeg: true });
        }
        
        // Save the image
        await pipeline.toFile(outputPath);
        console.log(`Created ${outputPath}`);
      }
    }
    
    // Also create a WebP version of the original size
    const originalWebP = `${filename}.webp`;
    const originalWebPPath = path.join(config.targetDir, originalWebP);
    await image.clone()
      .webp({ quality: config.quality })
      .toFile(originalWebPPath);
    console.log(`Created ${originalWebPPath}`);
  }
  
  console.log('Image optimization complete!');
}

// Create an HTML snippet helper
function createPictureElements() {
  const files = glob.sync(path.join(config.sourceDir, '*.jpg'));
  let html = '<!-- Generated Picture Elements -->\n';
  
  for (const file of files) {
    const filename = path.basename(file, path.extname(file));
    const sizes = config.sizes.filter(size => size < 1600); // Assuming original is larger
    
    html += `<picture>\n`;
    html += `  <!-- ${filename} -->\n`;
    html += `  <source type="image/webp" srcset="photos/optimized/${filename}.webp">\n`;
    
    // Add responsive sizes for WebP
    if (sizes.length > 0) {
      html += `  <source type="image/webp" \n`;
      html += `    srcset="${sizes.map(size => `photos/optimized/${filename}-${size}.webp ${size}w`).join(',\n             ')}" \n`;
      html += `    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw">\n`;
    }
    
    // Add responsive sizes for JPEG
    if (sizes.length > 0) {
      html += `  <source type="image/jpeg" \n`;
      html += `    srcset="${sizes.map(size => `photos/optimized/${filename}-${size}.jpg ${size}w`).join(',\n             ')}" \n`;
      html += `    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw">\n`;
    }
    
    html += `  <img src="photos/${filename}.jpg" alt="${filename}" loading="lazy" decoding="async" class="rounded">\n`;
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