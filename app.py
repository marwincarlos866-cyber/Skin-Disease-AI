import os
import io
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tensorflow as tf
from PIL import Image

app = FastAPI(title="Skin Disease Detection API")

# Configure CORS to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_PATH = '../model/skin_disease_model.h5'
IMG_SIZE = (224, 224)

# Disease descriptions (Bonus feature)
DISEASES = {
    0: {
        "name": "melanoma",
        "description": "Melanoma is the most serious type of skin cancer. It develops in the cells (melanocytes) that produce melanin — the pigment that gives your skin its color."
    },
    1: {
        "name": "eczema",
        "description": "Eczema is a condition that makes your skin red and itchy. It's common in children but can occur at any age. It is long lasting (chronic) and tends to flare periodically."
    },
    2: {
        "name": "psoriasis",
        "description": "Psoriasis is a skin disease that causes red, itchy scaly patches, most commonly on the knees, elbows, trunk and scalp."
    },
    3: {
        "name": "acne",
        "description": "Acne is a skin condition that occurs when your hair follicles become plugged with oil and dead skin cells. It causes whiteheads, blackheads or pimples."
    }
}

# Load the model globally
model = None

@app.on_event("startup")
async def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        try:
            print(f"Loading model from {MODEL_PATH}...")
            model = tf.keras.models.load_model(MODEL_PATH)
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print(f"Warning: Model not found at {MODEL_PATH}. Predictions will fail until a model is created.")

def preprocess_image(image_bytes):
    try:
        # Open image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        # Convert to RGB (in case of PNG with alpha channel)
        img = img.convert('RGB')
        # Resize to match model input
        img = img.resize(IMG_SIZE)
        # Convert to numpy array
        img_array = np.array(img)
        # Normalize pixel values to [0, 1] as done in training
        img_array = img_array.astype('float32') / 255.0
        # Expand dimensions to match batch shape (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    global model
    
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train or generate a model first.")

    # Validate file extension
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PNG, JPG, and JPEG files are supported.")

    try:
        # Read file content
        contents = await file.read()
        
        # Preprocess the image
        processed_image = preprocess_image(contents)
        
        # Make prediction
        predictions = model.predict(processed_image)
        
        # Get the predicted class index
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx]) * 100
        
        # Get disease info
        # Fallback to generic if class index is out of bounds for some reason
        disease_info = DISEASES.get(predicted_class_idx, {
            "name": f"Unknown Class ({predicted_class_idx})",
            "description": "No description available."
        })
        
        return JSONResponse(content={
            "prediction": disease_info["name"],
            "confidence": round(confidence, 2),
            "description": disease_info["description"]
        })
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during prediction: {str(e)}")
