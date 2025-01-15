document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('editingSubmissionForm');
    const statusMessage = document.getElementById('submissionStatus');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Validate form fields
        if (!validateForm()) {
            return;
        }
        submitForm();
    });

    function validateForm() {
        const fullName = document.getElementById('fullName');
        const email = document.getElementById('email');
        const editingType = document.getElementById('editingType');
        const termsAgreement = document.getElementById('termsAgreement');

        // Reset previous error states
        resetErrors();

        let isValid = true;

        // Name validation
        if (fullName.value.trim() === '') {
            showError(fullName, 'Name is required');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            showError(email, 'Please enter a valid email');
            isValid = false;
        }

        // Editing type validation
        if (editingType.value === '') {
            showError(editingType, 'Please select an editing type');
            isValid = false;
        }

        // Terms agreement validation
        if (!termsAgreement.checked) {
            showError(termsAgreement, 'You must agree to the terms');
            isValid = false;
        }

        return isValid;
    }

    function showError(element, message) {
        const parentDiv = element.closest('.form-group');
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.textContent = message;
        parentDiv.appendChild(errorSpan);
        element.style.borderColor = '#ff0000';
    }

    function resetErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());

        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.borderColor = '#ddd';
        });
    }

    function submitForm() {
        // In a real application, you would send this data to a server
        const formData = new FormData(form);
        const submissionData = Object.fromEntries(formData.entries());

        // Simulate server response
        setTimeout(() => {
            statusMessage.textContent = 'Submission successful! We will review your proposal.';
            statusMessage.className = 'status-message success';
            form.reset(); // Clear the form
        }, 1000);
    }
});