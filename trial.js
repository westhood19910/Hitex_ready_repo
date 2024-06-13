document.addEventListener('DOMContentLoaded', (event) => {
    const menuTrigger = document.getElementById('menu-trigger');
    const dropdownMenu = document.getElementById('dropdown-menu');

    menuTrigger.addEventListener('click', () => {
        dropdownMenu.classList.toggle('show');
    }); 
    // Optional: Close the dropdown if the user clicks outside of it
    document.addEventListener('click', (event) => {
        if (!menuTrigger.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
});
