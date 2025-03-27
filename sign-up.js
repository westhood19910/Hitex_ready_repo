import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, setDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const manuscriptType = document.getElementById('manuscriptType').value;

    try {
       
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;


        const signupMetadata = {
            platform: getPlatformDetails(),
            timestamp: new Date(),
            referrer: document.referrer || 'direct'
        };

        
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            manuscriptType: manuscriptType,
            createdAt: new Date(),
            profileCompleted: false,
            signupMetadata: signupMetadata
        });

      
        await addDoc(collection(db, 'signupEvents'), {
            userId: user.uid,
            email: email,
            manuscriptType: manuscriptType,
            ...signupMetadata
        });

        
        triggerWelcomeNotifications(name, email);

        
        signupForm.reset();
        showSuccessModal(name);

        
        setTimeout(() => {
            window.location.href = '/complete-profile.html';
        }, 2000);

    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;


        handleSignupError(errorCode, errorMessage);
    }
});


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

// Detect browser name
function getBrowserName() {
    const agent = window.navigator.userAgent.toLowerCase();
    switch (true) {
        case agent.indexOf('edge') > -1:
            return 'Microsoft Edge';
        case agent.indexOf('opr') > -1 && !!window.opr:
            return 'Opera';
        case agent.indexOf('chrome') > -1 && !!window.chrome:
            return 'Google Chrome';
        case agent.indexOf('trident') > -1:
            return 'Microsoft Internet Explorer';
        case agent.indexOf('firefox') > -1:
            return 'Mozilla Firefox';
        case agent.indexOf('safari') > -1:
            return 'Apple Safari';
        default:
            return 'Unknown Browser';
    }
}

// Show success modal
function showSuccessModal(name) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
            <h2>Welcome, ${name}!</h2>
            <p>Your account has been created successfully.</p>
            <p>Redirecting to complete your profile...</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Remove modal after 2 seconds
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 2000);
}

// Comprehensive error handling
function handleSignupError(errorCode, errorMessage) {
    let errorDetails = '';

    switch(errorCode) {
        case 'auth/email-already-in-use':
            errorDetails = 'This email is already registered. Please use a different email or try logging in.';
            break;
        case 'auth/invalid-email':
            errorDetails = 'The email address is not valid. Please check and try again.';
            break;
        case 'auth/weak-password':
            errorDetails = 'The password is too weak. Please choose a stronger password.';
            break;
        default:
            errorDetails = 'Signup failed. Please try again.';
            console.error('Signup Error:', errorMessage);
    }

    // Create error display
    const errorDisplay = document.createElement('div');
    errorDisplay.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f44336;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
        text-align: center;
    `;
    errorDisplay.textContent = errorDetails;
    document.body.appendChild(errorDisplay);

    // Remove error after 3 seconds
    setTimeout(() => {
        document.body.removeChild(errorDisplay);
    }, 3000);
}

// Trigger notifications
function triggerWelcomeNotifications(name, email) {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Welcome to Our Platform!', {
            body: `Hi ${name}, thanks for signing up with ${email}`,
            icon: '/path/to/welcome-icon.png'
        });
    }

    // Optional: Email notification could be set up with Cloud Functions
    console.log('Welcome notification triggered for', name, email);
}