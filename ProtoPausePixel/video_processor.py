"""
Video Processing Service for PausePixel.
Handles frame extraction using OpenCV in background worker threads with progress tracking.
"""
import os
import cv2
import traceback
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Any
from db import update_job, add_screenshot

# Worker pool for background video processing
executor = ThreadPoolExecutor(max_workers=3)
# Active job cancellation flags
cancellation_flags: Dict[str, bool] = {}

def process_video_task(
    job_id: str,
    video_path: str,
    output_folder: str,
    start_time: float = 0.0,
    end_time: Optional[float] = None,
    interval: float = 1.0,
    folder_name: str = ""
):
    """
    Background worker task to extract screenshots from video.
    """
    cancellation_flags[job_id] = False
    
    try:
        update_job(job_id, {"status": "processing", "progress": 0})
        
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("OpenCV could not open the video file. File might be corrupted or format unsupported.")
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Handle invalid/variable FPS
        if not fps or fps <= 0 or fps > 240:
            fps = 30.0
            
        duration = total_frames / fps if total_frames > 0 else 0.0
        
        start_frame = max(0, int(start_time * fps))
        if end_time and end_time > 0:
            end_frame = min(total_frames, int(end_time * fps))
        else:
            end_frame = total_frames
            
        if start_frame >= end_frame:
            raise ValueError(f"Start time ({start_time}s) must be less than end time ({end_time or duration:.1f}s).")
            
        frame_interval = max(1, int(round(interval * fps)))
        target_span = max(1, end_frame - start_frame)
        
        update_job(job_id, {
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "duration": round(duration, 2),
            "start_time": round(start_time, 2),
            "end_time": round(end_frame / fps, 2),
            "interval": round(interval, 2)
        })
        
        os.makedirs(output_folder, exist_ok=True)
        
        saved = 0
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        
        last_progress_update = 0
        
        while cap.isOpened():
            if cancellation_flags.get(job_id, False):
                update_job(job_id, {
                    "status": "cancelled",
                    "error_message": "Job cancelled by user."
                })
                break
                
            current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
            if current_frame > end_frame:
                break
                
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_offset = current_frame - start_frame
            if frame_offset >= 0 and frame_offset % frame_interval == 0:
                saved += 1
                img_filename = f"ss_{saved}.jpg"
                img_path = os.path.join(output_folder, img_filename)
                
                # Write screenshot image
                cv2.imwrite(img_path, frame)
                
                timestamp_sec = round(current_frame / fps, 2)
                screenshot_url = f"/static/screenshots/{folder_name}/{img_filename}"
                add_screenshot(job_id, img_filename, current_frame, timestamp_sec, screenshot_url)
                
            # Calculate and update progress
            progress_pct = min(99, int((current_frame - start_frame) / target_span * 100))
            if progress_pct - last_progress_update >= 2 or current_frame >= end_frame:
                update_job(job_id, {
                    "progress": progress_pct,
                    "current_frame": current_frame,
                    "saved_count": saved
                })
                last_progress_update = progress_pct
                
        cap.release()
        
        if not cancellation_flags.get(job_id, False):
            update_job(job_id, {
                "status": "completed",
                "progress": 100,
                "saved_count": saved,
                "current_frame": end_frame
            })
            
    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        update_job(job_id, {
            "status": "failed",
            "error_message": error_msg
        })
    finally:
        cancellation_flags.pop(job_id, None)
        # Clean up temporary uploaded video file
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
        except Exception:
            pass

def start_video_processing(
    job_id: str,
    video_path: str,
    output_folder: str,
    start_time: float,
    end_time: Optional[float],
    interval: float,
    folder_name: str
):
    """Submits the video extraction task to the background thread pool."""
    executor.submit(
        process_video_task,
        job_id,
        video_path,
        output_folder,
        start_time,
        end_time,
        interval,
        folder_name
    )

def cancel_job(job_id: str) -> bool:
    """Signals an ongoing job to terminate."""
    if job_id in cancellation_flags:
        cancellation_flags[job_id] = True
        return True
    return False
