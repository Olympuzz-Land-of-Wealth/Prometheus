import argparse
from ultralytics import YOLO
import mlflow
import os
import pathlib

def train_model(data_yaml: str, epochs: int, batch_size: int, device: str) -> None:
    """
    Trains the YOLO model and logs parameters/metrics to MLflow.
    """
    # 1. Create a clean, absolute path for MLflow storage
    mlflow_tracking_path = pathlib.Path(os.getcwd()) / "mlruns"
    # 2. Force the URI to use the 'file://' prefix which Windows needs
    tracking_uri = mlflow_tracking_path.as_uri()
    
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_experiment("Prometheus_Occupancy_Detection")

    # Load a pre-trained YOLOv10 model (YOLOv10s for local inference speed)
    model = YOLO('yolov10s.pt') 

    os.environ["REPORT_TO"] = "none"

    with mlflow.start_run(run_name="YOLOv10s_Baseline"):
        print(f"Starting training loop with {epochs} epochs...")
        
        # Train the model
        results = model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=640,
            batch=batch_size,
            device=device, # Ensure you have CUDA setup, otherwise switch to 'cpu'
            project='prometheus_runs',
            name='baseline_model',
            freeze=10 # Transfer learning: freeze first 10 layers
        )
        
        # Log hyperparameters for Task B-4 documentation
        mlflow.log_param("model_type", "YOLOv10s")
        mlflow.log_param("epochs", epochs)
        mlflow.log_param("batch_size", batch_size)
        
        print("Training complete. Results saved to prometheus_runs/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv10 for Machine Occupancy.")
    parser.add_argument("--data", type=str, default="model/data/tiny_test_data.yml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Training batch size")
    # ADD THIS LINE:
    parser.add_argument("--device", type=str, default="cpu", help="Device to use (cpu, 0, etc.)")
    
    args = parser.parse_args()
    # UPDATE THIS LINE to pass the device:
    train_model(args.data, args.epochs, args.batch, args.device)