import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js'; // Ensure this path is correct

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signupForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            // Collect form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const manuscriptType = document.getElementById('manuscriptType').value;

            try {
                // 1. Create the user with Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Prepare metadata for storage
                const signupMetadata = {
                    platform: getPlatformDetails(),
                    timestamp: new Date(),
                    referrer: document.referrer || 'direct'
                };

                // 2. Create a user document in Firestore to store additional information
                // This uses the user's unique ID (uid) as the document ID
                await setDoc(doc(db, 'users', user.uid), {
                    name: name,
                    email: email,
                    manuscriptType: manuscriptType,
                    createdAt: new Date(),
                    profileCompleted: false,
                    signupMetadata: signupMetadata
                });

                // 3. (Optional) Create a separate log for signup events for analytics
                await addDoc(collection(db, 'signupEvents'), {
                    userId: user.uid,
                    email: email,
                    manuscriptType: manuscriptType,
                    ...signupMetadata
                });

                // 4. Trigger welcome notifications
                triggerWelcomeNotifications(name, email);

                // 5. Reset the form and show a success message
                signupForm.reset();
                showSuccessModal(name);

                // 6. Redirect to the profile completion page after a short delay
                setTimeout(() => {
                    window.location.href = '/complete-profile.html'; // Update with your actual URL
                }, 2000);

            } catch (error) {
                // Handle any errors that occurred during signup
                handleSignupError(error);
            }
        });
    }
});


// --- HELPER FUNCTIONS ---

/**
 * Collects details about the user's browser and device.
 * @returns {object} An object containing platform details.
 */
function getPlatformDetails() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        browserName: getBrowserName()
    };
}

/**
 * Detects the user's browser name from the user agent string.
 * @returns {string} The name of the browser or 'Unknown Browser'.
 */
function getBrowserName() {
    const agent = window.navigator.userAgent.toLowerCase();
    switch (true) {
        case agent.includes('edge'):
            return 'Microsoft Edge';
        case agent.includes('opr') && !!window.opr:
            return 'Opera';
        case agent.includes('chrome') && !!window.chrome:
            return 'Google Chrome';
        case agent.includes('trident'):
            return 'Microsoft Internet Explorer';
        case agent.includes('firefox'):
            return 'Mozilla Firefox';
        case agent.includes('safari') && !agent.includes('chrome'):
            return 'Apple Safari';
        default:
            return 'Unknown Browser';
    }
}

/**
 * Displays a temporary success modal on the screen.
 * @param {string} name - The name of the user to welcome.
 */
function showSuccessModal(name) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background-color: #4CAF50; color: white; padding: 25px; border-radius: 10px;
        text-align: center; z-index: 1000; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    modal.innerHTML = `
        <h2>Welcome, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Redirecting to complete your profile...</p>
    `;
    document.body.appendChild(modal);

    // Remove the modal after the redirect delay
    setTimeout(() => {
        if (modal) {
            document.body.removeChild(modal);
        }
    }, 2000);
}

/**
 * Displays a user-friendly error message based on the Firebase error code.
 * @param {Error} error - The error object from Firebase.
 */
function handleSignupError(error) {
    let errorDetails = 'An unexpected error occurred. Please try again.';

    switch (error.code) {
        case 'auth/email-already-in-use':
            errorDetails = 'This email is already registered. Please use a different email or try logging in.';
            break;
        case 'auth/invalid-email':
            errorDetails = 'The email address is not valid. Please check and try again.';
            break;
        case 'auth/weak-password':
            errorDetails = 'The password is too weak. Please use a password with at least 6 characters.';
            break;
        default:
            console.error('Signup Error Code:', error.code);
            console.error('Signup Error Message:', error.message);
            break;
    }

    const errorDisplay = document.createElement('div');
    errorDisplay.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background-color: #f44336; color: white; padding: 15px; border-radius: 5px;
        z-index: 1000; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    errorDisplay.textContent = errorDetails;
    document.body.appendChild(errorDisplay);

    // Remove the error message after 3 seconds
    setTimeout(() => {
        if (errorDisplay) {
            document.body.removeChild(errorDisplay);
        }
    }, 3000);
}

/**
 * Triggers a browser notification and logs to the console.
 * @param {string} name - The user's name.
 * @param {string} email - The user's email.
 */
function triggerWelcomeNotifications(name, email) {
    // Browser notification (requires user permission)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Welcome to Our Platform!', {
            body: `Hi ${name}, thanks for signing up!`,
            // Make sure you have an icon at this path or remove the line
            icon: '/path/to/your/welcome-icon.png'
        });
    }

    // You can also trigger other notifications, like sending a welcome email via a Cloud Function.
    console.log(`Welcome notification triggered for ${name} (${email})`);
}