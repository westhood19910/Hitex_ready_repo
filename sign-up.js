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
            const manuscriptType = document.getElementById('manuscriptType').value;

            // 2. Create a data object to send
            const dataToSend = {
                fullName: fullName,
                email: email,
                password: password,
                manuscriptType: manuscriptType
            };

            // 3. Use fetch to send the data to YOUR live Render server
            try {
                const response = await fetch('https://hitex-backend-server.onrender.com/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                });

                const result = await response.json(); // Get the JSON response from the server

                if (!response.ok) {
                    // If the server responded with an error (like "email already exists")
                    throw new Error(result.message || 'Something went wrong');
                }
                
                // If successful, show a success message
                alert('Success! ' + result.message);
                signupForm.reset();

            } catch (error) {
                // If there's an error with the fetch call or from the server
                console.error('Signup Error:', error);
                alert('Error: ' + error.message);
            }
        });
    }
});