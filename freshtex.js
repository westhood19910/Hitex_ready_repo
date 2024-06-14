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

  // Close the dropdown menu if the user clicks outside of it
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
