import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";
import { firebaseConfig } from './firebase-config.js';


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

document.getElementById('quoteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
   
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    try {
        // Collect form data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const documentType = document.getElementById('document-type').value;
        const wordCount = document.getElementById('word-count').value;
        const serviceType = document.getElementById('service-type').value;
        const deadline = document.getElementById('deadline').value;
        const message = document.getElementById('message').value;
        const fileInput = document.getElementById('file-upload');

        // Upload files to Firebase Storage
        const fileUploadPromises = Array.from(fileInput.files).map(async (file) => {
            const fileRef = ref(storage, `manuscript-quotes/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            return await getDownloadURL(snapshot.ref);
        });

        // Wait for all file uploads
        const fileUrls = await Promise.all(fileUploadPromises);

        // Prepare quote request document
        const quoteRequest = {
            name,
            email,
            documentType,
            wordCount: parseInt(wordCount),
            serviceType,
            deadline: new Date(deadline),
            message,
            fileUrls,
            status: 'New',
            createdAt: new Date(),
            quoteStatus: 'Pending',
            metadata: {
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct'
            }
        };

        // Save to Firestore
        const docRef = await addDoc(collection(db, 'quoteRequests'), quoteRequest);

        // Show success message
        showSuccessModal(name);

        // Reset form
        e.target.reset();

        // Optional: Send email notification to admin
        await sendAdminNotification(quoteRequest);

    } catch (error) {
        console.error("Error submitting quote request:", error);
        showErrorModal(error.message);
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
});

// Success modal function
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
            <h2>Thank You, ${name}!</h2>
            <p>Your quote request has been submitted successfully.</p>
            <p>We'll review your request and get back to you soon.</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Remove modal after 3 seconds
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 3000);
}

// Error modal function
function showErrorModal(errorMessage) {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #f44336;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        ">
            <h2>Submission Error</h2>
            <p>${errorMessage}</p>
            <p>Please try again or contact support.</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Remove modal after 3 seconds
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 3000);
}

// Optional: Admin notification (requires backend setup)
async function sendAdminNotification(quoteRequest) {
    console.log('Quote request received:', quoteRequest);
    // In a real-world scenario, you'd use Cloud Functions or a backend service
    // to send an email or push notification to admin
}

// File upload preview
document.getElementById('file-upload').addEventListener('change', (e) => {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = '';
    
    Array.from(e.target.files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        fileList.appendChild(fileItem);
    });
});