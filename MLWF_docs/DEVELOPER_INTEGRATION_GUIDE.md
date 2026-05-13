# Prometheus Developer Integration Guide

This guide provides the necessary technical information for the development team to integrate the **Prometheus Occupancy Monitoring Model** into the final application ecosystem.

## 🚀 Overview
Prometheus is a computer vision service that uses a fine-tuned **YOLOv10s** model to detect human occupancy and gym equipment usage in real-time surveillance footage.

### Key Capabilities:
- **Real-time Detection**: 0: `person`, 1: `gym-machine`.
- **Privacy First**: Integrated Gaussian blurring for face anonymization (PDPA compliant).
- **Lightweight Inference**: Optimized for CPU/GPU deployment via FastAPI.

---

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **Inference Engine**: Ultralytics YOLOv10
- **Image Processing**: OpenCV, Pillow
- **Containerization**: Docker (Recommended)

---

## 📡 API Endpoints

### 1. Health Check
`GET /health`
- **Purpose**: Verify the API is running and the model weights are loaded.
- **Response**:
  ```json
  {
    "status": "healthy",
    "model": "YOLOv10s_Prometheus_Baseline"
  }
  ```

### 2. Image Prediction
`POST /predict`
- **Purpose**: Submit an image frame for object detection and occupancy counting.
- **Request**: `multipart/form-data` with a `file` field (JPG/PNG).
- **Success Response (JSON)**:
  ```json
  {
    "person_count": 3,
    "machine_count": 2,
    "detections": [
      {
        "class": "person",
        "confidence": 0.94,
        "bbox": [x1, y1, x2, y2]
      },
      {
        "class": "gym-machine",
        "confidence": 0.88,
        "bbox": [x1, y1, x2, y2]
      }
    ]
  }
  ```

---

## 🏗️ Implementation Workflow

### Step 1: Environment Setup
Ensure the following dependencies are installed in your production environment:
```bash
pip install fastapi uvicorn ultralytics opencv-python pillow
```

### Step 2: Running the Service
Start the FastAPI server using Uvicorn:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Step 3: Integrating with Frontend/Mobile
The frontend can consume the `/predict` endpoint to:
1. **Live Dashboard**: Update a real-time counter of gym occupancy.
2. **Heat Maps**: Use the `bbox` coordinates to visualize "busy zones" in the gym.
3. **Alerts**: Trigger notifications if occupancy exceeds a safe threshold.

---

## 📹 Video Processing
For processing continuous video streams (e.g., CCTV feeds), developers can utilize the `model/video_inference.py` utility. This script demonstrates how to:
- Open a stream via OpenCV.
- Process frames in batches.
- Overlay predictions for a "Live View" monitoring dashboard.

---

## 🔒 Privacy & Security (PDPA)
Prometheus is built with **Privacy by Design**. 
- **Requirement**: Any data transmitted for training or storage MUST be processed through the `pre-processing.py` script to ensure faces are blurred.
- **Compliance**: The model weights do not store individual identity data, only structural feature maps.

---

## ☁️ Deployment Recommendations
- **Cloud**: AWS SageMaker or Google Vertex AI for high-scalability.
- **Edge**: For low-latency, deploy the model on-site using an NVIDIA Jetson or a high-performance local server.
- **Docker**: (Recommended) Wrap the API in a Docker container to ensure environment consistency across dev, staging, and production.

---

**For technical support or weight updates, refer to the `model/runs/` directory in the repository.**
