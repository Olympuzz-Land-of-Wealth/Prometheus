import os
import random
import shutil
import argparse

def split_dataset(image_root, label_root, output_root, split_ratio=0.8):
    """
    Splits images and labels into train and val sets for YOLO training,
    supporting recursive directory structures.
    """
    # Create target directories
    for subset in ['train', 'val']:
        os.makedirs(os.path.join(output_root, 'images', subset), exist_ok=True)
        os.makedirs(os.path.join(output_root, 'labels', subset), exist_ok=True)

    # Find all images recursively
    exts = ('.jpg', '.jpeg', '.png')
    image_paths = []
    for root, dirs, files in os.walk(image_root):
        for f in files:
            if f.lower().endswith(exts):
                image_paths.append(os.path.join(root, f))
                
    random.shuffle(image_paths)

    split_idx = int(len(image_paths) * split_ratio)
    train_paths = image_paths[:split_idx]
    val_paths = image_paths[split_idx:]

    def move_files(paths, subset):
        for img_path in paths:
            # Determine unique filename to avoid collisions if multiple videos have 'frame_0001.jpg'
            # We'll use the relative path as part of the filename
            rel_path = os.path.relpath(img_path, image_root)
            flat_name = rel_path.replace(os.sep, '_')
            
            # Copy Image
            shutil.copy(img_path, os.path.join(output_root, 'images', subset, flat_name))
            
            # Find matching label
            rel_label_path = os.path.splitext(rel_path)[0] + '.txt'
            src_label = os.path.join(label_root, rel_label_path)
            
            if os.path.exists(src_label):
                dest_label_name = os.path.splitext(flat_name)[0] + '.txt'
                shutil.copy(src_label, os.path.join(output_root, 'labels', subset, dest_label_name))

    print(f"Splitting {len(image_paths)} files from nested directories...")
    move_files(train_paths, 'train')
    move_files(val_paths, 'val')
    print(f"Dataset split complete: {len(train_paths)} train, {len(val_paths)} val.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Split images and labels into train/val sets recursively.")
    parser.add_argument("--img_dir", type=str, required=True, help="Root directory containing all images")
    parser.add_argument("--lbl_dir", type=str, required=True, help="Root directory containing all labels")
    parser.add_argument("--output", type=str, default="model/data/processed", help="Root directory for split data")
    parser.add_argument("--ratio", type=float, default=0.8, help="Train/Val split ratio")

    args = parser.parse_args()
    split_dataset(args.img_dir, args.lbl_dir, args.output, args.ratio)
