# PausePixel 🎥🖼️

**PausePixel** is a simple web-based tool that lets you extract screenshots from any video at your chosen interval and timestamp range. Built using Flask, OpenCV, and some decent UI work — the idea was to make something quick, clean, and useful.

---

## 🚀 Features

- Upload any video file (tested on common formats like `.mp4`)
- Choose **start** and **end** timestamps to trim the portion you want (defaults to the full video if left blank)
- Select how frequently (in seconds) you want screenshots to be taken (defaults to **1.0 seconds** if left blank)
- Get a live preview of all screenshots taken
- **Download all screenshots** together in a single ZIP file
- **Go to File Location** (if running locally ) 
- Works directly in browser – no installs beyond Python requirements

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **Processing**: OpenCV
- Designed to run locally with minimal setup

---

## 📂 Folder Structure

PausePixel/
│
├── app.py             # Flask server & core logic
├── requirements.txt   # Python dependencies
├── static/
│ ├── uploads/         # Temporarily stores uploaded videos
│ ├── screenshots/     # Output images go here
│ ├── assets/          # Static assets like favicon  
│ ├── style.css        # All styling
│ └── script.js        # Frontend behavior
│ 
├── templates/
│ └── index.html       # Main web interface
└── README.md          # You’re reading it


---

## ⚙️ Setup Instructions

 # bash

 # Clone the repository
    git clone https://github.com/your-username/PausePixel.git
    cd PausePixel

 # (Optional) Create and activate virtual environment
    python -m venv venv
    venv\Scripts\activate      # For Windows
    source venv/bin/activate   # For Linux/Mac

 # Install dependencies
    pip install -r requirements.txt

 # Run the app
    python app.py

 Then open your browser and go to   👉   http://127.0.0.1:5000.

 🔒 Note: A `.gitignore` file is included to avoid committing virtual environments, temp files, and generated screenshots.

---

## Example Use Case
    Say you have a 2-minute animation and you only want screenshots between the 30–90 second mark, every 4 seconds. This tool lets you do exactly that in one go.

---

## About
    Made by Divyanshu Kumar (ECE student, BIT Mesra). Mostly just for fun — but useful enough to keep around.
    If you find it handy or have ideas, feel free to fork or raise an issue.

---