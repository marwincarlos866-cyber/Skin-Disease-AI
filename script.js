const API_BASE_URL = 'http://localhost:5000';

// DOM Elements - Pages & Navigation
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const mobileLinks = document.querySelectorAll('.mobile-link');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');

// DOM Elements - Upload & Prediction
const uploadSection = document.getElementById('uploadSection');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const changeImageBtn = document.getElementById('changeImageBtn');
const predictBtn = document.getElementById('predictBtn');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const confidenceBadge = document.getElementById('confidenceBadge');
const predictionIcon = document.getElementById('predictionIcon');
const predictionName = document.getElementById('predictionName');
const descriptionText = document.getElementById('descriptionText');
const symptomsText = document.getElementById('symptomsText');
const recommendationText = document.getElementById('recommendationText');
const probabilitiesList = document.getElementById('probabilitiesList');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

let selectedFile = null;

// Disease icons mapping
const DISEASE_ICONS = {
    acne: '🔴',
    eczema: '🩹',
    melanoma: '⚠️',
    psoriasis: '🔷',
    normal: '✅',
    unknown: '❓'
};

// ==================== NAVIGATION ====================

function navigateTo(pageId) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update nav links
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageId);
    });
    
    mobileLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageId);
    });
    
    // Close mobile menu
    mobileMenu.classList.add('hidden');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Nav link click handlers
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

mobileLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// Footer links
document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// Mobile menu toggle
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.add('hidden');
    }
});

// ==================== UPLOAD & PREDICTION ====================

// Click upload area to open file dialog
uploadArea.addEventListener('click', (e) => {
    if (e.target !== fileInput && !e.target.classList.contains('browse-link')) {
        fileInput.click();
    }
});

// Click browse text inside upload area
const browseLink = uploadArea.querySelector('.browse-link');
if (browseLink) {
    browseLink.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

// Drag and drop events
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

// Change image button
changeImageBtn.addEventListener('click', resetUI);

// Predict button
predictBtn.addEventListener('click', sendPrediction);

// Try again button
tryAgainBtn.addEventListener('click', resetUI);

// --- File Handling ---

function handleFileSelect(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please upload a valid image file (JPG, PNG, GIF, WEBP, BMP).');
        return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showToast('File size too large. Maximum allowed is 10MB.');
        return;
    }

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    };
    reader.onerror = () => {
        showToast('Error reading file. Please try another image.');
    };
    reader.readAsDataURL(file);
}

// --- UI Reset ---

function resetUI() {
    selectedFile = null;
    fileInput.value = '';
    previewImage.src = '';
    
    uploadSection.classList.remove('hidden');
    previewSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
}

// --- API Communication ---

async function sendPrediction() {
    if (!selectedFile) {
        showToast('No image selected. Please upload an image first.');
        return;
    }

    // Show loading
    previewSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    // Animate loading steps
    animateLoadingSteps();

    // Prepare form data
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }

        showResults(data);

    } catch (error) {
        console.error('Error:', error);
        showToast(`Error: ${error.message}`);
        loadingSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
    }
}

function animateLoadingSteps() {
    const steps = document.querySelectorAll('.loading-steps .step');
    steps[0].classList.add('active');
    steps[0].querySelector('i').className = 'fas fa-check';
    
    setTimeout(() => {
        steps[1].classList.add('active');
    }, 500);
    
    setTimeout(() => {
        steps[2].classList.add('active');
        steps[2].querySelector('i').className = 'fas fa-circle-notch fa-spin';
    }, 1000);
}

// --- Results Display ---

function showResults(data) {
    // Hide loading, show results
    loadingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Update confidence badge
    confidenceBadge.textContent = `${data.confidence}%`;
    
    // Update prediction icon and name
    const diseaseKey = data.prediction ? data.prediction.toLowerCase() : 'unknown';
    predictionIcon.textContent = DISEASE_ICONS[diseaseKey] || DISEASE_ICONS.unknown;
    predictionName.textContent = data.prediction ? capitalizeFirst(data.prediction) : 'Unknown';

    // Update info sections
    if (data.info) {
        descriptionText.textContent = data.info.description || 'No description available.';
        symptomsText.textContent = data.info.symptoms || 'N/A';
        recommendationText.textContent = data.info.recommendation || 'Please consult a healthcare professional.';
    } else {
        descriptionText.textContent = 'No description available.';
        symptomsText.textContent = 'N/A';
        recommendationText.textContent = 'Please consult a healthcare professional.';
    }

    // Update probabilities
    renderProbabilities(data.all_probabilities);
}

function renderProbabilities(probabilities) {
    probabilitiesList.innerHTML = '';
    
    if (!probabilities) return;

    const entries = Object.entries(probabilities);
    
    entries.forEach(([name, value], index) => {
        const isTop = index === 0;
        const percentage = typeof value === 'number' ? value.toFixed(1) : parseFloat(value).toFixed(1);
        
        const item = document.createElement('div');
        item.className = `probability-item ${isTop ? 'top-prediction' : ''}`;
        
        item.innerHTML = `
            <div class="probability-header">
                <span class="probability-label">${capitalizeFirst(name)}</span>
                <span class="probability-value">${percentage}%</span>
            </div>
            <div class="probability-bar">
                <div class="probability-fill" style="width: 0%"></div>
        `;
        
        probabilitiesList.appendChild(item);
        
        // Animate bar after a short delay
        setTimeout(() => {
            const fill = item.querySelector('.probability-fill');
            if (fill) {
                fill.style.width = `${Math.min(percentage, 100)}%`;
            }
        }, 100 + (index * 50));
    });
}

// --- Toast Notification ---

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// --- Utilities ---

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== INITIALIZATION ====================

// Check backend health on load
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        if (!data.model_loaded) {
            console.warn('Model not loaded on backend');
        }
    } catch (e) {
        console.warn('Backend not reachable');
    }
}

checkHealth();
