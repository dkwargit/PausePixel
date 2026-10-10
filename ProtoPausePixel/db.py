"""
Database layer for PausePixel.
Provides thread-safe SQLite operations for managing video processing jobs and screenshots.
"""
import sqlite3
import os
import threading
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pausepixel.db')
_db_lock = threading.Lock()

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    with _db_lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                folder_name TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                progress INTEGER DEFAULT 0,
                current_frame INTEGER DEFAULT 0,
                total_frames INTEGER DEFAULT 0,
                saved_count INTEGER DEFAULT 0,
                fps REAL DEFAULT 0,
                duration REAL DEFAULT 0,
                start_time REAL DEFAULT 0,
                end_time REAL DEFAULT 0,
                interval REAL DEFAULT 1.0,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS screenshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                frame_number INTEGER NOT NULL,
                timestamp_sec REAL NOT NULL,
                url TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        """)

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_jobs_folder ON jobs(folder_name)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_screenshots_job ON screenshots(job_id)")
        
        conn.commit()
        conn.close()

def create_job(job_data: Dict[str, Any]) -> str:
    with _db_lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO jobs (
                id, folder_name, original_filename, status, progress, 
                start_time, end_time, interval
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_data['id'],
            job_data['folder_name'],
            job_data['original_filename'],
            job_data.get('status', 'pending'),
            job_data.get('progress', 0),
            job_data.get('start_time', 0.0),
            job_data.get('end_time', 0.0),
            job_data.get('interval', 1.0)
        ))
        conn.commit()
        conn.close()
        return job_data['id']

def update_job(job_id: str, updates: Dict[str, Any]):
    with _db_lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        fields = []
        values = []
        for key, value in updates.items():
            fields.append(f"{key} = ?")
            values.append(value)
        values.append(job_id)
        query = f"UPDATE jobs SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        conn.close()

def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_job_by_folder(folder_name: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE folder_name = ? ORDER BY created_at DESC LIMIT 1", (folder_name,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def add_screenshot(job_id: str, filename: str, frame_number: int, timestamp_sec: float, url: str):
    with _db_lock:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO screenshots (job_id, filename, frame_number, timestamp_sec, url)
            VALUES (?, ?, ?, ?, ?)
        """, (job_id, filename, frame_number, timestamp_sec, url))
        conn.commit()
        conn.close()

def get_job_screenshots(job_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM screenshots WHERE job_id = ? ORDER BY frame_number ASC", (job_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_recent_jobs(limit: int = 6) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM jobs 
        WHERE status = 'completed' AND saved_count > 0 
        ORDER BY created_at DESC LIMIT 20
    """)
    rows = cursor.fetchall()
    conn.close()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    screenshots_dir = os.path.join(base_dir, 'static', 'screenshots')

    valid_jobs = []
    for row in rows:
        job = dict(row)
        folder_path = os.path.join(screenshots_dir, job['folder_name'])
        if os.path.exists(folder_path):
            valid_jobs.append(job)
        if len(valid_jobs) >= limit:
            break

    return valid_jobs
