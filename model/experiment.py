import mlflow
from ultralytics import YOLO
import os
import pathlib

def run_experiment(name, params):
    mlflow_tracking_path = pathlib.Path(os.getcwd()) / "mlruns"
    mlflow.set_tracking_uri(mlflow_tracking_path.as_uri())
    mlflow.set_experiment("Prometheus_Experimentation")
    
    with mlflow.start_run(run_name=name):
        model = YOLO('yolov10s.pt')
        
        # Log parameters
        mlflow.log_params(params)
        
        # Train
        results = model.train(
            data='model/data/tiny_test_data.yml',
            epochs=params.get('epochs', 2),
            imgsz=params.get('imgsz', 640),
            batch=16,
            device='cpu',
            project='prometheus_runs',
            name=name,
            freeze=10 # Transfer learning alignment
        )
        
        # Log metrics (manually or via autolog)
        # YOLOv10 results are automatically logged if mlflow is installed
        print(f"Finished experiment: {name}")

if __name__ == "__main__":
    # Experiment 1: Baseline
    run_experiment("Baseline_v1", {"epochs": 2, "imgsz": 640})
    
    # Experiment 2: Higher Resolution
    run_experiment("HighRes_v2", {"epochs": 2, "imgsz": 800})
    
    # Experiment 3: Low Epochs (Fast test)
    run_experiment("QuickTest_v3", {"epochs": 1, "imgsz": 640})
