const menuToggle = document.querySelector('.menu-toggle');
const navList = document.querySelector('.nav-list');
const navItems = document.querySelectorAll('.nav-item');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navList.classList.toggle('active');
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            item.classList.toggle('active');
        }
    });
});
