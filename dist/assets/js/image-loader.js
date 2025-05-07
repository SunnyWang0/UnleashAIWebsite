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

  // Function to check if an image is a logo - exclude these from any processing
  function isLogo(img) {
    return img.classList.contains('logo-dark') || 
           img.classList.contains('logo-light') || 
           img.classList.contains('loader-logo') ||
           (img.src && (img.src.includes('logo') || img.src.includes('Logo'))) ||
           img.closest('.navbar-brand') !== null;
  }

  // Handle image loading with fade-in effect
  function handleImageLoad(img) {
    // Skip logo images completely
    if (isLogo(img)) {
      return;
    }
    
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
  
  // Prioritize first-viewport images
  function prioritizeFirstViewportImages() {
    // Get viewport dimensions
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Find all images
    const allImages = document.querySelectorAll('img');
    
    allImages.forEach(img => {
      // Skip logo images completely
      if (isLogo(img)) {
        return;
      }
      
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
      // Skip if already processed or is a logo
      if (img.classList.contains('blur-up-processed') || isLogo(img)) return;
      
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
        // Skip logo backgrounds completely
        if (imageSrc.includes('logo') || imageSrc.includes('Logo')) {
          return;
        }
        
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
        
        // Use CSS variable for background image to avoid disrupting Tailwind styles
        element.style.setProperty('--bg-image-url', `url('${smallSrc}')`);
        
        // Then load the high quality version
        const img = new Image();
        img.onload = function() {
          // Full quality image loaded, update background and remove blur
          element.style.setProperty('--bg-image-url', `url('${targetSrc}')`);
          setTimeout(() => {
            element.classList.remove('blur-loading');
            element.classList.add('blur-loaded');
          }, 100); // Small delay for smoother transition
        };
        img.onerror = function() {
          // If WebP fails, try the original format as fallback
          if (isWebP) {
            // Already using WebP, nothing to fall back to
            element.classList.remove('blur-loading');
          } else {
            // Try the original format
            element.style.setProperty('--bg-image-url', `url('${imageSrc}')`);
            setTimeout(() => {
              element.classList.remove('blur-loading');
              element.classList.add('blur-loaded');
            }, 100);
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
        // Skip logo backgrounds completely
        if (imageSrc.includes('logo') || imageSrc.includes('Logo')) {
          return;
        }
        
        // Create the high-quality version path
        const highQualitySrc = imageSrc.replace('-800.webp', '.webp');
        
        // Create and preload the high-quality image in the background
        const preloader = new Image();
        preloader.onload = function() {
          // When high-quality image is loaded, update the background
          setTimeout(() => {
            element.style.setProperty('--bg-image-url', `url('${highQualitySrc}')`);
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
          
          // Skip logos completely
          if (isLogo(img)) {
            observer.unobserve(img);
            return;
          }
          
          handleImageLoad(img);
          observer.unobserve(img);
        }
      });
    }, imgOptions);
    
    // Find all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    lazyImages.forEach(img => {
      // Skip logos completely
      if (!isLogo(img)) {
        imgObserver.observe(img);
      }
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    const lazyImages = document.querySelectorAll('img[data-src], img[data-srcset]');
    lazyImages.forEach(img => {
      // Skip logos completely
      if (!isLogo(img)) {
        handleImageLoad(img);
      }
    });
  }
  
  // Initialize all background images with CSS variables
  const bgElements = document.querySelectorAll('.bg-image');
  bgElements.forEach(element => {
    const imageSrc = element.getAttribute('data-image-src');
    if (imageSrc) {
      // Skip logo backgrounds completely
      if (imageSrc.includes('logo') || imageSrc.includes('Logo')) {
        return;
      }
      
      // Set initial CSS variable for the background image
      element.style.setProperty('--bg-image-url', `url('${imageSrc}')`);
    }
  });
  
  // Run initialization
  prioritizeFirstViewportImages();
  applyBlurUpTechnique();
  optimizeBackgroundImages();
  
  // Add event listeners for network changes
  if (navigator.connection) {
    navigator.connection.addEventListener('change', optimizeBackgroundImages);
  }
  
  // Re-check prioritization on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(prioritizeFirstViewportImages, 250);
  });
  
  // Clean up any effects that might have been applied to logos
  document.querySelectorAll('img').forEach(img => {
    if (isLogo(img)) {
      // Remove any classes or styles that might affect logos
      img.classList.remove('loading', 'blur-up', 'blur-up-processed', 'loaded');
      img.style.filter = '';
      img.style.opacity = '';
      img.style.transition = '';
      img.style.transform = '';
      
      // Remove lazy loading from logos - they should load immediately
      img.removeAttribute('loading');
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    }
  });
  
  // Apply blur effect to case study banner images
  function applyCaseStudyBannerBlur() {
    // Get current page URL
    const currentUrl = window.location.pathname;
    
    // Check if we're on a case study page
    const caseStudyPages = [
      'CapitalRaise.html',
      'EnergyServices.html',
      'CommunicationsTechnology.html',
      'EventServices.html',
      'DigitalAsset.html'
    ];
    
    // Only apply the blur if we're on a case study page
    if (caseStudyPages.some(page => currentUrl.includes(page))) {
      // Find the banner section
      const bannerSection = document.querySelector('section.image-wrapper.bg-image');
      
      if (bannerSection) {
        // Create a clone of the background for blurring
        const blurredBg = document.createElement('div');
        blurredBg.className = 'blurred-bg-layer';
        
        // Get computed style of the original element
        const computedStyle = getComputedStyle(bannerSection);
        const bgImage = computedStyle.backgroundImage;
        const bgPosition = computedStyle.backgroundPosition;
        const bgSize = computedStyle.backgroundSize;
        const bgRepeat = computedStyle.backgroundRepeat;
        
        // Apply styles to the blurred background layer
        blurredBg.style.position = 'absolute';
        blurredBg.style.top = '0';
        blurredBg.style.left = '0';
        blurredBg.style.width = '100%';
        blurredBg.style.height = '100%';
        blurredBg.style.backgroundImage = bgImage;
        blurredBg.style.backgroundPosition = bgPosition;
        blurredBg.style.backgroundSize = bgSize;
        blurredBg.style.backgroundRepeat = bgRepeat;
        blurredBg.style.filter = 'blur(4px)';
        blurredBg.style.zIndex = '0';
        
        // Make sure the section has relative positioning
        if (computedStyle.position !== 'relative' && computedStyle.position !== 'absolute') {
          bannerSection.style.position = 'relative';
        }
        
        // Make sure the container is above the blurred background
        const container = bannerSection.querySelector('.container');
        if (container) {
          container.style.position = 'relative';
          container.style.zIndex = '2';
        }
        
        // Make sure the overlay is above the blurred background
        const overlay = bannerSection.querySelector('.bg-overlay:before');
        if (overlay) {
          overlay.style.zIndex = '1';
        }
        
        // Insert the blurred background at the beginning of the section
        bannerSection.insertBefore(blurredBg, bannerSection.firstChild);
        
        // Hide the original background
        bannerSection.style.backgroundImage = 'none';
      }
    }
  }
  
  // Run the case study banner blur effect
  applyCaseStudyBannerBlur();
}); 