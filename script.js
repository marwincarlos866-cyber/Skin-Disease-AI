const API_URL = 'http://127.0.0.1:8000/predict';

// DOM Elements
const uploadSection = document.getElementById('upload-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const imagePreview = document.getElementById('image-preview');
const btnCancel = document.getElementById('btn-cancel');
const btnPredict = document.getElementById('btn-predict');
const loadingSection = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const predictionName = document.getElementById('prediction-name');
const confidenceScore = document.getElementById('confidence-score');
const confidenceFill = document.getElementById('confidence-fill');
const diseaseDescription = document.getElementById('disease-description');
const btnReset = document.getElementById('btn-reset');

let selectedFile = null;

// --- Event Listeners for Upload ---

// Click to browse
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// Drag and drop events
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
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

// --- File Handling ---

function handleFileSelect(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, JPEG, PNG).');
        return;
    }

    selectedFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        uploadSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

// --- Cancel and Reset ---

btnCancel.addEventListener('click', () => {
    resetUI();
});

btnReset.addEventListener('click', () => {
    resetUI();
});

function resetUI() {
    selectedFile = null;
    fileInput.value = '';
    imagePreview.src = '';
    
    uploadSection.classList.remove('hidden');
    previewSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    
    // Reset results
    predictionName.textContent = '-';
    confidenceScore.textContent = '0%';
    confidenceFill.style.width = '0%';
    diseaseDescription.textContent = 'Loading description...';
}

// --- API Communication ---

btnPredict.addEventListener('click', async () => {
    if (!selectedFile) return;

    // Show loading
    previewSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');

    // Prepare form data
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Prediction failed');
        }

        const data = await response.json();
        showResults(data);

    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
        resetUI(); // Go back to start on error
    }
});

function showResults(data) {
    // Hide loading, show results
    loadingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');

    // Populate data
    predictionName.textContent = data.prediction;
    
    // Animate progress bar
    setTimeout(() => {
        confidenceFill.style.width = `${data.confidence}%`;
        confidenceScore.textContent = `${data.confidence.toFixed(1)}%`;
        
        // Change color based on confidence
        if (data.confidence > 80) {
            confidenceFill.style.backgroundColor = 'var(--success)';
        } else if (data.confidence > 50) {
            confidenceFill.style.backgroundColor = '#F59E0B'; // yellow/orange
        } else {
            confidenceFill.style.backgroundColor = '#EF4444'; // red
        }
    }, 100);

    diseaseDescription.textContent = data.description;
}
