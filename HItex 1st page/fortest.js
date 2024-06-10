
const dropdowns = document.querySelectorAll ('.dropdown');

dropdowns.forEach(dropdown => {
    const select = dropdown.querySelector('.select');
    const moses = dropdown.querySelector('.moses');
    const menu = dropdown.querySelector('.menu');
    const options =dropdown.querySelector('.menu li');
    const selected =dropdown.querySelector('.selected');

    select.addEventListener('click', () => {
        select.classList.toggle('select-clicked');
        moses.classList.toggle('moses-rotate');
        menu.classList.toggle('menu-open');
    } );
   options.forEach(option => {
    option.addEventListener('click', () => {
        selected.innerText =option.innerText;
        select.classList.remove('select-clicked');
        moses.classList.remove('moses-rotate');
        menu.classList.remove('menu-open');

        options.forEach(option => {
            option.classList.remove('active')
        })
    })
   })
})