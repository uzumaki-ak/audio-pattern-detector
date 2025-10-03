import os
from typing import Optional

def ensure_directories():
    """Ensure required directories exist"""
    directories = ["uploads", "results"]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

def clean_old_files(directory: str, max_age_hours: int = 24):
    """Clean up old files from directory"""
    import time
    current_time = time.time()
    
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)
        if os.path.isfile(file_path):
            file_age = current_time - os.path.getctime(file_path)
            if file_age > max_age_hours * 3600:
                os.remove(file_path)