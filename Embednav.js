// Utility functions
const utils = {
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    isMobile: () => window.innerWidth <= 768,
    isTablet: () => window.innerWidth <= 968
};

// Navigation System
class NavigationSystem {
    constructor() {
        this.mobileMenuButton = document.querySelector('.mobile-menu-button');
        this.navLinks = document.querySelector('.nav-links');
        this.dropdowns = document.querySelectorAll('[data-dropdown]');
        this.mainNav = document.querySelector('.main-nav');
        this.menuToggle = document.getElementById('menu-toggle');
        this.submenuToggles = document.querySelectorAll('.submenu-toggle');
        
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupDropdowns();
        this.setupSubmenuToggles();
        this.setupOutsideClicks();
        this.setupKeyboardNavigation();
        this.setupResizeHandler();
    }

    setupMobileMenu() {
        if (this.mobileMenuButton && this.navLinks) {
            this.mobileMenuButton.addEventListener('click', () => {
                this.navLinks.classList.toggle('show');
                if (!this.navLinks.classList.contains('show')) {
                    this.dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
                }
            });
        }
    }

    setupDropdowns() {
        this.dropdowns.forEach(dropdown => {
            const button = dropdown.querySelector('.nav-button');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');

            if (button && dropdownMenu) {
                button.addEventListener('click', (e) => this.handleDropdownClick(e, dropdown, dropdownMenu));
                
                if (!utils.isMobile()) {
                    dropdown.addEventListener('mouseenter', () => this.handleDropdownHover(dropdown));
                    dropdown.addEventListener('mouseleave', () => dropdown.classList.remove('active'));
                }
            }
        });
    }

    handleDropdownClick(e, dropdown, dropdownMenu) {
        e.stopPropagation();
        
        if (utils.isMobile()) {
            if (dropdown.classList.contains('active')) {
                dropdownMenu.style.maxHeight = '0px';
                dropdown.classList.remove('active');
            } else {
                this.dropdowns.forEach(d => {
                    d.classList.remove('active');
                    d.querySelector('.dropdown-menu').style.maxHeight = '0px';
                });
                dropdownMenu.style.maxHeight = `${dropdownMenu.scrollHeight}px`;
                dropdown.classList.add('active');
            }
        } else {
            const isActive = dropdown.classList.contains('active');
            this.dropdowns.forEach(d => d.classList.remove('active'));
            if (!isActive) dropdown.classList.add('active');
        }
    }

    handleDropdownHover(dropdown) {
        this.dropdowns.forEach(d => d.classList.remove('active'));
        dropdown.classList.add('active');
    }

    setupSubmenuToggles() {
        this.submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const menuItem = toggle.closest('.menu-item');
                
                if (utils.isTablet()) {
                    menuItem.classList.toggle('active');
                    const isExpanded = menuItem.classList.contains('active');
                    toggle.setAttribute('aria-expanded', isExpanded);
                    
                    this.submenuToggles.forEach(otherToggle => {
                        const otherMenuItem = otherToggle.closest('.menu-item');
                        if (otherMenuItem !== menuItem) {
                            otherMenuItem.classList.remove('active');
                            otherToggle.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
            });
        });
    }

    setupOutsideClicks() {
        document.addEventListener('click', () => {
            this.dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
                const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                if (dropdownMenu) dropdownMenu.style.maxHeight = '0px';
            });

            if (this.menuToggle) this.menuToggle.checked = false;
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.submenuToggles.forEach(toggle => {
                    const menuItem = toggle.closest('.menu-item');
                    menuItem.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                });
                if (this.menuToggle) this.menuToggle.checked = false;
            }
        });
    }

    setupResizeHandler() {
        window.addEventListener('resize', utils.debounce(() => {
            if (!utils.isMobile()) {
                if (this.navLinks) this.navLinks.classList.remove('show');
                this.dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                    if (dropdownMenu) dropdownMenu.style.maxHeight = '';
                });
            }
        }, 250));
    }
}

// Counter Animation System
class CounterSystem {
    constructor() {
        this.counters = document.querySelectorAll('[data-target]');
        this.init();
    }

    init() {
        this.counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const originalText = counter.textContent;
            this.setupCounter(counter, target, originalText);
        });
    }

    setupCounter(counter, target, originalText) {
        const duration = 6000;
        const increment = target / (duration / 10);
        let currentCount = 0;

        const updateCounter = () => {
            if (currentCount < target) {
                currentCount += increment;
                counter.textContent = `${Math.round(currentCount)}+`;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = `${target}+`;
                setTimeout(() => {
                    counter.textContent = originalText;
                    currentCount = 0;
                    updateCounter();
                }, 2000);
            }
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        observer.observe(counter);
    }
}

// FAQ System
class FAQSystem {
    constructor() {
        this.faqToggle = document.getElementById('faqToggle');
        this.faqQuestions = document.getElementById('faqQuestions');
        this.init();
    }

    init() {
        if (this.faqToggle && this.faqQuestions) {
            this.setupFAQToggle();
            this.setupQuestionToggles();
        }
    }

    setupFAQToggle() {
        const toggleIcon = this.faqToggle.querySelector('.toggle-icon');
        this.faqToggle.addEventListener('click', () => {
            this.faqQuestions.classList.toggle('active');
            if (toggleIcon) {
                toggleIcon.textContent = this.faqQuestions.classList.contains('active') ? '▲' : '▼';
            }
        });
    }

    setupQuestionToggles() {
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const icon = question.querySelector('.toggle-icon');

                document.querySelectorAll('.faq-answer').forEach(ans => {
                    if (ans !== answer) {
                        ans.classList.remove('active');
                        const prevIcon = ans.previousElementSibling.querySelector('.toggle-icon');
                        if (prevIcon) prevIcon.textContent = '▼';
                    }
                });

                answer.classList.toggle('active');
                if (icon) icon.textContent = answer.classList.contains('active') ? '▲' : '▼';
            });
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NavigationSystem();
    new CounterSystem();
    new FAQSystem();
    
    // Set up scroll reveal
    createScrollReveal();
    
    // Initialize particle system
    new SlodsParticleSystem();
});


// LIFE AT HITEX EDITEX

document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.ht_itemBox34');
    
    // Handle both click and hover events
    items.forEach(item => {
        const popup = item.querySelector('.ht_popup');
        const hexagon = item.querySelector('.ht_polyContainer12');
        
        // Click event
        hexagon.addEventListener('click', () => {
            // Close all other popups first
            document.querySelectorAll('.ht_popup.active').forEach(activePopup => {
                if (activePopup !== popup) {
                    activePopup.classList.remove('active');
                }
            });
            
            // Toggle current popup
            popup.classList.toggle('active');
        });
        
        // Mouse enter event (hover)
        hexagon.addEventListener('mouseenter', () => {
            popup.classList.add('active');
        });
        
        // Mouse leave event
        item.addEventListener('mouseleave', () => {
            // Only close if it was opened by hover, not by click
            if (!popup.classList.contains('clicked')) {
                popup.classList.remove('active');
            }
        });
        
        // Add click event to close popup when clicking outside
        document.addEventListener('click', (e) => {
            if (!item.contains(e.target)) {
                popup.classList.remove('active');
            }
        });
    });
});