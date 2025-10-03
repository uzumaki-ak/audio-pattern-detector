export interface Detection {
  time: number;
  confidence: number;
  methods?: string[];
  method_count?: number;
}

export interface AnalysisResult {
  analysis_id: string;
  timestamp: string;
  pattern_filename: string;
  target_filename: string;
  detection_count: number;
  detections: Detection[];
  pattern_duration: number;
  target_duration: number;
  sample_rate: number;
  waveform_data: number[];
  correlation_data: number[];
  analysis_methods?: string[];
  result_file: string;
    target_url?: string;
}