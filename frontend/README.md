# HealthScan Frontend

Modern, responsive web interface for pneumonia detection using AI.

## Features

- **Drag & Drop Upload**: Easy image upload with drag and drop support
- **Real-time Analysis**: Instant pneumonia detection results
- **Visual Results**: Clean, medical-grade result display with confidence scores
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Report Download**: Download analysis results as text reports

## Setup

1. **Serve the Frontend**
   
   You can use any web server. Here are a few options:

   **Using Python (Recommended)**:
   ```bash
   cd frontend
   python -m http.server 8080
   ```

   **Using Node.js (if you have it)**:
   ```bash
   cd frontend
   npx serve . -p 8080
   ```

   **Using Live Server (VS Code Extension)**:
   - Install the "Live Server" extension in VS Code
   - Right-click on `index.html` and select "Open with Live Server"

2. **Access the Application**
   - Open your browser and go to `http://localhost:8080`
   - Make sure the backend is running on `http://localhost:5000`

## File Structure

```
frontend/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive design
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

## Usage

1. **Upload Image**: Drag and drop or browse for a chest X-ray image
2. **Analyze**: Click the "Analyze Image" button
3. **View Results**: See the prediction with confidence scores
4. **Download Report**: Export results as a text file
5. **New Analysis**: Upload another image for analysis

## Configuration

To change the backend URL, modify the `API_BASE_URL` variable in `script.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url:port';
```