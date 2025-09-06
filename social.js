document.addEventListener('DOMContentLoaded', () => {

    // Get all the necessary elements from the DOM
    const searchIcon = document.getElementById('searchIcon');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');
    const closeSearch = document.getElementById('closeSearch');
    
    // --- Functionality to open and close the search bar ---

    // When the search icon is clicked, show the search container
    searchIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the click from immediately closing the bar
        searchContainer.classList.add('active');
        searchInput.focus(); // Automatically focus the input field
    });

    // When the close button is clicked, hide the search container
    closeSearch.addEventListener('click', () => {
        closeAndResetSearch();
    });

    // Also close the search bar if the user clicks anywhere else on the page
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target) && !searchIcon.contains(e.target)) {
            if (searchContainer.classList.contains('active')) {
                closeAndResetSearch();
            }
        }
    });

    // --- Core Logic for the "social media" search ---

    // Listen for input as the user types
    searchInput.addEventListener('input', () => {
        // Get the input value, trim whitespace, and convert to lower case for a reliable match
        const query = searchInput.value.trim().toLowerCase();
        
        // Check if the query matches "social media"
        if (query === 'social media') {
            // If it matches, add the 'social-active' class to show our dropdown
            searchContainer.classList.add('social-active');
        } else {
            // If it doesn't match, remove the class to show the normal input again
            searchContainer.classList.remove('social-active');
        }
    });

    // Helper function to close and reset the search bar state
    function closeAndResetSearch() {
        searchContainer.classList.remove('active');
        // A small delay to allow the closing animation to finish before resetting
        setTimeout(() => {
            searchInput.value = ''; // Clear the input
            searchContainer.classList.remove('social-active'); // Hide social options
        }, 300); // 300ms matches your CSS transition time
    }
});