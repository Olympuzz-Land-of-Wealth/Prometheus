# Prometheus: Training Guide

This guide provides instructions for setting up the environment and training the **Computer Vision-Based Gym Machine Occupancy Detection** model.

## 1. Prerequisites
* **Python 3.10+**.
* **NVIDIA GPU** (Optional but recommended for faster training; the script defaults to CPU if unavailable).

## 2. Directory Overview (`/model`)
*   **`pre-processing.py`**: Extracts frames from videos and applies Gaussian blurring to faces for PDPA compliance.
*   **`auto_label.py`**: AI-assisted labeling tool that uses a pre-trained model to automatically detect and label people.
*   **`data_split.py`**: Utility to randomly split your annotated dataset into `train` and `val` sets.
*   **`train.py`**: The primary training script for YOLOv10 with MLflow integration and layer freezing.
*   **`experiment.py`**: A script for running multiple training versions (experiments) to compare hyperparameters.
*   **`data/`**: Contains configuration files (`.yml`) and dataset storage.

## 3. Environment Setup
Clone the repository and navigate to the project root, then run the following:
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install opencv-python ultralytics mlflow shap
```

## 4. Data Preparation Workflow

### Step 1: Frame Extraction & Anonymization
Run the pre-processing script on your raw video folder.
```bash
python model/pre-processing.py --input data/raw_videos --output model/data/raw_frames --interval 30
```

### Step 2: AI-Assisted Auto-Labeling
Automatically generate "person" labels to reduce manual work by 50%.
```bash
python model/auto_label.py --img_dir model/data/raw_frames --out_dir model/data/labels_raw
```

### Step 3: Manual Verification (LabelImg)
1. Launch `labelImg`.
2. Open Dir: `model/data/raw_frames` | Change Save Dir: `model/data/labels_raw`.
3. Verify the "person" boxes and manually annotate `gym-machine` (Class 1).

### Step 4: Dataset Splitting
Partition your data for training.
```bash
python model/data_split.py --img_dir model/data/raw_frames --lbl_dir model/data/labels_raw --output model/data/final_dataset
```

## 5. Training the Model
We use **YOLOv10s** with transfer learning (first 10 layers frozen).

```bash
python model/train.py --data model/data/tiny_test_data.yml --epochs 50 --batch 16 --device cpu
```

## 6. Monitoring & Targets
Run `mlflow ui` to track progress. Our project targets are:
* **mAP@0.5**: $\ge 0.85$
* **State Accuracy**: $\ge 95\%$

---
### Windows Note
The scripts include a `pathlib` URI fix to ensure MLflow correctly handles Windows absolute paths (resolving common `KeyError: 'c'` errors).