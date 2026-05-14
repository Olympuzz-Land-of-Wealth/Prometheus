import cv2
import argparse
import os
from ultralytics import YOLO

def process_video(source, model_path, output_path=None):
    """
    Reads a video, runs YOLO inference, and saves the video with overlaid detections.
    """
    # 1. Load Model
    model = YOLO(model_path)
    
    # 2. Open Video
    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print(f"Error: Could not open video {source}")
        return

    # Get video properties
    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap.get(cv2.CAP_PROP_FPS)
    
    if output_path is None:
        filename = os.path.basename(source)
        output_path = f"processed_{filename}"

    # 3. Setup Video Writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    print(f"Processing video: {source}")
    print(f"Saving results to: {output_path}")

    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Run inference on the frame
        results = model(frame, verbose=False)
        
        # Plot the detections on the frame
        annotated_frame = results[0].plot()
        
        # Write the frame
        out.write(annotated_frame)
        
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"Processed {frame_count} frames...")

    # Release everything
    cap.release()
    out.release()
    print(f"Done! Total frames processed: {frame_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Prometheus YOLO on a video file.")
    parser.add_argument("--source", type=str, required=True, help="Path to input video")
    parser.add_argument("--model", type=str, default="runs/detect/prometheus_runs/baseline_model/weights/best.pt", help="Path to best.pt")
    parser.add_argument("--out", type=str, default=None, help="Output video path")

    args = parser.parse_args()
    process_video(args.source, args.model, args.out)
