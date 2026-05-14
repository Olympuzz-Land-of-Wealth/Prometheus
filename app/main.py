from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO
import cv2
import numpy as np
import io
from PIL import Image
import os

app = FastAPI(title="Prometheus Occupancy API")

# Load the best model
model_path = 'runs/detect/prometheus_runs/baseline_model/weights/best.pt'
if os.path.exists(model_path):
    model = YOLO(model_path)
else:
    print(f"Warning: {model_path} not found. Falling back to base model.")
    model = YOLO('yolov10s.pt')

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": "YOLOv10s"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    img_array = np.array(image)
    
    # Run inference
    results = model(img_array)
    
    detections = []
    person_count = 0
    machine_count = 0
    
    for r in results:
        for box in r.boxes:
            cls = int(box.cls[0])
            label = model.names[cls]
            conf = float(box.conf[0])
            
            if label == 'person': person_count += 1
            if label == 'gym-machine': machine_count += 1
            
            detections.append({
                "class": label,
                "confidence": conf,
                "bbox": box.xyxy[0].tolist()
            })
            
    return {
        "person_count": person_count,
        "machine_count": machine_count,
        "detections": detections
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
