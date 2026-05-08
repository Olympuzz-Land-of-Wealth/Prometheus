import cv2
import os
import argparse

def blur_faces(image):
    """
    Detects and blurs faces in a single frame to ensure PDPA compliance.
    """
    # Load the pre-trained Haar Cascade face detector
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # Convert to grayscale for detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    for (x, y, w, h) in faces:
        # Select the face ROI
        face_roi = image[y:y+h, x:x+w]
        # Apply a strong Gaussian blur
        blurred_face = cv2.GaussianBlur(face_roi, (99, 99), 30)
        # Put the blurred face back into the original image
        image[y:y+h, x:x+w] = blurred_face
        
    return image

def extract_frames(video_path: str, output_dir: str, frame_interval: int = 30, apply_blur: bool = True) -> None:
    """
    Extracts frames from a video file and blurs faces for privacy.
    """
    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path}")
        return

    frame_count = 0
    saved_count = 0
    
    print(f"Processing video: {video_path}...")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % frame_interval == 0:
            # Apply privacy blurring
            if apply_blur:
                frame = blur_faces(frame)
                
            frame_name = os.path.join(output_dir, f"frame_{saved_count:04d}.jpg")
            cv2.imwrite(frame_name, frame)
            saved_count += 1
            
        frame_count += 1
        
    cap.release()
    print(f"Data Prep Complete: Extracted {saved_count} anonymized frames to {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract and anonymize frames from CCTV footage.")
    parser.add_argument("--video", type=str, required=True, help="Path to raw video file")
    parser.add_argument("--output", type=str, default="model/data/test_frames", help="Output directory")
    parser.add_argument("--interval", type=int, default=30, help="Frame extraction interval")
    parser.add_argument("--noblur", action="store_false", dest="apply_blur", help="Disable face blurring")
    
    args = parser.parse_args()
    extract_frames(args.video, args.output, args.interval, args.apply_blur)