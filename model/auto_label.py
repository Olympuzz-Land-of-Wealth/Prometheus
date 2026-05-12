import os
from ultralytics import YOLO
import argparse
import pathlib

def auto_label(image_root, label_root, model_path='yolov10s.pt', confidence=0.3):
    """
    Uses a pre-trained YOLO model to auto-label 'person' instances recursively.
    """
    model = YOLO(model_path)
    PERSON_CLASS_ID = 0
    
    # Supported image extensions
    exts = ('.jpg', '.jpeg', '.png')
    
    # Find all images recursively
    image_paths = []
    for root, dirs, files in os.walk(image_root):
        for f in files:
            if f.lower().endswith(exts):
                image_paths.append(os.path.join(root, f))
    
    print(f"Auto-labeling {len(image_paths)} images found in {image_root}...")

    for img_path in image_paths:
        # Determine relative path to maintain folder structure
        rel_path = os.path.relpath(img_path, image_root)
        label_rel_path = os.path.splitext(rel_path)[0] + '.txt'
        label_full_path = os.path.join(label_root, label_rel_path)
        
        # Create subdirectories in labels folder if they don't exist
        os.makedirs(os.path.dirname(label_full_path), exist_ok=True)
        
        # Run inference
        results = model(img_path, conf=confidence, verbose=False)
        
        with open(label_full_path, 'w') as f:
            for r in results:
                for box in r.boxes:
                    cls = int(box.cls[0])
                    if cls == PERSON_CLASS_ID:
                        xywh = box.xywhn[0].tolist()
                        f.write(f"0 {xywh[0]:.6f} {xywh[1]:.6f} {xywh[2]:.6f} {xywh[3]:.6f}\n")
    
    print(f"Auto-labeling complete. Labels saved to {label_root}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-label people in images recursively.")
    parser.add_argument("--img_dir", type=str, required=True, help="Root directory of frames")
    parser.add_argument("--out_dir", type=str, required=True, help="Root directory to save labels")
    parser.add_argument("--conf", type=float, default=0.3, help="Detection confidence threshold")
    
    args = parser.parse_args()
    auto_label(args.img_dir, args.out_dir, confidence=args.conf)
