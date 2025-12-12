An end-to-end system for detecting audio patterns in target recordings using advanced signal processing and visualization.
#demo video: https://youtu.be/6W6wjV44Yfw
This project has two parts:

Backend (FastAPI + Librosa + NumPy) → Handles audio processing and pattern detection.

Frontend (React/Next.js) → Provides a UI to upload audio, trigger analysis, and view results with waveform visualization.

✨ Features

Upload pattern audio + target audio for analysis.

Multi-method detection:

🔍 Cross-correlation (signal matching)

🎼 Chroma features (musical similarity)

🎵 Spectral contrast (timbre analysis)

Combines results with confidence scoring.

Returns:

Detection times

Confidence levels

Waveform + correlation data for visualization

Frontend interface for uploads + interactive results display.

//
Installation
cd backend
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
//
Run Server
uvicorn main:app --reload --port 8000
//
💻 Frontend Setup
Requirements

Node.js 18+

Yarn or npm

Installation
cd frontend
npm install   # or yarn install

Run Dev Server
npm run dev


Frontend runs at http://localhost:3000 and communicates with the backend API.
//
🚀 Usage

Start the backend (uvicorn main:app --reload).

Start the frontend (npm run dev).

Open http://localhost:3000.

Upload a pattern audio file and a target audio file.

View detection results (time positions, confidence, waveform, correlation).
