class LanguageDropdown {
  constructor(toggleSelector = '.toggle-button-2', listSelector = '#languagelist') {
    this.toggleButton = document.querySelector(toggleSelector);
    this.languageList = document.querySelector(listSelector);
    
    if (!this.toggleButton || !this.languageList) {
      console.error('Required dropdown elements not found');
      return;
    }
    
    this.init();
  }

  init() {
    // Toggle button handler with event stopping
    this.toggleButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleLanguageList();
    });

    // Close on outside click with more precise targeting
    document.addEventListener('click', (event) => {
      if (!this.languageList.contains(event.target) && 
          !this.toggleButton.contains(event.target)) {
        this.closeDropdowns();
      }
    });
  }

  toggleLanguageList() {
    this.languageList.classList.toggle("show");
  }

  closeDropdowns() {
    const openDropdowns = document.querySelectorAll(".language-list.show");
    openDropdowns.forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }
}

// Image carousel handler
class ImageCarousel {
  constructor() {
    this.imageIndex = 0;
    this.image = document.getElementById('clickable-image');
    if (!this.image) return;

    this.init();
  }

  init() {
    this.image.addEventListener('error', () => {
      console.error(`Failed to load image: ${CONFIG.imageSources[this.imageIndex]}`);
    });
  }

  toggleImage() {
    this.setImageIndex((this.imageIndex + 1) % CONFIG.imageSources.length);
  }

  previousImage() {
    this.setImageIndex((this.imageIndex - 1 + CONFIG.imageSources.length) % CONFIG.imageSources.length);
  }

  nextImage() {
    this.setImageIndex((this.imageIndex + 1) % CONFIG.imageSources.length);
  }

  setImageIndex(newIndex) {
    this.imageIndex = newIndex;
    if (this.image) {
      this.image.src = CONFIG.imageSources[this.imageIndex];
    }
  }
}

// Scroll animation handler
class ScrollAnimationHandler {
  constructor() {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
      threshold: 0.1
    });
    
    this.init();
  }

  init() {
    // Initialize animations for different elements
    this.initializeWhyH1Animations();
    this.initializeViewportCheck();
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        this.observer.unobserve(entry.target);
      }
    });
  }

  initializeWhyH1Animations() {
    document.querySelectorAll('.why-h1-001').forEach(el => {
      this.observer.observe(el);
    });
  }

  initializeViewportCheck() {
    const element = document.getElementById('o45-001p2');
    if (!element) return;

    const checkViewport = () => {
      const rect = element.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      if (isVisible) {
        element.classList.add('show');
      }
    };

    window.addEventListener('scroll', throttle(checkViewport, 150));
    checkViewport();
  }
}

// Utility functions
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.alb_pa_001');
  const secondaryNav = document.querySelector('.main-nav');
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateNavbars = () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY < 20) {
      // At the top of the page
      header.classList.remove('nav-hidden');
      document.body.classList.remove('nav-scrolled');
      secondaryNav.style.top = '5.5em';
    } else if (currentScrollY > lastScrollY) {
      // Scrolling down - hide header and move secondary nav up
      header.classList.add('nav-hidden');
      document.body.classList.add('nav-scrolled');
      secondaryNav.style.top = '0';
    } else {
      // Scrolling up - show header and move secondary nav down
      header.classList.remove('nav-hidden');
      document.body.classList.remove('nav-scrolled');
      secondaryNav.style.top = '5.5em';
    }
    
    lastScrollY = currentScrollY;
    ticking = false;
  };

  // Using requestAnimationFrame for smooth animations
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbars);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
});