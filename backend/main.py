from fastapi import FastAPI, HTTPException, Depends, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
import uuid
from datetime import datetime, timedelta
from results import router as results_router

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include results router
app.include_router(results_router)

# Models
class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="The name of the player")
    family_name: str = Field(..., description="The family name of the player")
    start_time: Optional[datetime] = Field(default=None, description="The time the player started the game")
    current_level: int = Field(default=0, description="The current level of the player")
    completion_time: Optional[int] = Field(default=None, description="The time the player completed the game")

class QRCode(BaseModel):
    code: str = Field(..., description="The QR code value")
    level: int = Field(..., description="The level of the QR code")

class ScanRequest(BaseModel):
    player_id: str = Field(..., description="The ID of the player")
    qr_code: QRCode = Field(..., description="The QR code value and level")
    debug: bool = Field(default=False, description="Whether to skip validation")

class Hint(BaseModel):
    level: int = Field(..., description="The level of the hint")
    educational_text: str = Field(..., description="The educational text of the hint")
    text: str = Field(..., description="The text of the hint")
    next_qr_code: str = Field(..., description="The next QR code value")

class PlayerState(BaseModel):
    player_id: str = Field(..., description="The ID of the player")
    time_left: int = Field(..., description="The time left in the game")
    current_level: int = Field(..., description="The current level of the player")

# Game state
players = {}
GAME_DURATION = 60  # minutes
HINTS_FILE = "hints.json"

def load_hints():
    if not os.path.exists(HINTS_FILE):
        return []
    with open(HINTS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_hints(hints):
    with open(HINTS_FILE, "w", encoding="utf-8") as f:
        json.dump(hints, f, ensure_ascii=False, indent=2)

def get_time_left(player: Player) -> int:
    if not player.start_time:
        return GAME_DURATION * 60
    time_elapsed = datetime.now() - player.start_time
    time_left = GAME_DURATION * 60 - int(time_elapsed.total_seconds())
    return max(0, time_left)

@app.post("/api/register")
async def register_player(player: Player):
    player_id = player.id
    if player_id in players:
        raise HTTPException(status_code=400, detail="Player already registered")
    
    # Check for existing player with same name
    for existing_player in players.values():
        if (existing_player.name == player.name and 
            existing_player.family_name == player.family_name):
            raise HTTPException(status_code=400, detail="Player with this name already exists")

    player.start_time = datetime.now()
    players[player_id] = player
    
    response = JSONResponse(content={
        "player_id": player_id,
        "message": "Registration successful",
        "time_left": GAME_DURATION * 60
    })
    response.set_cookie(key="playerId", value=player_id, max_age=GAME_DURATION * 60)
    return response

@app.get("/api/player-state")
async def get_player_state(playerId: str = Cookie(None)):
    if not playerId or playerId not in players:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player = players[playerId]
    time_left = get_time_left(player)
    
    if time_left <= 0:
        # Remove expired player
        del players[playerId]
        response = JSONResponse(content={"message": "Game time expired"})
        response.delete_cookie("playerId")
        return response
    
    return {
        "player_id": playerId,
        "time_left": time_left,
        "current_level": player.current_level,
        "completion_time": player.completion_time
    }

@app.post("/api/scan")
async def scan_qr_code(request: ScanRequest):
    if request.player_id not in players:
        raise HTTPException(status_code=404, detail="Player does not exist")
    
    player = players[request.player_id]
    time_left = get_time_left(player)
    
    if time_left <= 0:
        # Remove expired player
        del players[request.player_id]
        raise HTTPException(status_code=400, detail="Game time is up")
    
    hints = load_hints()
    
    # Skip validation if debug mode is enabled
    if not request.debug:      
        # Get the expected QR code for this level
        current_hint = hints[player.current_level]
        
        # Only validate next QR code if this isn't the final level
        if current_hint and current_hint["next_qr_code"] != request.qr_code.code:
            raise HTTPException(status_code=405, detail="Incorrect QR code")
    
    # Update player's level
    player.current_level += 1
    
    # Get next hint
    if player.current_level >= len(hints):
        # Game completed
        if(player.completion_time is not None):
            return {"message": "game completed", "completion_time": player.completion_time}
        
        completion_time = GAME_DURATION * 60 - time_left
        player.completion_time = completion_time
        
        # Submit result to leaderboard
        from results import submit_result
        await submit_result(
            player_id=request.player_id,
            name=player.name,
            family_name=player.family_name,
            completion_time=completion_time
        )
    else:
        next_hint = hints[player.current_level]
    
    if player.completion_time is not None:
        return {"message": "game completed", "completion_time": completion_time}
    
    return {
        "educational_text": next_hint["educational_text"],
        "hint": next_hint["text"]
    }

@app.get("/api/hints")
async def get_hints():
    return load_hints()

@app.post("/api/hints")
async def update_hints(hints: List[Hint]):
    save_hints([h.dict() for h in hints])
    return {"message": "Hints updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 