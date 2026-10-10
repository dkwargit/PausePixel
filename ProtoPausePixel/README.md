# ProtoPausePixel (Legacy Python Prototype)

This folder contains the original full-stack Python/Flask prototype of **PausePixel**.

---

## 🚀 How to Run the Prototype

1. Navigate into this directory:
   ```bash
   cd ProtoPausePixel
   ```

2. (Optional) Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the Flask server:
   ```bash
   python3 app.py
   ```

4. Open your browser at:
   👉 **http://127.0.0.1:5000**

---

## 📂 Prototype Structure
- `app.py`: Flask server & REST API
- `db.py`: SQLite database queries (`pausepixel.db`)
- `video_processor.py`: Asynchronous OpenCV worker
- `static/`: CSS, JS, meme assets, uploads & screenshots
- `templates/`: Jinja2 templates (`index.html`, `error.html`)
