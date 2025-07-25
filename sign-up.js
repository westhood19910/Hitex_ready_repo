// sign-up.js

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop the form from causing a page reload

            // 1. Collect the form data
            const fullName = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value; // Get confirm password value
            const manuscriptType = document.getElementById('manuscriptType').value;

            // --- ADDED VALIDATION ---
            // 2. Check if passwords match
            if (password !== confirmPassword) {
                alert("Passwords do not match. Please try again.");
                return; // Stop the function from proceeding
            }

            // 3. Create a data object to send (only if passwords match)
            const dataToSend = {
                fullName: fullName,
                email: email,
                password: password,
                manuscriptType: manuscriptType
            };

            // 4. Use fetch to send the data to YOUR live Render server
            try {
                const response = await fetch('https://hitex-backend-server.onrender.com/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Something went wrong');
                }

                alert('Success! You will now be redirected to the login page.');
                window.location.href = 'client-login.html';

            } catch (error) {
                console.error('Signup Error:', error);
                alert('Error: ' + error.message);
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // ... your existing signup form code ...

    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPassword = document.getElementById('confirmPassword');

    // Function to toggle a single password field
    function toggleVisibility(inputField, toggleIcon) {
        // Check the current type of the input field
        const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
        inputField.setAttribute('type', type);

        // Toggle the icon class
        toggleIcon.classList.toggle('fa-eye-slash');
    }

    // Add click listener for the main password toggle
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            toggleVisibility(password, togglePassword);
        });
    }

    // Add click listener for the confirm password toggle
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', () => {
            toggleVisibility(confirmPassword, toggleConfirmPassword);
        });
    }
});