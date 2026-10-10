"""
PausePixel - Full-Stack Video Screenshot Extractor
Flask backend providing RESTful API, asynchronous video processing,
database persistence, and legacy web routes.
"""
import os
import uuid
import shutil
import platform
import subprocess
from flask import (
    Flask, render_template, request, jsonify, 
    send_file, redirect, url_for
)
from werkzeug.utils import secure_filename

from db import (
    init_db, create_job, get_job, get_job_by_folder, 
    get_job_screenshots, get_recent_jobs
)
from video_processor import start_video_processing, cancel_job

app = Flask(__name__)

# Base storage paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
SCREENSHOT_FOLDER = os.path.join(BASE_DIR, 'static', 'screenshots')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SCREENSHOT_FOLDER'] = SCREENSHOT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1GB max file upload

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOT_FOLDER, exist_ok=True)

# Initialize database schema
init_db()

ALLOWED_EXTENSIONS = {'mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v', '3gp'}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ==========================================
# Frontend Page Routes
# ==========================================

@app.route('/')
def index():
    recent_jobs = get_recent_jobs(limit=6)
    return render_template('index.html', recent_jobs=recent_jobs)

@app.route('/screenshots/<folder>')
def view_screenshots(folder):
    """
    Renders the UI viewing a specific folder's screenshots.
    Works for both traditional URL routing and direct links.
    """
    folder_path = os.path.join(app.config['SCREENSHOT_FOLDER'], folder)
    if not os.path.exists(folder_path):
        return render_template('error.html', message=f"Screenshots folder '{folder}' was not found."), 404
        
    job = get_job_by_folder(folder)
    screenshots = []
    
    if job:
        db_screenshots = get_job_screenshots(job['id'])
        screenshots = [s['filename'] for s in db_screenshots]
        
    if not screenshots:
        # Fallback to direct directory listing
        files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        try:
            files.sort(key=lambda x: int(x.split('_')[1].split('.')[0]))
        except Exception:
            files.sort()
        screenshots = files

    recent_jobs = get_recent_jobs(limit=6)
    return render_template(
        'index.html', 
        screenshots=screenshots, 
        folder=folder, 
        job=job,
        recent_jobs=recent_jobs
    )

# ==========================================
# REST API Endpoints
# ==========================================

@app.route('/error')
def error_page():
    error_type = request.args.get('type', 'no_video')
    message = request.args.get('message', '')
    if not message:
        if error_type == 'no_video':
            message = "No video uploaded! At least give me something to work with. Duh!! 😐"
        elif error_type == 'invalid_timing':
            message = "Invalid timing inputs! What are these numbers even supposed to mean? 🤨"
        else:
            message = "Something went wrong with your extraction request."
    return render_template('error.html', error_type=error_type, message=message), 400

@app.route('/api/jobs', methods=['POST'])
def api_create_job():
    """
    API endpoint: accepts video upload + timing parameters,
    creates background extraction job, and returns job metadata.
    """
    if 'video' not in request.files:
        return jsonify({
            "error": "No video uploaded! At least give me something to work with. Duh!! 😐",
            "error_type": "no_video",
            "image": "/static/assets/mb_mock.png"
        }), 400
        
    video = request.files['video']
    if not video or video.filename == '':
        return jsonify({
            "error": "No video uploaded! At least give me something to work with. Duh!! 😐",
            "error_type": "no_video",
            "image": "/static/assets/mb_mock.png"
        }), 400
        
    if not allowed_file(video.filename):
        return jsonify({
            "error": f"Unsupported video format. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            "error_type": "invalid_format",
            "image": "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
        }), 400

    interval_str = request.form.get('interval', '1.0')
    start_time_str = request.form.get('start_time', '0')
    end_time_str = request.form.get('end_time', '')

    try:
        interval = float(interval_str) if interval_str else 1.0
        if interval <= 0:
            return jsonify({
                "error": "Capture interval must be greater than 0.",
                "error_type": "invalid_timing",
                "image": "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
            }), 400
            
        start_time = float(start_time_str) if start_time_str else 0.0
        if start_time < 0:
            return jsonify({
                "error": "Start time cannot be negative.",
                "error_type": "invalid_timing",
                "image": "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
            }), 400
            
        end_time = float(end_time_str) if end_time_str else None
        if end_time is not None and end_time <= start_time:
            return jsonify({
                "error": "End time must be greater than start time.",
                "error_type": "invalid_timing",
                "image": "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
            }), 400
    except ValueError:
        return jsonify({
            "error": "Invalid numerical timing inputs provided.",
            "error_type": "invalid_timing",
            "image": "/static/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png"
        }), 400

    # Generate unique ID and folder
    job_id = str(uuid.uuid4())
    safe_name = secure_filename(video.filename)
    base_name = os.path.splitext(safe_name)[0] or "video"
    folder_name = f"{base_name}_{job_id[:8]}"
    
    # Save video temporarily with unique prefix
    temp_video_filename = f"{job_id}_{safe_name}"
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_video_filename)
    video.save(video_path)

    output_folder = os.path.join(app.config['SCREENSHOT_FOLDER'], folder_name)

    # Insert initial job into DB
    create_job({
        "id": job_id,
        "folder_name": folder_name,
        "original_filename": safe_name,
        "status": "pending",
        "progress": 0,
        "start_time": start_time,
        "end_time": end_time if end_time else 0.0,
        "interval": interval
    })

    # Start background thread execution
    start_video_processing(
        job_id=job_id,
        video_path=video_path,
        output_folder=output_folder,
        start_time=start_time,
        end_time=end_time,
        interval=interval,
        folder_name=folder_name
    )

    return jsonify({
        "message": "Video accepted for processing.",
        "job_id": job_id,
        "folder_name": folder_name,
        "status": "pending"
    }), 202

@app.route('/api/jobs/<job_id>', methods=['GET'])
def api_get_job(job_id):
    """Fetches job status, progress, frame statistics, and error information."""
    job = get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found."}), 404
    return jsonify(job), 200

@app.route('/api/jobs/<job_id>/screenshots', methods=['GET'])
def api_get_job_screenshots(job_id):
    """Fetches all screenshots extracted for a given job."""
    job = get_job(job_id)
    if not job:
        return jsonify({"error": "Job not found."}), 404
        
    screenshots = get_job_screenshots(job_id)
    return jsonify({
        "job_id": job_id,
        "folder_name": job['folder_name'],
        "count": len(screenshots),
        "screenshots": screenshots
    }), 200

@app.route('/api/jobs/<job_id>/cancel', methods=['POST'])
def api_cancel_job(job_id):
    """Cancels a currently executing video processing job."""
    success = cancel_job(job_id)
    return jsonify({"job_id": job_id, "cancelled": success}), 200

@app.route('/api/recent', methods=['GET'])
def api_recent_jobs():
    """Returns a list of recent extraction sessions."""
    recent = get_recent_jobs(limit=8)
    return jsonify({"recent_jobs": recent}), 200


# ==========================================
# Legacy & Form Compatibility Routes
# ==========================================

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Standard HTML form POST handler.
    Checks if client requested JSON; if so, delegates to api_create_job.
    Otherwise, processes or queues the job and redirects.
    """
    if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest' or 'application/json' in request.headers.get('Accept', ''):
        return api_create_job()
        
    video = request.files.get('video')
    interval = request.form.get('interval')
    start_time = request.form.get('start_time')
    end_time = request.form.get('end_time')

    if not video or video.filename == "":
        return render_template("error.html", error_type="no_video", message="No video uploaded! At least give me something to work with. Duh!! 😐"), 400

    if not allowed_file(video.filename):
        return render_template("error.html", error_type="invalid_format", message=f"Unsupported video format. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"), 400

    interval_val = 1.0
    if interval:
        try:
            interval_val = float(interval)
            if interval_val <= 0:
                raise ValueError()
        except ValueError:
            return render_template("error.html", error_type="invalid_timing", message="Capture interval must be a valid positive number."), 400

    start_val = 0.0
    if start_time:
        try:
            start_val = float(start_time)
            if start_val < 0:
                raise ValueError()
        except ValueError:
            return render_template("error.html", error_type="invalid_timing", message="Start time must be a non-negative number."), 400

    end_val = None
    if end_time:
        try:
            end_val = float(end_time)
            if end_val <= start_val:
                return render_template("error.html", error_type="invalid_timing", message="End time must be greater than start time."), 400
        except ValueError:
            return render_template("error.html", error_type="invalid_timing", message="End time must be a valid number."), 400

    # Synchronous processing fallback for traditional form submit
    from video_processor import process_video_task
    
    job_id = str(uuid.uuid4())
    filename = secure_filename(video.filename)
    base_name = os.path.splitext(filename)[0] or "video"
    folder_name = f"{base_name}_{job_id[:8]}"
    
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{job_id}_{filename}")
    video.save(video_path)
    output_folder = os.path.join(app.config['SCREENSHOT_FOLDER'], folder_name)

    create_job({
        "id": job_id,
        "folder_name": folder_name,
        "original_filename": filename,
        "status": "pending",
        "progress": 0,
        "start_time": start_val,
        "end_time": end_val if end_val else 0.0,
        "interval": interval_val
    })

    # Process synchronously for plain HTML fallback
    process_video_task(
        job_id=job_id,
        video_path=video_path,
        output_folder=output_folder,
        start_time=start_val,
        end_time=end_val,
        interval=interval_val,
        folder_name=folder_name
    )

    return redirect(url_for('view_screenshots', folder=folder_name))


# ==========================================
# Download & Native Folder Integrations
# ==========================================

@app.route("/download_zip/<folder>")
def download_zip(folder):
    """Packages all extracted screenshots in a folder into a ZIP and serves it."""
    folder_path = os.path.join(app.config['SCREENSHOT_FOLDER'], folder)
    zip_path = os.path.join(app.config['SCREENSHOT_FOLDER'], f"{folder}.zip")

    if not os.path.exists(folder_path):
        return render_template("error.html", message="The requested screenshot folder does not exist."), 404

    # Build fresh ZIP archive
    archive_base = zip_path[:-4] if zip_path.endswith('.zip') else zip_path
    shutil.make_archive(archive_base, 'zip', folder_path)
    return send_file(zip_path, as_attachment=True, download_name=f"{folder}_screenshots.zip")

@app.route("/open_folder/<folder>")
def open_folder(folder):
    """Opens the local screenshots directory in the OS default file manager."""
    folder_path = os.path.abspath(os.path.join(app.config['SCREENSHOT_FOLDER'], folder))

    if not os.path.exists(folder_path):
        return render_template("error.html", message="Screenshots folder does not exist on disk."), 404

    try:
        sys_os = platform.system()
        if sys_os == "Windows":
            subprocess.Popen(f'explorer "{folder_path}"')
        elif sys_os == "Darwin":
            subprocess.Popen(["open", folder_path])
        else:  # Linux / Unix
            subprocess.Popen(["xdg-open", folder_path])
    except Exception as e:
        return render_template("error.html", message=f"Unable to open system file explorer: {str(e)}"), 500

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({"success": True, "path": folder_path})

    return redirect(url_for('view_screenshots', folder=folder))


# ==========================================
# Error Handlers
# ==========================================

@app.errorhandler(413)
def request_entity_too_large(e):
    if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({"error": "File size exceeds the 1GB upload limit."}), 413
    return render_template("error.html", message="Video file is too large! Maximum allowed size is 1GB."), 413

@app.errorhandler(404)
def not_found(e):
    if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({"error": "Resource not found."}), 404
    return render_template("error.html", message="Oops! The page or resource you are looking for does not exist."), 404

@app.errorhandler(500)
def internal_error(e):
    if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({"error": "An internal server error occurred."}), 500
    return render_template("error.html", message="Something went wrong while processing your request."), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
