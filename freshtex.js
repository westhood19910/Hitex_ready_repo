document.addEventListener('DOMContentLoaded', () => {
  new LanguageDropdown(); 
});

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


// CODE FOR COPYRIGHT

// Interactive section navigation
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.sh-ra-0e-fr');
  const contentSection = document.getElementById('content-section');

  // Sample content for different sections
  const sectionContent = {
      'information-collection': `At Hitex Editex, we collect personal information from you when you voluntarily provide it to us or when you use our services. This information may include your name, email address, phone number, mailing address, academic affiliation, and payment information.`,
      'use-of-information': `We use the collected information to provide, maintain, and improve our services. This includes processing your requests, communicating with you, personalizing your experience, and analyzing usage of our website.`,
      'information-sharing': `We do not sell or rent your personal information to third parties. We may share your information with service providers who assist us in operating our website, conducting our business, or servicing you.`,
      'data-security': `We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights.`
  };

  navItems.forEach(item => {
      item.addEventListener('click', () => {
          // Remove active state from all items
          navItems.forEach(nav => nav.classList.remove('active'));
          
          // Add active state to clicked item
          item.classList.add('active');

          // Update content
          const sectionKey = item.getAttribute('data-section');
          contentSection.textContent = sectionContent[sectionKey];
      });
  });
});


// CODE FOR CLOK
function updateClock() {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDegrees = (seconds / 60) * 360;
  const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
  const hourDegrees = ((hours + minutes / 60) / 12) * 360;

  // Add console logs for debugging
  console.log(`Seconds: ${seconds}, Degrees: ${secondDegrees}`);

  // Verify element selection
  const secondHand = document.querySelector('.second-hand');
  const minuteHand = document.querySelector('.minute-hand');
  const hourHand = document.querySelector('.hour-hand');

  if (secondHand && minuteHand && hourHand) {
      secondHand.style.transform = `rotate(${secondDegrees}deg)`;
      minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
      hourHand.style.transform = `rotate(${hourDegrees}deg)`;
  } else {
      console.error('One or more clock hand elements not found!');
  }
}

// Ensure DOM is fully loaded before running
document.addEventListener('DOMContentLoaded', () => {
  // Update clock immediately and then every second
  updateClock();
  setInterval(updateClock, 1000);
});


//  CODE FOR SEARCH BAR BEHAVIOR

document.addEventListener('DOMContentLoaded', () => {
  const searchContainer = document.querySelector('.fo_oc_cnt002');
  const searchInput = document.querySelector('.lat_but_pla_001');
  const searchButton = document.querySelector('.se-er-ch-bt-001');

  // Only add click event on smaller screens
  function addMobileSearchHandler() {
      if (window.innerWidth <= 768) {
          searchButton.addEventListener('click', toggleSearch);
      }
  }

  function toggleSearch() {
      searchContainer.classList.toggle('show-input');
      
      if (searchContainer.classList.contains('show-input')) {
          searchInput.focus();
      }
  }

  // Add escape key functionality to close search
  searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && window.innerWidth <= 768) {
          searchContainer.classList.remove('show-input');
      }
  });

  // Add click outside to close search
  document.addEventListener('click', (event) => {
      if (window.innerWidth <= 768 && 
          searchContainer.classList.contains('show-input') && 
          !searchContainer.contains(event.target)) {
          searchContainer.classList.remove('show-input');
      }
  });

  // Add initial mobile handler
  addMobileSearchHandler();

  // Recheck on window resize
  window.addEventListener('resize', addMobileSearchHandler);
});


//  CODE FOR FAQ

document.addEventListener('DOMContentLoaded', function() {
  const faqItems = document.querySelectorAll('.est-90-fr-001');
  
  faqItems.forEach(item => {
      item.addEventListener('click', function() {
          // Toggle active class on the clicked item
          this.classList.toggle('active');
          
          // Find the next span element (answer)
          const answer = this.nextElementSibling;
          if (answer && answer.tagName.toLowerCase() === 'span') {
              answer.classList.toggle('active');
              
              // Close other open answers
              const allAnswers = document.querySelectorAll('#kw-98-001');
              const allItems = document.querySelectorAll('.est-90-fr-001');
              
              allAnswers.forEach(ans => {
                  if (ans !== answer) {
                      ans.classList.remove('active');
                  }
              });
              
              allItems.forEach(itm => {
                  if (itm !== this) {
                      itm.classList.remove('active');
                  }
              });
          }
      });
  });
});


// IMPLEMENTATION CODE

document.querySelectorAll('.cta-button').forEach(button => {
  button.addEventListener('click', (e) => {
      e.preventDefault();
      const target = e.target.getAttribute('href');
      document.querySelector(target).scrollIntoView({
          behavior: 'smooth'
      });
  });
});

// Add animation when cards come into view
const cards = document.querySelectorAll('.service-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
      if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
      }
  });
}, {
  threshold: 0.1
});

cards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(card);
});



// CODE FOR SERVICES PAGE

document.addEventListener('DOMContentLoaded', function() {
  // Smooth scroll for the comparison section
  document.querySelector('.scroll-indicator').addEventListener('click', function() {
      document.querySelector('.comparison-section').scrollIntoView({
          behavior: 'smooth'
      });
  });

  // Add hover effects to service cards
  const cards = document.querySelectorAll('.service-card');
  cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
      });
  });
});


// CODE FOR INTERSECTION OBESERVER FOR CARREERS PAGE ON ABOUT US

document.addEventListener('DOMContentLoaded', function() {
  const xj9km_elements = document.querySelectorAll('.uj6tk_fade');
  
  const wd5nt_observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('eq9pm_visible');
      }
    });
  }, {
    threshold: 0.1
  });

  xj9km_elements.forEach(element => {
    wd5nt_observer.observe(element);
  });

  const hg4lp_button = document.querySelector('.fm2ht_trigger');
  hg4lp_button.addEventListener('click', function() {
    console.log('Careers section CTA clicked');
  });

  const mq7jx_photos = document.querySelectorAll('.pq2fs_frame');
  mq7jx_photos.forEach(photo => {
    photo.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
    });
    
    photo.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });
});


// CODE FOR POP UP
let idleTime = 0;
let idleInterval;
let popupShown = false;

// Function to show the popup
function showPopup() {
    if (!popupShown) {
        document.getElementById('idlePopup').classList.add('show');
        document.getElementById('idlePopupOverlay').classList.add('show');
        popupShown = true;
    }
}

// Function to close the popup
function closePopup() {
    document.getElementById('idlePopup').classList.remove('show');
    document.getElementById('idlePopupOverlay').classList.remove('show');
    popupShown = false;
    resetIdleTime(); // Reset the timer when popup is closed
}

// Function to reset idle time
function resetIdleTime() {
    idleTime = 0;
}

// Function to increment idle time
function timerIncrement() {
    idleTime = idleTime + 1;
    if (idleTime >= 3100) { // Show popup after 30 seconds of inactivity
        showPopup();
    }
}

// Set up the idle timer
document.addEventListener('DOMContentLoaded', function() {
    // Increment the idle time counter every second
    idleInterval = setInterval(timerIncrement, 1000);

    // Reset the idle timer on user activity
    const resetEvents = ['mousemove', 'keypress', 'click', 'touchstart', 'scroll'];
    resetEvents.forEach(event => {
        document.addEventListener(event, resetIdleTime, true);
    });

    // Close popup when clicking outside
    document.getElementById('idlePopupOverlay').addEventListener('click', closePopup);
});


// LEADERSHIP CODE


document.addEventListener('DOMContentLoaded', () => {
  const parallaxSection = document.querySelector('.hk9xm_parallax-section');
  const body = document.body;

  window.addEventListener('scroll', () => {
      const sectionTop = parallaxSection.offsetTop;
      const sectionHeight = parallaxSection.clientHeight;
      const scrollPosition = window.pageYOffset;
      const windowHeight = window.innerHeight;

      // Check if the section is in view
      if (
          scrollPosition >= sectionTop - windowHeight / 2 && 
          scrollPosition < sectionTop + sectionHeight - windowHeight / 2
      ) {
          body.classList.add('parallax-active');
      } else {
          body.classList.remove('parallax-active');
      }
  });
});



const continents = [

  { 
    name: 'Asia', 
    imageUrl: 'assets/asia.png',
   
},
  { 
      name: 'The Americas', 
      imageUrl: 'assets/theamericas.png',
  },

  { 
      name: 'Europe', 
      imageUrl: 'assets/blueeurope.png',
  },
  { 
      name: 'Africa', 
      imageUrl: 'assets/blueafrica.png',
  },
  
];

function createContinentCards() {
  const continentGrid = document.getElementById('continentGrid');
  
  continents.forEach(continent => {
      const card = document.createElement('div');
      card.classList.add('continent-card');
      
      // Map Image
      const mapImage = document.createElement('img');
      mapImage.src = continent.imageUrl;
      mapImage.alt = `${continent.name} Image`;
      mapImage.classList.add('continent-map');
      
      // Continent Name
      const name = document.createElement('div');
      name.textContent = continent.name;
      name.classList.add('continent-name');
      
      // Statistics
      const stats = document.createElement('div');
      stats.classList.add('continent-stats');
      
      // Create stats items
      const statsData = [
          { number: continent.countries, label: '' },
          { number: continent.offices, label: '' },
          { number: continent.clients, label: '' }
      ];
      
      statsData.forEach(stat => {
          const statItem = document.createElement('div');
          statItem.classList.add('stat-item');
          
          const number = document.createElement('div');
          number.textContent = stat.number;
          number.classList.add('stat-number');
          
          const label = document.createElement('div');
          label.textContent = stat.label;
          label.classList.add('stat-label');
          
          statItem.appendChild(number);
          statItem.appendChild(label);
          stats.appendChild(statItem);
      });
      
      // Assemble card
      card.appendChild(mapImage);
      card.appendChild(name);
      card.appendChild(stats);
      
      // Add to grid
      continentGrid.appendChild(card);
  });
}

// Create cards when page loads
document.addEventListener('DOMContentLoaded', createContinentCards);