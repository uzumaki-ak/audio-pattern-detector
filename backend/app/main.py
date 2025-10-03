from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
import os
import uuid
from datetime import datetime
from app.audio_processor import AudioProcessor
import supabase
from dotenv import load_dotenv
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Audio Pattern Detection API",
    description="Industry-grade audio pattern detection using cross-correlation analysis",
    version="1.0.0"
)

# Get environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8000))

# Supabase client initialization
try:
    supabase_client = supabase.create_client(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )
    # Test the connection
    supabase_client.table("audio_analysis").select("count", count="exact").limit(1).execute()
    logger.info("✅ Supabase client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Supabase client: {e}")
    logger.error(f"Full error: {traceback.format_exc()}")
    supabase_client = None

# CORS Configuration - get from environment
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
logger.info(f"🔄 CORS origins: {CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
    return {
        "message": "Audio Pattern Detection API", 
        "status": "running",
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

@app.post("/api/analyze")
async def analyze_audio(
    pattern: UploadFile = File(...),
    target: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Analyze audio files for pattern detection"""
    logger.info(f"🎵 Received analysis request from user: {user_id}")
    
    if not user_id or user_id == "None":
        raise HTTPException(status_code=400, detail="User ID is required")
    
    # Validate file types
    allowed_extensions = {'.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'}
    pattern_ext = os.path.splitext(pattern.filename)[1].lower()
    target_ext = os.path.splitext(target.filename)[1].lower()
    
    if pattern_ext not in allowed_extensions or target_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # Validate file size (50MB max)
    max_size = 50 * 1024 * 1024
    if pattern.size > max_size or target.size > max_size:
        raise HTTPException(status_code=400, detail="File size too large. Maximum 50MB per file.")
    
    pattern_path = None
    target_path = None
    
    try:
        analysis_id = str(uuid.uuid4())
        
        # Save files temporarily
        pattern_path = os.path.join(UPLOAD_DIR, f"{analysis_id}_pattern{pattern_ext}")
        target_path = os.path.join(UPLOAD_DIR, f"{analysis_id}_target{target_ext}")
        
        # Save uploaded files
        with open(pattern_path, "wb") as buffer:
            content = await pattern.read()
            buffer.write(content)
        
        with open(target_path, "wb") as buffer:
            content = await target.read()
            buffer.write(content)
        
        # Process audio
        logger.info("🔍 Starting audio processing...")
        results = processor.detect_pattern(pattern_path, target_path)
        logger.info(f"✅ Processing complete. Found {results['detection_count']} detections")
        
        # Upload to Supabase Storage
        target_url = None
        pattern_url = None
        
        if supabase_client:
            try:
                logger.info("☁️ Uploading to Supabase Storage...")
                
                # Upload pattern file
                with open(pattern_path, "rb") as pattern_file:
                    pattern_data = pattern_file.read()
                    pattern_storage_path = f"{user_id}/{analysis_id}_pattern{pattern_ext}"
                    
                    upload_response = supabase_client.storage.from_("audio-analysis-files").upload(
                        pattern_storage_path,
                        pattern_data
                    )
                    logger.info(f"Pattern upload response: {upload_response}")
                    
                    # Get public URL for pattern
                    pattern_url = supabase_client.storage.from_("audio-analysis-files").get_public_url(pattern_storage_path)
                    logger.info(f"Pattern URL: {pattern_url}")
                
                # Upload target file
                with open(target_path, "rb") as target_file:
                    target_data = target_file.read()
                    target_storage_path = f"{user_id}/{analysis_id}_target{target_ext}"
                    
                    upload_response = supabase_client.storage.from_("audio-analysis-files").upload(
                        target_storage_path,
                        target_data
                    )
                    logger.info(f"Target upload response: {upload_response}")
                    
                    # Get public URL for target
                    target_url = supabase_client.storage.from_("audio-analysis-files").get_public_url(target_storage_path)
                    logger.info(f"Target URL: {target_url}")
                
                # Store in database
                logger.info("💾 Saving analysis to database...")
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
                    "analysis_methods": results.get("analysis_methods", ["correlation"]),
                    "created_at": datetime.now().isoformat()
                }
                
                db_response = supabase_client.table("audio_analysis").insert(analysis_data).execute()
                
                if hasattr(db_response, 'error') and db_response.error:
                    logger.error(f"Database error: {db_response.error}")
                    raise Exception(f"Database insert failed: {db_response.error}")
                else:
                    logger.info("✅ Analysis saved to database successfully")
                    
            except Exception as e:
                logger.error(f"❌ Supabase operation failed: {e}")
                logger.error(f"Full Supabase error: {traceback.format_exc()}")
                # Continue without Supabase storage but don't save to database
                target_url = None
                pattern_url = None
        
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
            "target_url": target_url,
            "pattern_url": pattern_url,
            "supabase_saved": supabase_client is not None and target_url is not None
        }
        
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}")
        logger.error(f"Full analysis error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup temporary files
        for file_path in [pattern_path, target_path]:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    logger.warning(f"Could not remove temporary file {file_path}: {e}")

# Audio file endpoint
@app.get("/api/audio/{analysis_id}")
async def get_audio_file(analysis_id: str):
    """Get audio file URL from database"""
    try:
        if not supabase_client:
            raise HTTPException(status_code=500, detail="Storage service unavailable")
            
        # Get analysis record from database
        response = supabase_client.table("audio_analysis").select("target_url").eq("analysis_id", analysis_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        target_url = response.data[0]["target_url"]
        
        if not target_url:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Redirect to the actual Supabase URL
        return RedirectResponse(url=target_url)
        
    except Exception as e:
        logger.error(f"Audio file error: {e}")
        logger.error(f"Full audio file error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint for monitoring
@app.get("/api/health")
async def health_check():
    # Test Supabase connection
    supabase_status = False
    if supabase_client:
        try:
            # Simple query to test connection
            supabase_client.table("audio_analysis").select("count", count="exact").limit(1).execute()
            supabase_status = True
        except Exception as e:
            logger.warning(f"Supabase health check failed: {e}")
    
    status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "environment": ENVIRONMENT,
        "supabase_connected": supabase_status,
        "port": PORT
    }
    return status

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)