// LEVELS CODE HERE

document.querySelectorAll('.service-card').forEach(card => {
    const description = card.querySelector('.service-description');
    
    card.addEventListener('mouseenter', () => {
        description.style.display = 'flex';
        description.animate([
            { 
                top: '-100%',
                opacity: 0
            },
            { 
                top: '0',
                opacity: 1
            }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });
    });
  
    card.addEventListener('mouseleave', () => {
        description.animate([
            { 
                top: '0',
                opacity: 1
            },
            { 
                top: '-100%',
                opacity: 0
            }
        ], {
            duration: 500,
            easing: 'ease-in',
            fill: 'forwards'
        }).onfinish = () => {
            description.style.display = 'none';
        };
    });
  });