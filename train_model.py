import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ----------------------------
# 1. Configuration
# ----------------------------
DATASET_DIR = 'dataset'
MODEL_SAVE_PATH = 'model/skin_disease_model.h5'
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

# Note: Ensure your dataset directory is structured like this:
# dataset/
# ├── melanoma/
# │   ├── img1.jpg
# │   └── img2.jpg
# ├── eczema/
# │   ├── img1.jpg
# │   └── img2.jpg
# └── ...

def main():
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory '{DATASET_DIR}' not found.")
        print("Please create the directory and organize your images into class subfolders.")
        return

    # ----------------------------
    # 2. Data Preparation
    # ----------------------------
    print("Preparing data generators...")
    datagen = ImageDataGenerator(
        rescale=1./255,           # Normalize pixel values
        rotation_range=20,        # Data augmentation
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        validation_split=0.2      # 20% for validation
    )

    train_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    val_generator = datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )

    num_classes = len(train_generator.class_indices)
    print(f"Found {num_classes} classes: {list(train_generator.class_indices.keys())}")
    
    if num_classes == 0:
        print("Error: No classes found. Please ensure there are subdirectories with images in the dataset folder.")
        return

    # ----------------------------
    # 3. Model Building (Transfer Learning)
    # ----------------------------
    print("Building model using MobileNetV2 base...")
    base_model = MobileNetV2(
        weights='imagenet', 
        include_top=False, 
        input_shape=(IMG_SIZE[0], IMG_SIZE[1], 3)
    )

    # Freeze the base model layers
    base_model.trainable = False

    # Add custom head for our specific classes
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # ----------------------------
    # 4. Training
    # ----------------------------
    print("Starting training...")
    history = model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=EPOCHS
    )

    # ----------------------------
    # 5. Save Model
    # ----------------------------
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved successfully to '{MODEL_SAVE_PATH}'")

if __name__ == '__main__':
    main()
