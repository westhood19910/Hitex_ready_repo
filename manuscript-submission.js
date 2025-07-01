// The complete and final code for your manuscript-submission.js file

document.addEventListener('DOMContentLoaded', function() {
    // --- VARIABLE DECLARATIONS ---
    const quoteForm = document.getElementById('quoteForm');
    const loadingElement = document.querySelector('.on_lion-loading');
    const successMessage = document.querySelector('.on_lion-success-message');
    const resetButton = document.getElementById('resetForm');
    const wordCountInput = document.getElementById('word-count');
    const serviceTypeSelect = document.getElementById('service-type');
    const deadlineInput = document.getElementById('deadline');
    const estimatedTotal = document.getElementById('estimatedTotal');
    const fileInput = document.getElementById('file-upload');
    const fileList = document.getElementById('file-list');

    // --- FORM SUBMISSION LOGIC ---
    if (quoteForm) {
        quoteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('You must be logged in to submit a manuscript.');
                return;
            }
            quoteForm.style.display = 'none';
            successMessage.style.display = 'none';
            loadingElement.style.display = 'block';
            const formData = new FormData(quoteForm);
            try {
                const response = await fetch('https://hitex-backend-server.onrender.com/submit-manuscript', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                loadingElement.style.display = 'none';
                const result = await response.json();
                if (!response.ok) { throw new Error(result.message); }
                successMessage.style.display = 'block';
            } catch (error) {
                loadingElement.style.display = 'none';
                quoteForm.style.display = 'block';
                alert('Submission failed: ' + error.message);
            }
        });
    }
    
    // --- RESET BUTTON LOGIC ---
    if(resetButton) {
        resetButton.addEventListener('click', function() {
            successMessage.style.display = 'none';
            quoteForm.reset();
            if(fileList) fileList.innerHTML = '';
            quoteForm.style.display = 'block';
        });
    }
    
    // --- PRICE CALCULATOR LOGIC ---
    const calculatePrice = function() {
        if (!wordCountInput || !serviceTypeSelect || !deadlineInput || !estimatedTotal) return;
        let basePrice = 0, additionalPrice = 0, rushFee = 0;
        const wordCount = parseInt(wordCountInput.value) || 0;
        if (wordCount > 0) {
            basePrice = wordCount * 0.02;
            const service = serviceTypeSelect.value;
            if (service === 'copyediting') additionalPrice = wordCount * 0.01;
            else if (service === 'developmental') additionalPrice = wordCount * 0.03;
            else if (service === 'formatting') additionalPrice = 50;
            else if (service === 'full-package') additionalPrice = wordCount * 0.04 + 50;
            if (deadlineInput.value) {
                const deadline = new Date(deadlineInput.value);
                const today = new Date();
                const diffDays = Math.ceil(Math.abs(deadline - today) / (1000 * 60 * 60 * 24));
                if (diffDays <= 2) rushFee = (basePrice + additionalPrice) * 0.5;
                else if (diffDays <= 5) rushFee = (basePrice + additionalPrice) * 0.25;
            }
        }
        const priceCalc = document.querySelector('.on_lion-price-calculator');
        if(priceCalc) {
            priceCalc.querySelector('.on_lion-calculator-value:nth-of-type(1)').textContent = '$' + basePrice.toFixed(2);
            priceCalc.querySelector('.on_lion-calculator-value:nth-of-type(2)').textContent = '$' + additionalPrice.toFixed(2);
            priceCalc.querySelector('.on_lion-calculator-value:nth-of-type(3)').textContent = '$' + rushFee.toFixed(2);
        }
        const total = basePrice + additionalPrice + rushFee;
        if(estimatedTotal) estimatedTotal.textContent = '$' + total.toFixed(2);
    };
    if(wordCountInput) wordCountInput.addEventListener('input', calculatePrice);
    if(serviceTypeSelect) serviceTypeSelect.addEventListener('change', calculatePrice);
    if(deadlineInput) deadlineInput.addEventListener('change', calculatePrice);
    
    // --- FILE UPLOAD PREVIEW LOGIC ---
    if(fileInput) {
        fileInput.addEventListener('change', function(event) {
            if(fileList) {
                fileList.innerHTML = '';
                Array.from(this.files).forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.classList.add('on_lion-file-list-item');
                    fileItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
                    fileList.appendChild(fileItem);
                });
            }
        });
    }

    // Set minimum date for deadline input
    if(deadlineInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deadlineInput.min = tomorrow.toISOString().split('T')[0];
    }
});