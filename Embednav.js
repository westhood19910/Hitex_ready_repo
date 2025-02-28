// Utility functions
const utils = {
    debounce: (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
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
        if (this.mobileMenuButton && this.navLinks) {
            this.setupMobileMenu();
        }
        
        this.setupDropdowns();
        this.setupSubmenuToggles();
        this.setupOutsideClicks();
        this.setupKeyboardNavigation();
        this.setupResizeHandler();
    }

    setupMobileMenu() {
        this.mobileMenuButton.addEventListener('click', () => {
            this.navLinks.classList.toggle('show');
            if (!this.navLinks.classList.contains('show')) {
                this.dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
            }
        });
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
                    const menu = d.querySelector('.dropdown-menu');
                    if (menu) menu.style.maxHeight = '0px';
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
                        if (otherToggle !== toggle) {
                            const otherMenuItem = otherToggle.closest('.menu-item');
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
        
        if (this.faqToggle && this.faqQuestions) {
            this.init();
        }
    }

    init() {
        this.setupFAQToggle();
        this.setupQuestionToggles();
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

// Team Hexagon System
class HexagonSystem {
    constructor() {
        this.items = document.querySelectorAll('.ht_itemBox34');
        if (this.items.length) {
            this.init();
        }
    }
    
    init() {
        this.items.forEach(item => {
            const popup = item.querySelector('.ht_popup');
            const hexagon = item.querySelector('.ht_polyContainer12');
            
            if (hexagon && popup) {
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
            }
        });
        
        // Add click event to close popup when clicking outside
        document.addEventListener('click', (e) => {
            this.items.forEach(item => {
                if (!item.contains(e.target)) {
                    const popup = item.querySelector('.ht_popup');
                    if (popup) popup.classList.remove('active');
                }
            });
        });
    }
}

// Testimonial Carousel System
class TestimonialCarousel {
    constructor() {
        this.carouselInner = document.getElementById('carouselInner');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.indicators = document.getElementById('indicators');
        this.testimonials = document.querySelectorAll('.tea_testimonial');
        this.currentIndex = 0;
        this.interval = null;
        
        if (this.carouselInner && this.testimonials.length) {
            this.init();
        }
    }
    
    init() {
        this.createIndicators();
        this.setupEventListeners();
        this.startAutoSlide();
    }
    
    createIndicators() {
        if (!this.indicators) return;
        
        this.testimonials.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.classList.add('tea_indicator');
            if (index === 0) {
                indicator.classList.add('active');
            }
            indicator.addEventListener('click', () => {
                this.goToSlide(index);
            });
            this.indicators.appendChild(indicator);
        });
    }
    
    updateCarousel() {
        if (!this.carouselInner) return;
        
        const translateX = -this.currentIndex * 100;
        this.carouselInner.style.transform = `translateX(${translateX}%)`;
        
        // Update indicators
        document.querySelectorAll('.tea_indicator').forEach((indicator, index) => {
            if (index === this.currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    goToSlide(index) {
        this.currentIndex = index;
        this.updateCarousel();
    }
    
    goToNext() {
        this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
        this.updateCarousel();
    }
    
    goToPrev() {
        this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
        this.updateCarousel();
    }
    
    startAutoSlide() {
        this.interval = setInterval(() => this.goToNext(), 7000);
    }
    
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.goToPrev());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.goToNext());
        }
        
        const carousel = document.querySelector('.tea_carousel');
        if (carousel) {
            carousel.addEventListener('click', () => {
                clearInterval(this.interval);
                this.startAutoSlide();
            });
        }
        
        // Touch events for mobile
        if (this.carouselInner) {
            let touchStartX = 0;
            let touchEndX = 0;
            
            this.carouselInner.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            });
            
            this.carouselInner.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const swipeThreshold = 50;
                
                if (touchEndX < touchStartX - swipeThreshold) {
                    this.goToNext();
                } else if (touchEndX > touchStartX + swipeThreshold) {
                    this.goToPrev();
                }
            });
        }
    }
}

// Office Location Map System
class OfficeMapSystem {
    constructor() {
        this.map = null;
        this.markers = [];
        this.activeInfoWindow = null;
        this.mapElement = document.getElementById('gloe_map');
        
        if (this.mapElement) {
            this.setupFilterButtons();
            this.setupSearch();
        }
    }
    
    initMap() {
        this.map = new google.maps.Map(this.mapElement, {
            zoom: 2,
            center: {lat: 20, lng: 0},
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true
        });
        
        this.createMarkers();
        this.setupViewOnMapButtons();
    }
    
    createMarkers() {
        const officeElements = document.querySelectorAll('.gloe_office-card');
        
        officeElements.forEach((office, index) => {
            const lat = parseFloat(office.dataset.lat);
            const lng = parseFloat(office.dataset.lng);
            const title = office.querySelector('.gloe_office-title')?.textContent || '';
            const country = office.querySelector('.gloe_office-country')?.textContent || '';
            const address = office.querySelector('.gloe_office-address')?.innerHTML || '';
            const phone = office.querySelector('.gloe_office-phone')?.textContent || '';
            const email = office.querySelector('.gloe_office-email')?.textContent || '';
            
            // Create marker
            const marker = new google.maps.Marker({
                position: {lat, lng},
                map: this.map,
                title: title,
                animation: google.maps.Animation.DROP
            });
            
            // Create info window content
            const contentString = `
                <div class="gloe_map-info-window">
                    <h3>${title}</h3>
                    <p><strong>${country}</strong></p>
                    <p>${address}</p>
                    <p><a href="tel:${phone}">${phone}</a></p>
                    <p><a href="mailto:${email}">${email}</a></p>
                </div>
            `;
            
            // Create info window
            const infoWindow = new google.maps.InfoWindow({ content: contentString });
            
            // Add click event to marker
            marker.addListener('click', () => {
                // Close any open info window
                if (this.activeInfoWindow) {
                    this.activeInfoWindow.close();
                }
                
                // Open this info window
                infoWindow.open(this.map, marker);
                this.activeInfoWindow = infoWindow;
                
                // Pan to marker
                this.map.panTo(marker.getPosition());
                this.map.setZoom(12);
            });
            
            // Store marker
            this.markers.push({marker, infoWindow});
        });
    }
    
    setupViewOnMapButtons() {
        document.querySelectorAll('.gloe_view-on-map').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                if (index >= 0 && index < this.markers.length) {
                    const {marker, infoWindow} = this.markers[index];
                    
                    // Close any open info window
                    if (this.activeInfoWindow) {
                        this.activeInfoWindow.close();
                    }
                    
                    // Open info window for this marker
                    infoWindow.open(this.map, marker);
                    this.activeInfoWindow = infoWindow;
                    
                    // Pan to marker and zoom in
                    this.map.panTo(marker.getPosition());
                    this.map.setZoom(12);
                    
                    // Scroll to map
                    this.mapElement.scrollIntoView({behavior: 'smooth'});
                }
            });
        });
    }
    
    setupFilterButtons() {
        document.querySelectorAll('.gloe_filter-button').forEach(button => {
            button.addEventListener('click', () => {
                const region = button.dataset.region;
                
                // Update active button
                document.querySelectorAll('.gloe_filter-button').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                
                // Filter offices
                const offices = document.querySelectorAll('.gloe_office-card');
                offices.forEach(office => {
                    if (region === 'all' || office.dataset.region === region) {
                        office.classList.remove('gloe_hidden');
                    } else {
                        office.classList.add('gloe_hidden');
                    }
                });
                
                this.updateMapMarkers();
            });
        });
    }
    
    setupSearch() {
        const searchInput = document.getElementById('office-search');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.toLowerCase();
                const offices = document.querySelectorAll('.gloe_office-card');
                
                offices.forEach(office => {
                    const city = (office.dataset.city || '').toLowerCase();
                    const country = (office.dataset.country || '').toLowerCase();
                    const region = (office.dataset.region || '').toLowerCase();
                    
                    if (city.includes(query) || country.includes(query) || region.includes(query)) {
                        office.classList.remove('gloe_hidden');
                    } else {
                        office.classList.add('gloe_hidden');
                    }
                });
                
                this.updateMapMarkers();
            });
        }
    }
    
    updateMapMarkers() {
        if (!this.map) return;
        
        const visibleOffices = Array.from(document.querySelectorAll('.gloe_office-card:not(.gloe_hidden)'));
        const visibleIndices = visibleOffices.map(office => {
            const viewOnMapButton = office.querySelector('.gloe_view-on-map');
            return viewOnMapButton ? parseInt(viewOnMapButton.dataset.index) : -1;
        }).filter(index => index >= 0);
        
        this.markers.forEach((item, index) => {
            if (visibleIndices.includes(index)) {
                item.marker.setMap(this.map);
            } else {
                item.marker.setMap(null);
            }
        });
        
        // Fit bounds to visible markers if there are any
        if (visibleIndices.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            visibleIndices.forEach(index => {
                bounds.extend(this.markers[index].marker.getPosition());
            });
            this.map.fitBounds(bounds);
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    const navigation = new NavigationSystem();
    const counter = new CounterSystem();
    const faq = new FAQSystem();
    const hexagon = new HexagonSystem();
    const testimonials = new TestimonialCarousel();
    
    // Set up scroll reveal if it exists
    if (typeof createScrollReveal === 'function') {
        createScrollReveal();
    }
    
    // Initialize particle system if it exists
    if (typeof SlodsParticleSystem === 'function') {
        new SlodsParticleSystem();
    }
    
    // Initialize the map system
    const officeMap = new OfficeMapSystem();
    
    // Check if Google Maps API is loaded
    if (typeof google !== 'undefined' && google.maps) {
        officeMap.initMap();
    } else {
        // If using a map, you should have a way to call initMap when Google Maps loads
        window.initMap = () => officeMap.initMap();
    }
});