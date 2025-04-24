class NavigaBar {
    constructor() {
      // DOM elements
      this.nav = document.querySelector('.na__viga__bar');
      this.toggle = document.querySelector('.na__viga__bar-toggle');
      this.menuWrapper = document.querySelector('.na__viga__bar-menu-wrapper');
      this.submenuToggles = document.querySelectorAll('.na__viga__bar-submenu-toggle');
      this.navItems = document.querySelectorAll('.na__viga__bar-item');
      
      // Create overlay element for mobile
      this.overlay = document.createElement('div');
      this.overlay.className = 'na__viga__bar-overlay';
      document.body.appendChild(this.overlay);
      
      // Initialize
      this.init();
    }
    
    init() {
      // Set up event listeners
      this.setupToggle();
      this.setupSubmenuToggles();
      this.setupClickOutside();
      this.setupKeyboardNavigation();
      this.setupResizeHandler();
      
      // Add a class to the body when navigation is initialized
      document.body.classList.add('na__viga__bar-initialized');
    }
    
    setupToggle() {
      if (!this.toggle) return;
      
      this.toggle.addEventListener('click', () => {
        const isActive = this.toggle.classList.contains('active');
        
        this.toggle.classList.toggle('active');
        this.menuWrapper.classList.toggle('active');
        this.overlay.classList.toggle('active');
        
        // Toggle ARIA attributes
        this.toggle.setAttribute('aria-expanded', !isActive);
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isActive ? '' : 'hidden';
        
        // Close all submenus when toggling the menu
        if (!isActive) {
          this.closeAllSubmenus();
        }
      });
    }
    
    setupSubmenuToggles() {
      this.submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const navItem = toggle.closest('.na__viga__bar-item');
          const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
          
          // On mobile, close other submenus first
          if (this.isMobile()) {
            this.submenuToggles.forEach(otherToggle => {
              if (otherToggle !== toggle) {
                const otherNavItem = otherToggle.closest('.na__viga__bar-item');
                otherNavItem.classList.remove('active');
                otherToggle.setAttribute('aria-expanded', 'false');
              }
            });
          }
          
          // Toggle current submenu
          navItem.classList.toggle('active');
          toggle.setAttribute('aria-expanded', !isExpanded);
        });
      });
      
      // Add hover behavior for desktop
      if (!this.isMobile()) {
        this.navItems.forEach(item => {
          if (item.classList.contains('na__viga__bar-has-submenu')) {
            item.addEventListener('mouseenter', () => {
              if (!this.isMobile()) {
                const toggle = item.querySelector('.na__viga__bar-submenu-toggle');
                item.classList.add('active');
                toggle.setAttribute('aria-expanded', 'true');
              }
            });
            
            item.addEventListener('mouseleave', () => {
              if (!this.isMobile()) {
                const toggle = item.querySelector('.na__viga__bar-submenu-toggle');
                item.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
              }
            });
          }
        });
      }
    }
    
    setupClickOutside() {
      document.addEventListener('click', (e) => {
        // Close mobile menu when clicking outside
        if (this.menuWrapper && this.menuWrapper.classList.contains('active')) {
          if (!this.menuWrapper.contains(e.target) && !this.toggle.contains(e.target)) {
            this.toggle.classList.remove('active');
            this.menuWrapper.classList.remove('active');
            this.overlay.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }
        }
        
        // Close dropdowns when clicking outside on desktop
        if (!this.isMobile()) {
          if (!e.target.closest('.na__viga__bar-item')) {
            this.closeAllSubmenus();
          }
        }
      });
      
      // Close menu when clicking overlay
      this.overlay.addEventListener('click', () => {
        this.toggle.classList.remove('active');
        this.menuWrapper.classList.remove('active');
        this.overlay.classList.remove('active');
        this.toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    }
    
    setupKeyboardNavigation() {
      document.addEventListener('keydown', (e) => {
        // Close everything on Escape
        if (e.key === 'Escape') {
          this.closeAllSubmenus();
          
          if (this.menuWrapper && this.menuWrapper.classList.contains('active')) {
            this.toggle.classList.remove('active');
            this.menuWrapper.classList.remove('active');
            this.overlay.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }
        }
      });
      
      // Tab navigation for accessibility
      this.nav.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          // If tabbing through the menu, make sure parent menus stay open
          const currentItem = document.activeElement.closest('.na__viga__bar-item');
          if (currentItem && currentItem.classList.contains('na__viga__bar-has-submenu')) {
            currentItem.classList.add('active');
            const toggle = currentItem.querySelector('.na__viga__bar-submenu-toggle');
            toggle.setAttribute('aria-expanded', 'true');
          }
        }
      });
    }
    
    setupResizeHandler() {
      // Debounced resize handler
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          // Reset mobile menu when resizing to desktop
          if (!this.isMobile() && this.menuWrapper && this.menuWrapper.classList.contains('active')) {
            this.toggle.classList.remove('active');
            this.menuWrapper.classList.remove('active');
            this.overlay.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }
          
          // Reset all submenus on resize
          this.closeAllSubmenus();
          
          // Reinitialize submenu behavior based on screen size
          this.setupSubmenuToggles();
        }, 250);
      });
    }
    
    closeAllSubmenus() {
      this.navItems.forEach(item => {
        item.classList.remove('active');
        const toggle = item.querySelector('.na__viga__bar-submenu-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    }
    
    isMobile() {
      return window.innerWidth <= 1024;
    }
  }
  
  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    const navigaBar = new NavigaBar();
  });