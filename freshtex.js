function toggleLanguageList() {
  var languageList = document.getElementById("languagelist");
  languageList.classList.toggle("show");
}

// Close the dropdown code
window.onclick = function(event) {
  if (!event.target.matches('.toggle-button-2')) {
      var dropdowns = document.getElementsByClassName("language-list");
      for (var i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
              openDropdown.classList.remove('show');
          }
      }
  }
}

var imageIndex = 0;
var imageSources = ['visa.png', 'master.png', 'paypal-icon.svg']; 

function toggleImage() {
  var clickableImage = document.getElementById('clickable-image');
  imageIndex = (imageIndex + 1) % imageSources.length;
  clickableImage.src = imageSources[imageIndex];
}

function previousImage() {
  var clickableImage = document.getElementById('clickable-image');
  imageIndex = (imageIndex - 1 + imageSources.length) % imageSources.length;
  clickableImage.src = imageSources[imageIndex];
}

function nextImage() {
  var clickableImage = document.getElementById('clickable-image');
  imageIndex = (imageIndex + 1) % imageSources.length;
  clickableImage.src = imageSources[imageIndex];
}

const element = document.getElementById('o45-001p2');

function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function handleScroll() {
  if (isInViewport(element)) {
    element.classList.add('show');
  }
}

window.addEventListener('scroll', handleScroll);
handleScroll(); 


//TEXT ANIMATION CODE HERE

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
});


const whIdH1Elements = document.querySelectorAll('.why-h1-001');
whIdH1Elements.forEach((el) => observer.observe(el));


// HOME PAGE AUTO WORDS CODE HERE

const spans = document.querySelectorAll('.gr-ps-tur-001');
let index = 0;

function showNextSpan() {
  spans.forEach(span => {
    span.style.display = 'none';
  });
  spans[index].style.display = 'block';
  index = (index + 1) % spans.length;
}

setInterval(showNextSpan, 2000);
const dropdown = document.querySelector('.ser-01');
dropdown.addEventListener('click', () => {
    dropdown.classList.toggle('active');
});

// CODE FOR CLICK DROP DOWN

document.addEventListener('DOMContentLoaded', function() {
  var dropdownToggle = document.getElementById('s4_gr_902');
  var dropdownMenu = document.getElementById('On_tcr_pre');

  dropdownToggle.addEventListener('click', function(event) {
    event.stopPropagation();
    if (dropdownMenu.style.display === 'none') {
      dropdownMenu.style.display = 'block';
    } else {
      dropdownMenu.style.display = 'none';
    }
  });

  // Close the dropdown 
  document.addEventListener('click', function(event) {
    if (!dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.style.display = 'none';
    }
  });
});


document.addEventListener("DOMContentLoaded", function() {
  var searchButton = document.querySelector(".se-er-ch-bt-001");
  var searchBarContainer = document.querySelector(".fo_oc_cnt002");

  searchButton.addEventListener("click", function(event) {
      if (window.innerWidth <= 600 && !searchBarContainer.classList.contains("active")) {
          event.preventDefault(); // Prevent form submission
          searchBarContainer.classList.toggle("active");
      }
  });
});

function showSearchInput() {
  const form = document.querySelector('.fo_oc_cnt002');
  form.classList.toggle('show-input');
}

 const displayDuration = 5000; 
 const statusMessage = document.getElementById('statusMessage');

 // Set a timeout to hide the span after the specified duration
 setTimeout(() => {
     statusMessage.style.display = 'none';
 }, displayDuration);




 // Array of image sources and corresponding texts
const content = [
  {
    image: "assets/jap_rep_001.jpg",
    title: "Professional Manuscript Editing Services",
    text: "At Hitex Editex, we provide comprehensive manuscript editing services tailored to meet the needs of authors and researchers."
  },
  {
    image: "assets/jap_rep_002.jpg",
    title: "Expert Proofreading",
    text: "Our team of experienced editors ensures your manuscript is free from grammatical errors and typos."
  },
  {
    image: "assets/jap_rep_003.jpg",
    title: "Formatting and Style Guidelines",
    text: "We help you adhere to specific journal or publication requirements, ensuring your manuscript meets all formatting standards."
  }
];

let currentIndex = 0;

function changeContent() {
  const title = document.querySelector('.ger_sd_123');
  const image = document.getElementById('xso_re_erg_12');
  const text = document.querySelector('.cole_bugh');

  // Update content
  title.textContent = content[currentIndex].title;
  image.src = content[currentIndex].image;
  text.textContent = content[currentIndex].text;

  // Move to next item, or back to start if at end
  currentIndex = (currentIndex + 1) % content.length;
}

// Change content every 5 seconds (5000 milliseconds)
setInterval(changeContent, 5000);

// Initial call to set first content immediately
changeContent();


// image slider//


// First, let's create an array of content objects that contain both images and text
const sliderContent = [
  {
      title: "Professional Manuscript Editing Services",
      image: "assets/jap_rep_001.jpg",
      text: "At Hitex Editex, we provide comprehensive manuscript editing services tailored to meet the needs of authors and researchers."
  },
  {
      title: "Expert Academic Proofreading",
      image: "assets/jap_rep_002.jpg",
      text: "Our team of experienced editors ensures your academic work meets the highest standards of clarity and precision."
  },
  {
      title: "Research Paper Enhancement",
      image: "assets/jap_rep_003.jpg",
      text: "Transform your research papers with our specialized editing services focused on academic excellence."
  },
  {
      title: "Publication Support Services",
      image: "assets/jap_rep_004.jpg",
      text: "Get comprehensive support for your publication journey from our expert editing team."
  }
];

// Function to update the content
function updateContent(index) {
  const titleElement = document.querySelector('.ger_sd_123');
  const imageElement = document.getElementById('xso_re_erg_12');
  const textElement = document.querySelector('.cole_bugh');
  
  // Check if elements exist before updating
  if (titleElement && imageElement && textElement) {
      // Apply fade out effect
      titleElement.style.opacity = '0';
      imageElement.style.opacity = '0';
      textElement.style.opacity = '0';
      
      // Update content after brief delay for fade effect
      setTimeout(() => {
          titleElement.textContent = sliderContent[index].title;
          imageElement.src = sliderContent[index].image;
          textElement.textContent = sliderContent[index].text;
          
          // Fade in new content
          titleElement.style.opacity = '1';
          imageElement.style.opacity = '1';
          textElement.style.opacity = '1';
      }, 500);
  }
}

// Add necessary CSS
const style = document.createElement('style');
style.textContent = `
  .ger_sd_123, #xso_re_erg_12, .cole_bugh {
      transition: opacity 0.5s ease-in-out;
  }
  
  #xso_re_erg_12 {
      max-width: 100%;
      height: auto;
  }
`;
document.head.appendChild(style);

// Initialize variables
let currentIndex = 0;
const totalSlides = sliderContent.length;

// Function to move to next slide
function nextSlide() {
  currentIndex = (currentIndex + 1) % totalSlides;
  updateContent(currentIndex);
}

// Start automatic slideshow
let slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds

// Optional: Pause on hover
const container = document.getElementById('in_ins_034_fr');
if (container) {
  container.addEventListener('mouseenter', () => clearInterval(slideInterval));
  container.addEventListener('mouseleave', () => {
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
  });
}

// Initialize first slide
updateContent(0);
