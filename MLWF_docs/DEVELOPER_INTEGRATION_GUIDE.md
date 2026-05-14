# Prometheus Developer Integration Guide

This guide provides the necessary technical information for the development team to integrate the **Prometheus Occupancy Monitoring Model**.

## 📦 Model Weights Setup
**CRITICAL**: Model weights are large binary files and are excluded from Git. 
To run this project, you must:
1. Download the `best.pt` weights from the project's shared [Google Drive](https://drive.google.com/drive/folders/1HiXmNj4WQiZqHzbxK-c5klAOoRYYGKGn?usp=sharing).
2. Create the following directory path: `runs/detect/prometheus_runs/baseline_model/weights/`
3. Place the `best.pt` file into that folder.

The API and notebooks are pre-configured to look in this exact location.

---

## 🚀 Overview
Prometheus is a computer vision service that uses a fine-tuned **YOLOv10s** model to detect human occupancy and gym equipment usage.

### Key Capabilities:
- **Real-time Detection**: 0: `person`, 1: `gym-machine`.
- **Privacy First**: Integrated Gaussian blurring for face anonymization (PDPA compliant).
- **Lightweight Inference**: Optimized for CPU/GPU deployment via FastAPI.

---

## 🛠️ Tech Stack & Installation
1. Ensure you have Python 3.10+ installed.
2. Clone the repository and install dependencies:
```bash
pip install -r requirements.txt
```

---

## 📡 API Endpoints

### 1. Health Check (`GET /health`)
- **Response**: `{ "status": "healthy", "model": "Prometheus_v1" }`

### 2. Image Prediction (`POST /predict`)
- **Request**: `multipart/form-data` with a `file` field.
- **Success Response**: Returns a JSON object with `person_count`, `machine_count`, and bounding box coordinates.

---

## 🏗️ Implementation Workflow
The frontend can consume the `/predict` endpoint to:
1. **Live Dashboard**: Update a real-time counter of gym occupancy.
2. **Heat Maps**: Use the `bbox` coordinates to visualize "busy zones".
3. **Alerts**: Trigger notifications if occupancy exceeds a safe threshold.

---

## 🔒 Privacy & Security (PDPA)
Prometheus is built with **Privacy by Design**. Any data transmitted for training or storage MUST be processed through the `pre-processing.py` script to ensure faces are blurred.

---

## ☁️ Deployment Recommendations
- **Docker**: (Recommended) Use a container to ensure environment consistency.
- **Cloud**: AWS SageMaker or Google Vertex AI for high-scalability.
