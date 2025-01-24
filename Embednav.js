document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    
    // Toggle mobile menu
    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        // Close all dropdowns when closing mobile menu
        if (!navLinks.classList.contains('show')) {
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        }
    });

    // Handle dropdown interactions
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.nav-button');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Check if we're in mobile view
            if (window.innerWidth <= 768) {
                // Toggle height animation for mobile
                if (dropdown.classList.contains('active')) {
                    dropdownMenu.style.maxHeight = '0px';
                    dropdown.classList.remove('active');
                } else {
                    // Close other dropdowns
                    dropdowns.forEach(d => {
                        d.classList.remove('active');
                        d.querySelector('.dropdown-menu').style.maxHeight = '0px';
                    });
                    // Open clicked dropdown
                    dropdownMenu.style.maxHeight = dropdownMenu.scrollHeight + 'px';
                    dropdown.classList.add('active');
                }
            } else {
                // Desktop behavior
                const isActive = dropdown.classList.contains('active');
                dropdowns.forEach(d => d.classList.remove('active'));
                if (!isActive) dropdown.classList.add('active');
            }
        });

        // Desktop hover behavior
        if (window.innerWidth > 768) {
            dropdown.addEventListener('mouseenter', () => {
                dropdowns.forEach(d => d.classList.remove('active'));
                dropdown.classList.add('active');
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.querySelector('.dropdown-menu').style.maxHeight = '0px';
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('show');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
                dropdown.querySelector('.dropdown-menu').style.maxHeight = '';
            });
        }
    });
});


// DII NAV CODE

document.addEventListener('DOMContentLoaded', function() {
    // Get all elements with submenu toggles
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    // Handle submenu toggles
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const menuItem = this.closest('.menu-item');
            
            // On mobile, toggle the active class
            if (window.innerWidth <= 968) {
                menuItem.classList.toggle('active');
                
                // Update aria-expanded
                const isExpanded = menuItem.classList.contains('active');
                this.setAttribute('aria-expanded', isExpanded);
                
                // Close other open submenus
                submenuToggles.forEach(otherToggle => {
                    const otherMenuItem = otherToggle.closest('.menu-item');
                    if (otherMenuItem !== menuItem) {
                        otherMenuItem.classList.remove('active');
                        otherToggle.setAttribute('aria-expanded', 'false');
                    }
                });
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mainNav.contains(e.target)) {
            submenuToggles.forEach(toggle => {
                const menuItem = toggle.closest('.menu-item');
                menuItem.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
            menuToggle.checked = false;
        }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            submenuToggles.forEach(toggle => {
                const menuItem = toggle.closest('.menu-item');
                menuItem.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
            menuToggle.checked = false;
        }
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 968) {
                submenuToggles.forEach(toggle => {
                    const menuItem = toggle.closest('.menu-item');
                    menuItem.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                });
                menuToggle.checked = false;
            }
        }, 250);
    });
});


// AUTO CHANGE OF NUMBERS

document.addEventListener('DOMContentLoaded', function() {
    const counters = document.querySelectorAll('[data-target]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const originalText = counter.textContent;
        const duration = 6000; // Total animation duration in milliseconds
        
        // Adjust increment based on specific targets
        const increment = target / (duration / 10);
        
        let currentCount = 0;
        
        const updateCounter = () => {
            if (currentCount < target) {
                currentCount += increment;
                counter.textContent = Math.round(currentCount) + '+';
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target + '+';
                
                // Restart animation after 2 seconds
                setTimeout(() => {
                    // Reset to original text
                    counter.textContent = originalText;
                    
                    // Restart counting
                    currentCount = 0;
                    updateCounter();
                }, 2000);
            }
        };
        
        // Intersection Observer to start animation when element is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(counter);
    });
});


//ANIMATION OF NUMBERS

function createScrollReveal() {
    const elements = document.querySelectorAll('.secepaerate');
    
    const style = document.createElement('style');
    style.textContent = `
        .scroll-reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 1s, transform 1s ease-out;
        }
        .scroll-reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { 
        threshold: 0.1
    });

    // Add scroll-reveal class and observe each element
    elements.forEach(element => {
        element.classList.add('scroll-reveal');
        observer.observe(element);
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', createScrollReveal);


// NEW FAQ CODE HERE

document.addEventListener('DOMContentLoaded', () => {
    const faqToggle = document.getElementById('faqToggle');
    const faqQuestions = document.getElementById('faqQuestions');
    const faqToggleIcon = faqToggle.querySelector('.toggle-icon');

    // FAQ Header Toggle
    faqToggle.addEventListener('click', () => {
        faqQuestions.classList.toggle('active');
        faqToggleIcon.textContent = faqQuestions.classList.contains('active') ? '▲' : '▼';
    });

    // Individual Question Toggles
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('.toggle-icon');

            // Close all other open answers
            document.querySelectorAll('.faq-answer').forEach(ans => {
                if (ans !== answer) {
                    ans.classList.remove('active');
                    ans.previousElementSibling.querySelector('.toggle-icon').textContent = '▼';
                }
            });

            // Toggle current answer
            answer.classList.toggle('active');
            icon.textContent = answer.classList.contains('active') ? '▲' : '▼';
        });
    });
});


// CODE FOR AUTHOR

document.addEventListener('DOMContentLoaded', () => {
    const ctaButton = document.querySelector('.cta-button');
    
    ctaButton.addEventListener('mouseenter', (e) => {
        e.target.style.transform = 'translateY(-3px)';
    });

    ctaButton.addEventListener('mouseleave', (e) => {
        e.target.style.transform = 'translateY(0)';
    });
});

