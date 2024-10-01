// Get a reference to the button and the content div
const toggleButton = document.getElementById('toggleButton');
const content = document.getElementById('content');

// Add a click event listener to the button
toggleButton.addEventListener('click', function() {
  // Toggle the visibility of the content div
  if (content.style.display === 'none') {
    content.style.display = 'block';
  } else {
    content.style.display = 'none';
  }
});
