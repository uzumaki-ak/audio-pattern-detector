

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
import os
import uuid
import glob
from datetime import datetime
from app.audio_processor import AudioProcessor
from app.models import AnalysisResponse
import supabase
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI(title="Audio Pattern Detection API")

# Supabase client
supabase_client = supabase.create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

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
    target: UploadFile = File(...),
    user_id: str = Form(...)  # FIX: Use Form instead of query param
):
    """
    Analyze audio files for pattern detection and store in Supabase
    """
    print(f"🎵 Received files: Pattern={pattern.filename}, Target={target.filename}, User={user_id}")
    
    if not user_id or user_id == "None":
        raise HTTPException(status_code=400, detail="User ID is required")
    
    pattern_path = None
    target_path = None
    
    try:
        # Generate unique ID for this analysis
        analysis_id = str(uuid.uuid4())
        
        # Save uploaded files temporarily
        pattern_ext = os.path.splitext(pattern.filename)[1] or '.wav'
        target_ext = os.path.splitext(target.filename)[1] or '.wav'
        
        pattern_path = os.path.join(UPLOAD_DIR, f"{analysis_id}_pattern{pattern_ext}")
        target_path = os.path.join(UPLOAD_DIR, f"{analysis_id}_target{target_ext}")
        
        print(f"💾 Saving temporary files...")
        
        # Save uploaded files
        with open(pattern_path, "wb") as buffer:
            content = await pattern.read()
            buffer.write(content)
        
        with open(target_path, "wb") as buffer:
            content = await target.read()
            buffer.write(content)
        
        print("🔍 Starting audio processing...")
        # Process audio
        results = processor.detect_pattern(pattern_path, target_path)
        print(f"✅ Processing complete. Found {results['detection_count']} detections")
        
        # Upload files to Supabase Storage
        print("☁️ Uploading to Supabase Storage...")
        
        # Upload pattern file
        with open(pattern_path, "rb") as pattern_file:
            pattern_data = pattern_file.read()
            pattern_storage_path = f"{user_id}/{analysis_id}_pattern{pattern_ext}"
            supabase_client.storage.from_("audio-analysis-files").upload(
                pattern_storage_path,
                pattern_data
            )
            pattern_url = supabase_client.storage.from_("audio-analysis-files").get_public_url(pattern_storage_path)
        
        # Upload target file
        with open(target_path, "rb") as target_file:
            target_data = target_file.read()
            target_storage_path = f"{user_id}/{analysis_id}_target{target_ext}"
            supabase_client.storage.from_("audio-analysis-files").upload(
                target_storage_path,
                target_data
            )
            target_url = supabase_client.storage.from_("audio-analysis-files").get_public_url(target_storage_path)
        
        # Store analysis in Supabase Database
        print("💾 Saving analysis to database...")
        analysis_data = {
            "user_id": user_id,
            "analysis_id": analysis_id,
            "pattern_filename": pattern.filename,
            "target_filename": target.filename,
            "pattern_url": pattern_url,
            "target_url": target_url,
            "detection_count": results["detection_count"],
            "detections": results["detections"],
            "pattern_duration": results["pattern_duration"],
            "target_duration": results["target_duration"],
            "sample_rate": results["sample_rate"],
            "waveform_data": results["waveform_data"],
            "correlation_data": results["correlation_data"],
            "analysis_methods": results.get("analysis_methods", ["correlation"])
        }
        
        db_response = supabase_client.table("audio_analysis").insert(analysis_data).execute()
        
        if hasattr(db_response, 'error') and db_response.error:
            print(f"❌ Database error: {db_response.error}")
            raise HTTPException(status_code=500, detail="Failed to save analysis to database")
        
        print("✅ Analysis saved to database successfully")
        
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
            "target_url": target_url,  # ADD THIS for frontend audio player
            "result_file": f"supabase:{analysis_id}"
        }
        
    except Exception as e:
        print(f"❌ Error in analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup temporary files
        if pattern_path and os.path.exists(pattern_path):
            os.remove(pattern_path)
        if target_path and os.path.exists(target_path):
            os.remove(target_path)

# Serve audio files from Supabase (redirect to public URL)
@app.get("/api/audio/{analysis_id}")
async def get_audio_file(analysis_id: str):
    """Get audio file URL from database"""
    try:
        # Get analysis record from database
        response = supabase_client.table("audio_analysis").select("target_url").eq("analysis_id", analysis_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        target_url = response.data[0]["target_url"]
        
        # Redirect to the actual Supabase URL
        return RedirectResponse(url=target_url)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/docs")
async def get_docs():
    """API Documentation endpoint"""
    return {
        "endpoints": {
            "POST /api/analyze": "Analyze audio files for pattern detection",
            "GET /api/audio/{analysis_id}": "Get audio file URL",
            "GET /api/health": "Health check",
            "GET /api/docs": "This documentation"
        },
        "authentication": "Required via Supabase Auth",
        "file_limits": "Maximum 50MB per file",
        "supported_formats": ["mp3", "wav", "ogg", "m4a", "aac", "flac"]
    }