import os
from ultralytics import YOLO
import cv2
import argparse

def test_model(image_path, model_path, output_dir='runs/test_results'):
    """
    Runs inference on a test image and saves the visualized result.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Load model
    print(f"Loading model: {model_path}")
    model = YOLO(model_path)
    
    # Run inference
    print(f"Running inference on: {image_path}")
    results = model(image_path)
    
    # Process results
    for i, r in enumerate(results):
        # Save the plotted image
        res_image = r.plot()  # Plots boxes and labels
        filename = os.path.basename(image_path)
        save_path = os.path.join(output_dir, f"val_{filename}")
        cv2.imwrite(save_path, res_image)
        
        print(f"Found {len(r.boxes)} objects.")
        print(f"Results saved to: {save_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test your trained YOLO model on an image.")
    parser.add_argument("--img", type=str, required=True, help="Path to test image")
    parser.add_argument("--model", type=str, default="runs/detect/prometheus_runs/baseline_model/weights/best.pt", help="Path to best.pt")
    
    args = parser.parse_args()
    test_model(args.img, args.model)
