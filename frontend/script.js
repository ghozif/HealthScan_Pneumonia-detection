// Configuration
const API_BASE_URL = 'http://143.198.197.246:5000'; // ganti dengan IP server kamu

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadContent = document.getElementById('uploadContent');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');

// Result elements
const resultStatus = document.getElementById('resultStatus');
const resultIcon = document.getElementById('resultIcon');
const resultText = document.getElementById('resultText');
const confidenceValue = document.getElementById('confidenceValue');
const normalProb = document.getElementById('normalProb');
const pneumoniaProb = document.getElementById('pneumoniaProb');
const normalBar = document.getElementById('normalBar');
const pneumoniaBar = document.getElementById('pneumoniaBar');

// Action buttons
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');

// Global variables
let currentFile = null;
let currentResults = null;

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkBackendHealth();
});

function initializeEventListeners() {
    // File input events
    browseBtn.addEventListener('click', () => {
        fileInput.value = ''; // Reset to allow re-selecting same file
        fileInput.click();
    });
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop events
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Button events
    removeBtn.addEventListener('click', clearImage);
    analyzeBtn.addEventListener('click', analyzeImage);
    newAnalysisBtn.addEventListener('click', resetToUpload);
    downloadBtn.addEventListener('click', downloadReport);
    retryBtn.addEventListener('click', retryAnalysis);

    // Upload area click
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || uploadContent.contains(e.target)) {
            fileInput.value = ''; // Reset to allow re-selecting same file
            fileInput.click();
        }
    });
}

async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (data.model_status === 'not loaded') {
            showError('AI model is not loaded. Please ensure the .h5 model file is placed in the backend/models/ directory.');
        }
    } catch (error) {
        showError('Backend service is not running. Please start the Flask server.');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please upload a valid image file (PNG, JPG, or JPEG).');
        return;
    }

    // Validate file size (16MB max)
    const maxSize = 16 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('File size must be less than 16MB.');
        return;
    }

    currentFile = file;
    console.log('File set:', currentFile.name); // Debug log
    hideError(); // Clear any previous errors
    displayImage(file);
}

function displayImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        uploadContent.style.display = 'none';
        imagePreview.style.display = 'block';
        console.log('Image displayed, currentFile is:', currentFile ? currentFile.name : 'NULL');
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    console.log('clearImage called');
    currentFile = null;
    fileInput.value = '';
    previewImage.src = '';
    uploadContent.style.display = 'block';
    imagePreview.style.display = 'none';
    hideResults();
    hideError();
    console.log('After clear, currentFile is:', currentFile);
}

async function analyzeImage() {
    console.log('Analyze called, currentFile:', currentFile); // Debug log
    if (!currentFile) {
        showError('Please select an image first.');
        return;
    }

    showLoading();
    hideError();
    hideResults();

    try {
        const formData = new FormData();
        formData.append('file', currentFile);

        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentResults = data.result;
            displayResults(data.result);
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        showError(error.message || 'Failed to analyze the image. Please try again.');
    } finally {
        hideLoading();
    }
}

function displayResults(results) {
    // Update primary result
    const isPneumonia = results.prediction === 'Pneumonia Detected';
    
    resultIcon.className = `result-icon fas ${isPneumonia ? 'fa-exclamation-triangle pneumonia' : 'fa-check-circle normal'}`;
    resultText.textContent = results.prediction;
    resultText.className = isPneumonia ? 'pneumonia' : 'normal';
    confidenceValue.textContent = `${results.confidence}%`;

    // Update probability bars
    normalProb.textContent = `${results.normal_probability}%`;
    pneumoniaProb.textContent = `${results.pneumonia_probability}%`;
    
    // Animate bars
    setTimeout(() => {
        normalBar.style.width = `${results.normal_probability}%`;
        pneumoniaBar.style.width = `${results.pneumonia_probability}%`;
    }, 100);

    // Show results
    showResults();
}

function showLoading() {
    loading.style.display = 'block';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showResults() {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function hideResults() {
    resultsSection.style.display = 'none';
    // Reset bars
    normalBar.style.width = '0%';
    pneumoniaBar.style.width = '0%';
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.style.display = 'none';
}

function resetToUpload() {
    clearImage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function retryAnalysis() {
    // If there's still a file, retry analysis
    if (currentFile) {
        analyzeImage();
    } else {
        // Otherwise, scroll back to upload and hide error
        hideError();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function downloadReport() {
    if (!currentResults) {
        showError('No results available to download.');
        return;
    }

    try {
        const reportData = {
            analysis_date: new Date().toLocaleString(),
            prediction: currentResults.prediction,
            confidence: currentResults.confidence,
            normal_probability: currentResults.normal_probability,
            pneumonia_probability: currentResults.pneumonia_probability,
            disclaimer: "This AI analysis is for informational purposes only and should not replace professional medical diagnosis."
        };

        const reportText = `
HEALTHSCAN - PNEUMONIA DETECTION REPORT
=======================================

Analysis Date: ${reportData.analysis_date}
Prediction: ${reportData.prediction}
Confidence Level: ${reportData.confidence}%

Detailed Probabilities:
- Normal: ${reportData.normal_probability}%
- Pneumonia: ${reportData.pneumonia_probability}%

DISCLAIMER:
${reportData.disclaimer}

Generated by HealthScan AI System
        `.trim();

        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `healthscan_report_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        showError('Failed to download report. Please try again.');
    }
}

// Utility functions
function formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Error handling for images
previewImage.addEventListener('error', function() {
    if (currentFile) {
        // Only show error if we're actually trying to load a file
        showError('Failed to load the selected image. Please try a different file.');
        currentFile = null;
    }
});

// Prevent default drag behavior on the document
document.addEventListener('dragover', function(e) {
    e.preventDefault();
});

document.addEventListener('drop', function(e) {
    e.preventDefault();
});