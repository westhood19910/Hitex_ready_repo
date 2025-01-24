// NEW FAQ CODE HERE

const faqTrigger = document.getElementById('faq-trigger');
        const faqModal = document.getElementById('faqModal');
        const closeModal = document.querySelector('.close-modal');

        faqTrigger.addEventListener('click', () => {
            faqModal.classList.add('show');
        });

        closeModal.addEventListener('click', () => {
            faqModal.classList.remove('show');
        });

        window.addEventListener('click', (event) => {
            if (event.target === faqModal) {
                faqModal.classList.remove('show');
            }
        });

        document.querySelectorAll('.faq-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('active');
            });
        });