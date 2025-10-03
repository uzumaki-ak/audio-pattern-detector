from pydantic import BaseModel
from typing import List, Dict, Any

class Detection(BaseModel):
    time: float
    confidence: float

class AnalysisResponse(BaseModel):
    analysis_id: str
    timestamp: str
    pattern_filename: str
    target_filename: str
    detection_count: int
    detections: List[Detection]
    pattern_duration: float
    target_duration: float
    sample_rate: int
    waveform_data: List[float]
    correlation_data: List[float]
    result_file: str