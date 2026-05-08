import cv2
import os
import argparse

def extract_frames(video_path: str, output_dir: str, frame_interval: int = 30) -> None:
    """
    Extracts frames from a video file for dataset creation.
    """
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path}")
        return

    frame_count = 0
    saved_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % frame_interval == 0:
            frame_name = os.path.join(output_dir, f"frame_{saved_count:04d}.jpg")
            cv2.imwrite(frame_name, frame)
            saved_count += 1
            
        frame_count += 1
        
    cap.release()
    print(f"Data Prep Complete: Extracted {saved_count} frames to {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract frames from CCTV footage.")
    parser.add_argument("--video", type=str, required=True, help="Path to raw video file")
    parser.add_argument("--output", type=str, default="../data/processed_frames", help="Output directory")
    parser.add_argument("--interval", type=int, default=30, help="Frame extraction interval")
    
    args = parser.parse_args()
    extract_frames(args.video, args.output, args.interval)