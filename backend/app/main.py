
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os
import uuid
import glob
from datetime import datetime
from app.audio_processor import AudioProcessor
from app.models import AnalysisResponse

app = FastAPI(title="Audio Pattern Detection API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://10.154.161.160:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = "uploads"
RESULTS_DIR = "results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

processor = AudioProcessor()

@app.get("/")
async def root():
    return {"message": "Audio Pattern Detection API", "status": "running"}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_audio(
    pattern: UploadFile = File(...),
    target: UploadFile = File(...)
):
    """
    Analyze audio files for pattern detection
    """
    print(f"🎵 Received files: Pattern={pattern.filename}, Target={target.filename}")
    
    pattern_path = None
    target_path = None
    
    try:
        # Generate unique ID for this analysis
        analysis_id = str(uuid.uuid4())
        
        # Save uploaded files with proper extensions
        pattern_ext = os.path.splitext(pattern.filename)[1] or '.wav'
        target_ext = os.path.splitext(target.filename)[1] or '.wav'
        
        pattern_path = os.path.join(UPLOAD_DIR, f"{analysis_id}_pattern{pattern_ext}")
        target_path = os.path.join(UPLOAD_DIR, f"{analysis_id}_target{target_ext}")
        
        print(f"💾 Saving files: {pattern_path}, {target_path}")
        
        # Save uploaded files
        with open(pattern_path, "wb") as buffer:
            content = await pattern.read()
            buffer.write(content)
        
        with open(target_path, "wb") as buffer:
            content = await target.read()
            buffer.write(content)
        
        print("🔍 Starting audio processing...")
        # Process audio with enhanced detection
        results = processor.detect_pattern(pattern_path, target_path)
        print(f"✅ Processing complete. Found {results['detection_count']} detections")
        
        # Save results to file
        result_file = os.path.join(RESULTS_DIR, f"{analysis_id}_results.json")
        with open(result_file, "w") as f:
            import json
            json.dump(results, f, indent=2)
        
        return {
            "analysis_id": analysis_id,
            "timestamp": datetime.now().isoformat(),
            "pattern_filename": pattern.filename,
            "target_filename": target.filename,
            "detection_count": results["detection_count"],
            "detections": results["detections"],
            "pattern_duration": results["pattern_duration"],
            "target_duration": results["target_duration"],
            "sample_rate": results["sample_rate"],
            "waveform_data": results["waveform_data"],
            "correlation_data": results["correlation_data"],
            "analysis_methods": results.get("analysis_methods", ["correlation"]),
            "result_file": result_file
        }
        
    except Exception as e:
        print(f"❌ Error in analysis: {str(e)}")
        # Cleanup on error
        if pattern_path and os.path.exists(pattern_path):
            os.remove(pattern_path)
        if target_path and os.path.exists(target_path):
            os.remove(target_path)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# NEW: Serve audio files for playback
@app.get("/api/audio/{analysis_id}")
async def get_audio_file(analysis_id: str):
    """Serve the target audio file for playback"""
    try:
        # Look for target file with any extension
        target_files = glob.glob(os.path.join(UPLOAD_DIR, f"{analysis_id}_target.*"))
        if not target_files:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        target_path = target_files[0]
        
        # Determine content type based on file extension
        ext = os.path.splitext(target_path)[1].lower()
        media_types = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
            '.aac': 'audio/aac',
            '.flac': 'audio/flac'
        }
        
        media_type = media_types.get(ext, 'audio/mpeg')
        
        return FileResponse(
            target_path,
            media_type=media_type,
            filename=f"target_audio{ext}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/debug")
async def debug_info():
    upload_files = os.listdir(UPLOAD_DIR) if os.path.exists(UPLOAD_DIR) else []
    result_files = os.listdir(RESULTS_DIR) if os.path.exists(RESULTS_DIR) else []
    return {
        "upload_dir_exists": os.path.exists(UPLOAD_DIR),
        "results_dir_exists": os.path.exists(RESULTS_DIR),
        "upload_files": upload_files,
        "result_files": result_files,
        "upload_dir": os.path.abspath(UPLOAD_DIR)
    }