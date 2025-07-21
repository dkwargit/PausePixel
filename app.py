from flask import Flask, render_template, request, send_from_directory, redirect, url_for
import os
import cv2
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'static/uploads'
SCREENSHOT_FOLDER = 'static/screenshots'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SCREENSHOT_FOLDER'] = SCREENSHOT_FOLDER

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
        
    video = request.files.get('video')
    interval = request.form.get('interval')
    start_time = request.form.get('start_time')
    end_time = request.form.get('end_time')

    if not video or video.filename == "":
        return render_template("error.html", message="No video uploaded."), 400
    
    interval = interval if interval else "1.0"

    try:
        interval = float(interval)
        start_time = float(start_time) if start_time else 0
        end_time = float(end_time) if end_time else None
    except ValueError:
        return render_template("error.html", message="Invalid timing inputs."), 400


    filename = secure_filename(video.filename)
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video.save(video_path)

    video_name = os.path.splitext(filename)[0]
    video_folder = os.path.join(app.config['SCREENSHOT_FOLDER'], video_name)
    os.makedirs(video_folder, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps

    start_frame = int(start_time * fps)
    end_frame = int(end_time * fps) if end_time else total_frames

    count = 0
    saved = 0
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    while cap.isOpened():
        current_frame = int(cap.get(cv2.CAP_PROP_POS_FRAMES))
        if current_frame > end_frame:
            break

        ret, frame = cap.read()
        if not ret:
            break

        if (current_frame - start_frame) % (interval * fps) == 0:
            img_path = os.path.join(video_folder, f'ss_{saved + 1}.jpg')
            cv2.imwrite(img_path, frame)
            saved += 1

        count += 1

    cap.release()
    os.remove(video_path)

    return redirect(url_for('view_screenshots', folder=video_name))

@app.route('/screenshots/<folder>')
def view_screenshots(folder):
    path = os.path.join(app.config['SCREENSHOT_FOLDER'], folder)
    if not os.path.exists(path):
        return "Screenshots not found", 404
    files = os.listdir(path)
    files = sorted(files, key=lambda x: int(x.split('_')[1].split('.')[0]))

    return render_template('index.html', screenshots=files, folder=folder)

@app.route('/static/screenshots/<folder>/<filename>')
def serve_screenshot(folder, filename):
    return send_from_directory(os.path.join(app.config['SCREENSHOT_FOLDER'], folder), filename)


# download file option   
@app.route("/download_zip/<folder>")
def download_zip(folder):
    import shutil  
    from flask import send_file  

    folder_path = os.path.join(app.config['SCREENSHOT_FOLDER'], folder)
    zip_path = os.path.join(app.config['SCREENSHOT_FOLDER'], f"{folder}.zip")

    if not os.path.exists(folder_path):
        return "Folder not found", 404

    # Always create a new zip
    shutil.make_archive(zip_path.replace('.zip', ''), 'zip', folder_path)
    return send_file(zip_path, as_attachment=True)

# go-to file local file location option
import platform
import subprocess

@app.route("/open_folder/<folder>")
def open_folder(folder):
    folder_path = os.path.abspath(os.path.join(app.config['SCREENSHOT_FOLDER'], folder))

    if not os.path.exists(folder_path):
        return "Folder not found", 404

    # Open in file explorer based on OS
    try:
        if platform.system() == "Windows":
            subprocess.Popen(f'explorer "{folder_path}"')
        elif platform.system() == "Darwin":  # macOS
            subprocess.Popen(["open", folder_path])
        else:  # Linux
            subprocess.Popen(["xdg-open", folder_path])
    except Exception as e:
        return f"Failed to open folder: {str(e)}", 500

    return redirect(url_for('view_screenshots', folder=folder))




if __name__ == '__main__':
    app.run(debug=True)

