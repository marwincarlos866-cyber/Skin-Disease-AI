import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

MODEL_SAVE_PATH = 'model/skin_disease_model.h5'
IMG_SIZE = (224, 224)

# We will assume 4 classes for the dummy model: melanoma, eczema, psoriasis, acne
NUM_CLASSES = 4

def create_dummy_model():
    print("Creating a dummy MobileNetV2 model for testing...")
    base_model = MobileNetV2(
        weights=None, # No need to download imagenet weights for a dummy model
        include_top=False, 
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)
    )

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    predictions = Dense(NUM_CLASSES, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print(f"Dummy model saved successfully to '{MODEL_SAVE_PATH}'")
    print("You can now start the backend and test the UI.")

if __name__ == '__main__':
    create_dummy_model()
