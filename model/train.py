import argparse
from ultralytics import YOLO
import mlflow

def train_model(data_yaml: str, epochs: int, batch_size: int) -> None:
    """
    Trains the YOLO model and logs parameters/metrics to MLflow.
    """
    # Initialize MLflow tracking
    mlflow.set_experiment("Prometheus_Occupancy_Detection")

    # Load a pre-trained YOLOv10 model (YOLOv10s for local inference speed)
    model = YOLO('yolov10s.pt') 

    with mlflow.start_run(run_name="YOLOv10s_Baseline"):
        print(f"Starting training loop with {epochs} epochs...")
        
        # Train the model
        results = model.train(
            data=data_yaml,
            epochs=epochs,
            imgsz=640,
            batch=batch_size,
            device='0', # Ensure you have CUDA setup, otherwise switch to 'cpu'
            project='prometheus_runs',
            name='baseline_model'
        )
        
        # Log hyperparameters for Task B-4 documentation
        mlflow.log_param("model_type", "YOLOv10s")
        mlflow.log_param("epochs", epochs)
        mlflow.log_param("batch_size", batch_size)
        
        print("Training complete. Results saved to prometheus_runs/")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv10 for Machine Occupancy.")
    parser.add_argument("--data", type=str, default="../data/gym_data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Training batch size")
    
    args = parser.parse_args()
    train_model(args.data, args.epochs, args.batch)