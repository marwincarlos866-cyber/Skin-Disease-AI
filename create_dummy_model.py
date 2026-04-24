"""
Create Dummy Model for Testing
==============================
This script creates a simple dummy model so you can test the
frontend and backend without training on real data.

Run this if you want to quickly test the UI/API pipeline:
    python model/create_dummy_model.py
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.models import Model

def create_dummy_model():
    """Create and save a dummy model with 5 classes for testing."""
    
    print("Creating dummy model for testing...")
    
    # Build same architecture as training script
    base_model = MobileNetV2(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    predictions = Dense(5, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    # Save model
    os.makedirs('model', exist_ok=True)
    model.save('model/skin_disease_model.h5')
    print("✅ Dummy model saved to: model/skin_disease_model.h5")
    
    # Save class indices
    class_indices = {
        'acne': 0,
        'eczema': 1,
        'melanoma': 2,
        'psoriasis': 3,
        'normal': 4
    }
    np.save('model/class_indices.npy', class_indices)
    print("✅ Class indices saved to: model/class_indices.npy")
    
    print("\n🎉 You can now test the full pipeline!")
    print("1. Start backend: python backend/app.py")
    print("2. Open frontend/index.html in browser")
    print("\n⚠️  Note: This is a randomly initialized model.")
    print("   Predictions will be random. Train with real data for accurate results.")

if __name__ == "__main__":
    create_dummy_model()

