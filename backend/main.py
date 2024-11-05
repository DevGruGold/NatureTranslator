from fastapi import FastAPI, WebSocket, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import json
from pydantic import BaseModel
from typing import Optional
import uuid
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ANIMAL_SOUNDS = {
    "chirp_high": {
        "animal": "Cardinal",
        "messages": [
            "Hey, this is MY branch!",
            "Anyone seen any good seeds around here?",
            "Perfect weather for singing!"
        ]
    },
    "chirp_low": {
        "animal": "Sparrow",
        "messages": [
            "Back off buddy, I saw this feeder first!",
            "Perfect spot for lunch!",
            "Who's up for a dust bath?"
        ]
    }
}

def mock_analyze_audio(audio_data):
    import random
    sound_type = random.choice(list(ANIMAL_SOUNDS.keys()))
    animal_data = ANIMAL_SOUNDS[sound_type]
    return {
        "animal": animal_data["animal"],
        "message": random.choice(animal_data["messages"]),
        "confidence": random.uniform(0.7, 0.99)
    }

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            result = mock_analyze_audio(data)
            await websocket.send_json({
                "id": str(uuid.uuid4()),
                "timestamp": data.get("timestamp"),
                "location": data.get("location", "Nearby"),
                **result
            })
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

@app.post("/api/audio/analyze")
async def analyze_audio_file(file: UploadFile = File(...)):
    result = mock_analyze_audio(None)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
