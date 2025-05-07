/**
 * UnleashAI Progressive Image Loader
 * Optimizes image loading across the website
 */
document.addEventListener('DOMContentLoaded', function() {
  const imgOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px 100px 0px"
  };

  // Check connection speed and quality
  function getConnectionInfo() {
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType, // 4g, 3g, 2g, slow-2g
        saveData: connection.saveData, // true if user has requested data saving mode
        rtt: connection.rtt, // Round-Trip Time in ms
        downlink: connection.downlink // Bandwidth in Mbps
      };
    }
    
    return {
      effectiveType: '4g', // default to 4g
      saveData: false,
      rtt: 50, // default RTT
      downlink: 10 // default bandwidth
    };
  }

  // Determine optimal image quality based on connection
  function getOptimalImageQuality() {
    const connection = getConnectionInfo();
    
    // On slow connections or data saver mode, load lower quality images
    if (connection.saveData || 
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.downlink < 1) {
      return 'low';
    } 
    
    // On medium connections
    if (connection.effectiveType === '3g' || connection.downlink < 5) {
      return 'medium';
    }
    
    // On fast connections
    return 'high';
  }

  // Handle image loading with fade-in effect
  function handleImageLoad(img) {
    // Add loading class for fade effect
    img.classList.add('loading');
    
    // Get original high-res src
    let src = img.getAttribute('data-src') || img.getAttribute('src');
    let srcset = img.getAttribute('data-srcset') || img.getAttribute('srcset');
    
    // Optimize image quality based on connection
    const quality = getOptimalImageQuality();
    
    // If on low quality connection and webp is available, use webp
    if (quality === 'low' || quality === 'medium') {
      // Check if there's a WebP version available
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
      
      // Find WebP source in picture elements
      if (img.parentNode && img.parentNode.tagName === 'PICTURE') {
        const webpSource = img.parentNode.querySelector('source[type="image/webp"]');
        if (webpSource) {
          // Use the WebP source if available
          src = webpSource.getAttribute('srcset').split(' ')[0];
        }
      }
    }
    
    // Create new image to preload
    const newImg = new Image();
    
    // When high-res image is loaded, swap it in with fade effect
    newImg.onload = function() {
      // Update src and srcset
      if (src) img.src = src;
      if (srcset) img.srcset = srcset;
      
      // Remove placeholder and add loaded class for fade-in
      img.classList.remove('loading');
      img.classList.add('loaded');
      
      // Clean up data attributes
      if (img.getAttribute('data-src')) img.removeAttribute('data-src');
      if (img.getAttribute('data-srcset')) img.removeAttribute('data-srcset');
    };
    
    // Start loading the high-res image
    if (srcset) {
      newImg.srcset = srcset;
    }
    newImg.src = src;
  }
  
  // Handle hero section background images
  function handleHeroImages() {
    // Find all hero section images (within picture elements in image-wrapper)
    const heroImgs = document.querySelectorAll('.image-wrapper picture img');
    
    heroImgs.forEach(img => {
      // Start with blur
      img.classList.add('loading');
      
      // Check if image is loaded
      if (img.complete) {
        img.classList.remove('loading');
        img.classList.add('loaded');
      } else {
        // When the image loads
        img.onload = function() {
          // Wait a bit for a smoother effect
          setTimeout(() => {
            img.classList.remove('loading');
            img.classList.add('loaded');
          }, 100);
        };
      }
    });
  }
  
  // Prioritize first-viewport images
  function prioritizeFirstViewportImages() {
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Find all images
    const allImages = document.querySelectorAll('img');
    
    allImages.forEach(img => {
      const rect = img.getBoundingClientRect();
      
      // Check if image is in first viewport
      if (rect.top < viewportHeight && rect.left < viewportWidth) {
        // Set high priority loading for images in the first viewport
        img.setAttribute('loading', 'eager');
        img.setAttribute('fetchpriority', 'high');
        img.classList.add('above-fold');
        
        // Preload important images
        if (!img.dataset.src) {
          const preloadLink = document.createElement('link');
          preloadLink.rel = 'preload';
          preloadLink.as = 'image';
          preloadLink.href = img.src;
          document.head.appendChild(preloadLink);
        }
      } else {
        // Make sure other images have lazy loading
        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
      }
    });
  }
  
  // Apply CSS blur-up technique
  function applyBlurUpTechnique() {
    const images = document.querySelectorAll('img:not(.no-blur-up)');
    images.forEach(img => {
      // Skip if already processed
      if (img.classList.contains('blur-up-processed')) return;
      
      // Create low-quality placeholder if not already in a picture element
      if (!img.parentNode || img.parentNode.tagName !== 'PICTURE') {
        const src = img.getAttribute('src');
        if (src && !img.classList.contains('loaded')) {
          // Add blur-up styles
          img.classList.add('blur-up');
          img.classList.add('blur-up-processed');
        }
      }
    });
  }
  
  // Optimize background images to use WebP where available
  function optimizeBackgroundImages() {
    // Find all elements with bg-image class
    const bgElements = document.querySelectorAll('.bg-image');
    
    // Handle each background image
    bgElements.forEach(element => {
      const imageSrc = element.getAttribute('data-image-src');
      
      if (imageSrc) {
        // Add blur-loading class to start the blur effect
        element.classList.add('blur-loading');
        
        // If not already using WebP, try to load it dynamically
        const isWebP = imageSrc.endsWith('.webp');
        const targetSrc = isWebP ? imageSrc : imageSrc.replace(/\.(jpg|jpeg|png)$/, '.webp');
        
        // First set a smaller version for quick loading
        let smallSrc;
        if (targetSrc.includes('-1600.webp')) {
          smallSrc = targetSrc.replace('-1600.webp', '-800.webp');
        } else if (targetSrc.includes('-1200.webp')) {
          smallSrc = targetSrc.replace('-1200.webp', '-800.webp');
        } else if (!targetSrc.includes('-800.webp')) {
          // If not already a small version, create one
          smallSrc = targetSrc.replace('.webp', '-800.webp');
        } else {
          smallSrc = targetSrc;
        }
        
        // First set the small blurry version
        element.style.backgroundImage = `url('${smallSrc}')`;
        
        // Then load the high quality version
        const img = new Image();
        img.onload = function() {
          // Full quality image loaded, update background and remove blur
          element.style.backgroundImage = `url('${targetSrc}')`;
          element.classList.remove('blur-loading');
          element.classList.add('blur-loaded');
        };
        img.onerror = function() {
          // If WebP fails, try the original format as fallback
          if (isWebP) {
            // Already using WebP, nothing to fall back to
            element.classList.remove('blur-loading');
          } else {
            // Try the original format
            element.style.backgroundImage = `url('${imageSrc}')`;
            element.classList.remove('blur-loading');
            element.classList.add('blur-loaded');
          }
        };
        img.src = targetSrc;
      }
    });
  }
  
  // Preload high-quality versions of background images
  function preloadHighQualityBackgroundImages() {
    // Find all elements with bg-image class
    const bgElements = document.querySelectorAll('.bg-image');
    
    bgElements.forEach(element => {
      let imageSrc = element.getAttribute('data-image-src');
      
      if (imageSrc && imageSrc.includes('-800.webp')) {
        // Create the high-quality version path
        const highQualitySrc = imageSrc.replace('-800.webp', '.webp');
        
        // Create and preload the high-quality image in the background
        const preloader = new Image();
        preloader.onload = function() {
          // When high-quality image is loaded, update the background
          setTimeout(() => {
            element.style.backgroundImage = `url('${highQualitySrc}')`;
            element.classList.remove('blur-loading');
            element.classList.add('blur-loaded');
          }, 300); // Small delay for smoother transition
        };
        preloader.src = highQualitySrc;
      }
    });
  }
  
  // Check if IntersectionObserver is supported
  if ('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          handleImageLoad(img);
          imgObserver.unobserve(img);
        }
      });
    }, imgOptions);
    
    // Prioritize first viewport images
    prioritizeFirstViewportImages();
    
    // Handle hero section images immediately
    handleHeroImages();
    
    // Apply blur-up technique
    applyBlurUpTechnique();
    
    // Optimize background images
    optimizeBackgroundImages();
    
    // Preload high-quality background images after a short delay
    setTimeout(preloadHighQualityBackgroundImages, 100);
    
    // Find all images that aren't already loaded
    const lazyImages = document.querySelectorAll('img:not(.loaded):not(.above-fold)');
    lazyImages.forEach(img => {
      // Add loading="lazy" and decoding="async" for any images missing them
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
      
      // Start observing the image
      imgObserver.observe(img);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    const lazyImages = document.querySelectorAll('img:not(.loaded)');
    lazyImages.forEach(img => {
      handleImageLoad(img);
    });
    
    // Handle hero images
    handleHeroImages();
    
    // Still optimize background images
    optimizeBackgroundImages();
  }
  
  // Initialize images that are above the fold immediately
  const aboveFoldImages = document.querySelectorAll('img.above-fold');
  aboveFoldImages.forEach(img => {
    handleImageLoad(img);
  });
  
  // Listen for connection changes (if available)
  if (navigator.connection) {
    navigator.connection.addEventListener('change', function() {
      console.log('Connection changed, reoptimizing images...');
      
      // Reoptimize visible images that haven't loaded yet
      const visibleImages = document.querySelectorAll('img.loading:not(.loaded)');
      visibleImages.forEach(img => {
        handleImageLoad(img);
      });
    });
  }
  
  // Re-check prioritization on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(prioritizeFirstViewportImages, 250);
  });
}); 