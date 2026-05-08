# Prometheus: Training Guide

This guide provides instructions for setting up the environment and training the **Computer Vision-Based Gym Machine Occupancy Detection** model.

## 1. Prerequisites

* 
**Python 3.10+**.


* 
**NVIDIA GPU** (Optional but recommended for faster training; the script defaults to CPU if unavailable).



## 2. Environment Setup

Clone the repository and navigate to the project root, then run the following:

```bash
# Create a virtual environment
python -m venv venv

# Activate the environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install opencv-python ultralytics mlflow

```

## 3. Data Preparation

Before training, you must extract and anonymize frames from the CCTV footage to comply with PDPA.

### Step 1: Frame Extraction & Anonymization

Run the pre-processing script to extract frames and automatically blur faces.

```bash
python model/pre-processing.py --video model/data/your_video.mp4 --output model/data/test_frames --interval 30

```

### Step 2: Labeling

1. Launch the labeling tool: `labelImg`.
2. Set the save format to **YOLO**.
3. Annotate boxes for `person` (Index 0) and `gym-machine` (Index 1).


4. Organize your files into the following structure:
* `model/data/test_frames/images/train/`
* `model/data/test_frames/labels/train/`



## 4. Training the Model

We use **YOLOv10s** for an optimal balance between inference speed and accuracy.

### Run Training

Execute the training script. This script is integrated with **MLflow** to track experiments and metrics like **mAP@0.5** and **State Accuracy**.

```bash
python model/train.py --data model/data/tiny_test_data.yml --epochs 50 --batch 16 --device cpu

```

*Change `--device cpu` to `--device 0` if an NVIDIA GPU is available.*

## 5. Monitoring Results

Once training begins, you can monitor the model's progress in real-time.

1. In a new terminal, activate the `venv` and run:
```bash
mlflow ui

```


2. Open `http://localhost:5000` in your browser.


3. Check the **Prometheus_Occupancy_Detection** experiment to view:
* 
**Loss Curves** (Box, Class, DFL).


* 
**mAP@0.5** (Target: $\ge 0.85$).


* 
**State Accuracy** (Target: $\ge 95\%$).





## 6. Project Configuration (`tiny_test_data.yml`)

Ensure your YAML file points to the correct local paths:

```yaml
path: ./model/data/test_frames
train: images/train
val: images/val

names:
  0: person
  1: gym-machine

```

---

### Implementation Note for Windows Users

If you encounter a `KeyError: 'c'` or `UnsupportedModelRegistryStoreURIException`, ensure your `train.py` uses the `pathlib` URI fix to handle Windows file paths correctly when communicating with MLflow.