from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import cv2
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import os
from werkzeug.utils import secure_filename
import base64
from io import BytesIO
from PIL import Image
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MODEL_PATH = 'models/pneumonia_model.h5'

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('models', exist_ok=True)

# Global variable for model
model = None

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_ai_model():
    """Load the pneumonia detection model"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = load_model(MODEL_PATH)
            logger.info("Model loaded successfully")
            return True
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}")
            return False
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

def preprocess_image(img_path, target_size=(224, 224)):
    """Preprocess image for model prediction"""
    try:
        # Load and preprocess image
        img = image.load_img(img_path, target_size=target_size)
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0  # Normalize pixel values
        return img_array
    except Exception as e:
        logger.error(f"Error preprocessing image: {str(e)}")
        return None

def predict_pneumonia(img_path):
    """Make prediction using the loaded model"""
    global model
    try:
        if model is None:
            return {"error": "Model not loaded"}
        
        # Preprocess image
        processed_img = preprocess_image(img_path)
        if processed_img is None:
            return {"error": "Failed to preprocess image"}
        
        # Make prediction
        prediction = model.predict(processed_img)
        
        # Assuming binary classification (0: Normal, 1: Pneumonia)
        pneumonia_probability = float(prediction[0][0])
        
        # Determine result
        if pneumonia_probability > 0.5:
            result = "Pneumonia Detected"
            confidence = pneumonia_probability * 100
        else:
            result = "Normal"
            confidence = (1 - pneumonia_probability) * 100
        
        return {
            "prediction": result,
            "confidence": round(confidence, 2),
            "pneumonia_probability": round(pneumonia_probability * 100, 2),
            "normal_probability": round((1 - pneumonia_probability) * 100, 2)
        }
        
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        return {"error": f"Prediction failed: {str(e)}"}

@app.route('/')
def home():
    """Home page"""
    return jsonify({
        "message": "HealthScan Pneumonia Detection API",
        "version": "1.0",
        "endpoints": {
            "/predict": "POST - Upload image for pneumonia detection",
            "/health": "GET - Check service health"
        }
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    model_status = "loaded" if model is not None else "not loaded"
    return jsonify({
        "status": "healthy",
        "model_status": model_status,
        "service": "pneumonia-detection"
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint"""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({"error": "AI model not loaded. Please check model file."}), 500
        
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file format. Please upload PNG, JPG, or JPEG files."}), 400
        
        # Save file securely
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Make prediction
        result = predict_pneumonia(filepath)
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify({
            "success": True,
            "result": result,
            "filename": filename
        })
        
    except Exception as e:
        logger.error(f"Error in predict endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/predict-base64', methods=['POST'])
def predict_base64():
    """Prediction endpoint for base64 encoded images"""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({"error": "AI model not loaded. Please check model file."}), 500
        
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No base64 image data provided"}), 400
        
        # Decode base64 image
        try:
            image_data = data['image']
            if image_data.startswith('data:image'):
                image_data = image_data.split(',')[1]
            
            img_bytes = base64.b64decode(image_data)
            img = Image.open(BytesIO(img_bytes))
            
            # Save temporarily
            filename = "temp_image.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            img.save(filepath)
            
        except Exception as e:
            return jsonify({"error": "Invalid base64 image data"}), 400
        
        # Make prediction
        result = predict_pneumonia(filepath)
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        if "error" in result:
            return jsonify(result), 500
        
        return jsonify({
            "success": True,
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error in predict-base64 endpoint: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    # Try to load the model on startup
    load_ai_model()
    
    # Run the app
    app.run(debug=False, host='0.0.0.0', port=5000)