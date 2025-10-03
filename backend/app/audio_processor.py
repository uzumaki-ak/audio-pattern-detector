
import librosa
import numpy as np
from scipy.signal import find_peaks
from typing import Dict, List
import time

class AudioProcessor:
    def detect_pattern(self, pattern_path: str, target_path: str) -> Dict:
        """
        Enhanced pattern detection with multiple methods
        """
        print(f"🎵 Loading audio files...")
        start_time = time.time()
        
        try:
            # Load with optimal sample rate
            target_sr = 22050
            
            print("📥 Loading pattern audio...")
            pattern_audio, pattern_sr = librosa.load(pattern_path, sr=target_sr)
            print("📥 Loading target audio...")
            target_audio, target_sr = librosa.load(target_path, sr=target_sr)
            
            print(f"✅ Audio loaded - Pattern: {len(pattern_audio)/pattern_sr:.2f}s, Target: {len(target_audio)/target_sr:.2f}s")
            
            # Convert to mono if stereo
            if len(pattern_audio.shape) > 1:
                pattern_audio = np.mean(pattern_audio, axis=1)
            if len(target_audio.shape) > 1:
                target_audio = np.mean(target_audio, axis=1)
            
            # Normalize audio
            pattern_audio = pattern_audio / (np.max(np.abs(pattern_audio)) + 1e-8)
            target_audio = target_audio / (np.max(np.abs(target_audio)) + 1e-8)
            
            # Method 1: Standard cross-correlation
            print("🔍 Method 1: Cross-correlation...")
            correlation_results = self.cross_correlation_detection(target_audio, pattern_audio, target_sr)
            
            # Method 2: Chroma feature matching (for musical similarity)
            print("🎼 Method 2: Chroma feature analysis...")
            chroma_results = self.chroma_feature_detection(pattern_path, target_path, target_sr)
            
            # Method 3: Spectral contrast (for timbre matching)
            print("🎵 Method 3: Spectral analysis...")
            spectral_results = self.spectral_contrast_detection(pattern_path, target_path, target_sr)
            
            # Combine results
            print("🔄 Combining detection methods...")
            combined_results = self.combine_detection_methods(
                correlation_results, 
                chroma_results, 
                spectral_results,
                target_audio,
                pattern_audio,  # FIX: Added pattern_audio
                target_sr
            )
            
            processing_time = time.time() - start_time
            print(f"✅ Analysis completed in {processing_time:.2f} seconds")
            
            return combined_results
            
        except Exception as e:
            print(f"❌ Audio processing error: {str(e)}")
            raise Exception(f"Audio processing failed: {str(e)}")
    
    def cross_correlation_detection(self, target: np.ndarray, pattern: np.ndarray, sr: int) -> Dict:
        """Standard cross-correlation detection"""
        correlation = self.fft_correlate(target, pattern)
        correlation_norm = correlation / (np.max(np.abs(correlation)) + 1e-8)
        
        # Find peaks
        min_distance = max(1, int(len(pattern) * 0.3))
        peaks, properties = find_peaks(
            correlation_norm,
            height=0.2,
            prominence=0.15,
            distance=min_distance,
            width=2
        )
        
        detection_times = peaks / sr
        max_time = len(target) / sr
        valid_mask = (detection_times >= 0) & (detection_times <= max_time)
        detection_times = detection_times[valid_mask]
        peak_values = properties['peak_heights'][valid_mask] if 'peak_heights' in properties else np.ones(len(detection_times))
        
        detections = [
            {"time": float(t), "confidence": float(v), "method": "correlation"}
            for t, v in zip(detection_times, peak_values)
        ]
        
        return {
            "detections": detections,
            "correlation_data": correlation_norm[::max(1, len(correlation_norm) // 500)].tolist()
        }
    
    def chroma_feature_detection(self, pattern_path: str, target_path: str, sr: int) -> Dict:
        """Chroma feature-based detection for musical similarity"""
        try:
            # Load with chroma features
            pattern_chroma = librosa.feature.chroma_cqt(
                y=librosa.load(pattern_path, sr=sr)[0], 
                sr=sr
            )
            target_chroma = librosa.feature.chroma_cqt(
                y=librosa.load(target_path, sr=sr)[0], 
                sr=sr
            )
            
            # Cross-correlation of chroma features
            chroma_correlation = np.array([
                np.correlate(target_chroma[i], pattern_chroma[i], mode='same')
                for i in range(12)
            ])
            chroma_correlation = np.mean(chroma_correlation, axis=0)
            chroma_correlation_norm = chroma_correlation / (np.max(np.abs(chroma_correlation)) + 1e-8)
            
            # Find peaks in chroma correlation
            peaks, properties = find_peaks(
                chroma_correlation_norm,
                height=0.15,
                distance=int(sr * 0.5)  # 0.5 second minimum distance
            )
            
            detection_times = peaks / sr
            detections = [
                {"time": float(t), "confidence": float(properties['peak_heights'][i]), "method": "chroma"}
                for i, t in enumerate(detection_times)
            ]
            
            return {"detections": detections}
            
        except Exception as e:
            print(f"Chroma analysis warning: {e}")
            return {"detections": []}
    
    def spectral_contrast_detection(self, pattern_path: str, target_path: str, sr: int) -> Dict:
        """Spectral contrast for timbre matching"""
        try:
            pattern_audio = librosa.load(pattern_path, sr=sr)[0]
            target_audio = librosa.load(target_path, sr=sr)[0]
            
            pattern_spectral = librosa.feature.spectral_contrast(y=pattern_audio, sr=sr)
            target_spectral = librosa.feature.spectral_contrast(y=target_audio, sr=sr)
            
            # Simple correlation of spectral features
            spectral_similarity = np.array([
                np.correlate(target_spectral[i], pattern_spectral[i], mode='same')
                for i in range(pattern_spectral.shape[0])
            ])
            spectral_similarity = np.mean(spectral_similarity, axis=0)
            spectral_similarity_norm = spectral_similarity / (np.max(np.abs(spectral_similarity)) + 1e-8)
            
            peaks, properties = find_peaks(
                spectral_similarity_norm,
                height=0.1,
                distance=int(sr * 0.5)
            )
            
            detection_times = peaks / sr
            detections = [
                {"time": float(t), "confidence": float(properties['peak_heights'][i]), "method": "spectral"}
                for i, t in enumerate(detection_times)
            ]
            
            return {"detections": detections}
            
        except Exception as e:
            print(f"Spectral analysis warning: {e}")
            return {"detections": []}
    
    def combine_detection_methods(self, corr_results: Dict, chroma_results: Dict, spectral_results: Dict, 
                                target_audio: np.ndarray, pattern_audio: np.ndarray, sr: int) -> Dict:
        """Combine results from multiple detection methods"""
        all_detections = []
        
        # Add all detections
        all_detections.extend(corr_results["detections"])
        all_detections.extend(chroma_results["detections"])
        all_detections.extend(spectral_results["detections"])
        
        # Group nearby detections and average their times
        merged_detections = []
        all_detections.sort(key=lambda x: x["time"])
        
        i = 0
        while i < len(all_detections):
            current = all_detections[i]
            group = [current]
            
            # Group detections within 0.5 seconds
            j = i + 1
            while j < len(all_detections) and all_detections[j]["time"] - current["time"] <= 0.5:
                group.append(all_detections[j])
                j += 1
            
            # Calculate weighted average time and combined confidence
            avg_time = np.mean([d["time"] for d in group])
            max_confidence = max([d["confidence"] for d in group])
            methods = list(set([d["method"] for d in group]))
            
            merged_detections.append({
                "time": float(avg_time),
                "confidence": float(max_confidence),
                "methods": methods,
                "method_count": len(methods)
            })
            
            i = j
        
        # Sort by confidence and take top matches
        merged_detections.sort(key=lambda x: x["confidence"], reverse=True)
        final_detections = merged_detections[:10]  # Limit to top 10
        
        # Downsample for visualization
        downsample_factor = max(1, len(target_audio) // 500)
        waveform_viz = target_audio[::downsample_factor].tolist()
        
        return {
            "detection_count": len(final_detections),
            "detections": final_detections,
            "pattern_duration": float(len(pattern_audio) / sr),  # FIX: Now pattern_audio is defined
            "target_duration": float(len(target_audio) / sr),
            "sample_rate": int(sr),
            "waveform_data": waveform_viz,
            "correlation_data": corr_results["correlation_data"],
            "analysis_methods": ["correlation", "chroma", "spectral"]
        }
    
    def fft_correlate(self, target: np.ndarray, pattern: np.ndarray) -> np.ndarray:
        """FFT-based correlation for better performance"""
        pattern_padded = np.zeros_like(target)
        pattern_padded[:len(pattern)] = pattern
        
        target_fft = np.fft.fft(target)
        pattern_fft = np.fft.fft(pattern_padded)
        correlation = np.fft.ifft(target_fft * np.conj(pattern_fft))
        
        return np.real(correlation)