# Prometheus Data Preparation Workflow

This guide outlines the steps to prepare your dataset and start training for the Prometheus project.

## 1. Batch Pre-processing
Place all your raw videos into a folder (e.g., `model/data/raw_videos`). Use `pre-processing.py` to extract frames and apply face blurring for PDPA compliance.

**Command:**
```powershell
python model/pre-processing.py --input model/data/raw_videos --output model/data/raw_frames --interval 30
```
*   `--input`: Path to your folder containing video files.
*   `--output`: Directory where anonymized frames will be stored.

## 2. AI-Assisted Auto-Labeling
Instead of drawing every box from scratch, use the AI to do the "person" boxes for you. This significantly speeds up the process.

**Command:**
```powershell
python model/auto_label.py --img_dir model/data/raw_frames --out_dir model/data/labels_raw
```
*   **Why this helps**: 
    - **Saves ~50% of the work**: You don't have to draw boxes for people, which are usually the most common objects in your footage.
    - **Consistency**: The AI is very good at identifying human silhouettes, so your base labels will be very consistent.
*   **Result**: Creates `.txt` files in `labels_raw` with all detected persons (Class 0).

## 3. Manual Annotation & Verification
Use **LabelImg** to verify the auto-labels and add gym machinery.
1.  **Launch**: Run `labelImg` from your terminal.
2.  **Open Directory**: Select `model/data/raw_frames`.
3.  **Save Directory**: Select `model/data/labels_raw`.
4.  **Process**:
    - The "person" boxes will already be there! 
    - You only need to quickly **verify** them and draw the boxes for the **`gym-machine`** (Class 1).
    - Press `Ctrl+S` to save each frame.
    - *Tip: Use the 'A' and 'D' keys to quickly navigate between images.*

## 4. Automated Dataset Splitting (`data_split.py`)
Organize your verified images and labels into the Train/Val structure required for YOLOv10.

**Command:**
```powershell
python model/data_split.py --img_dir model/data/raw_frames --lbl_dir model/data/labels_raw --output model/data/final_dataset --ratio 0.8
```

## 5. Model Training
Update your `data.yaml` and start the training loop.

**Command:**
```powershell
python model/train.py --data model/data/tiny_test_data.yml --epochs 50 --batch 16
```

---
> [!TIP]
> **Auto-Labeling Tip**: If the auto-labeler is missing too many people, try lowering the confidence threshold: `--conf 0.2`.
