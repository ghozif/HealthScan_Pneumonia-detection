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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const isPneumonia = currentResults.prediction === 'Pneumonia Detected';
        const statusColor = isPneumonia ? [220, 38, 38] : [34, 197, 94];
        
        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text('HEALTHSCAN', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text('Pneumonia Detection Report', 105, 30, { align: 'center' });
        
        // Date
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 50);
        
        // Result Box
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, 60, 170, 40, 3, 3);
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Analysis Result', 25, 70);
        
        doc.setFontSize(18);
        doc.setTextColor(...statusColor);
        doc.text(currentResults.prediction, 105, 85, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Confidence: ${currentResults.confidence}%`, 105, 95, { align: 'center' });
        
        // Probability Details
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Probabilities', 20, 115);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
        
        // Normal probability bar
        doc.text('Normal:', 25, 130);
        doc.text(`${currentResults.normal_probability}%`, 170, 130);
        doc.setFillColor(34, 197, 94);
        const normalWidth = (currentResults.normal_probability / 100) * 100;
        doc.roundedRect(25, 135, normalWidth, 8, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(25, 135, 100, 8, 2, 2);
        
        // Pneumonia probability bar
        doc.text('Pneumonia:', 25, 155);
        doc.text(`${currentResults.pneumonia_probability}%`, 170, 155);
        doc.setFillColor(220, 38, 38);
        const pneumoniaWidth = (currentResults.pneumonia_probability / 100) * 100;
        doc.roundedRect(25, 160, pneumoniaWidth, 8, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(25, 160, 100, 8, 2, 2);
        
        // Disclaimer Box
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(20, 180, 170, 40, 3, 3, 'F');
        doc.setDrawColor(251, 191, 36);
        doc.roundedRect(20, 180, 170, 40, 3, 3);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(146, 64, 14);
        doc.text('DISCLAIMER', 25, 188);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        const disclaimerText = 'This AI analysis is for informational purposes only and should not replace professional medical diagnosis. Please consult with a healthcare professional for proper medical evaluation.';
        const splitDisclaimer = doc.splitTextToSize(disclaimerText, 160);
        doc.text(splitDisclaimer, 25, 195);
        
        // Footer
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text('Generated by HealthScan AI System', 105, 280, { align: 'center' });
        doc.text('© 2025 HealthScan. AI-powered medical image analysis.', 105, 285, { align: 'center' });
        
        // Save PDF
        doc.save(`healthscan_report_${new Date().toISOString().split('T')[0]}.pdf`);
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