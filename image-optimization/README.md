# UnleashAI Website Image Optimization Tools

This directory contains tools to optimize images for the UnleashAI website.

## Features

- Creates responsive image versions in multiple sizes
- Generates WebP versions for better performance
- Produces HTML snippets for use with `<picture>` elements
- Optimizes image quality while maintaining visual appearance

## Installation

1. Ensure Node.js is installed on your system
2. Install dependencies:

```bash
npm install
```

## Usage

Run the optimizer:

```bash
npm run optimize
```

This will:
1. Process all JPG images in the `dist/assets/img/photos/` directory
2. Create optimized versions in multiple sizes
3. Generate WebP versions for modern browsers
4. Output HTML snippets to `picture-elements.html` in the project root

## Configuration

Edit `image-optimizer.js` to change:
- Source and target directories
- Image sizes
- Quality settings
- Output formats

## HTML Usage

After running the optimizer, use the generated HTML snippets from `picture-elements.html` to implement responsive images with WebP support:

```html
<picture>
  <!-- Automatically use WebP if supported -->
  <source type="image/webp" srcset="photos/optimized/image.webp">
  
  <!-- Responsive WebP sources -->
  <source type="image/webp" 
    srcset="photos/optimized/image-800.webp 800w,
           photos/optimized/image-1200.webp 1200w" 
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw">
  
  <!-- Responsive JPEG fallbacks -->
  <source type="image/jpeg" 
    srcset="photos/optimized/image-800.jpg 800w,
           photos/optimized/image-1200.jpg 1200w" 
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw">
  
  <!-- Base fallback image -->
  <img src="photos/image.jpg" alt="description" loading="lazy" decoding="async" class="rounded">
</picture>
``` 