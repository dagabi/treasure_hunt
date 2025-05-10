from fastapi import APIRouter, HTTPException
from typing import List, Dict
import json
import os
from datetime import datetime
import threading

router = APIRouter()

RESULTS_FILE = "game_results.json"
file_lock = threading.Lock()

def load_results():
    if not os.path.exists(RESULTS_FILE):
        return []
    
    with file_lock:
        with open(RESULTS_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []

def save_results(results):
    with file_lock:
        with open(RESULTS_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

def update_leaderboard(player_id: str, name: str, family_name: str, completion_time: int):
    results = load_results()
    
    # Add new result
    new_result = {
        "player_id": player_id,
        "name": name,
        "family_name": family_name,
        "completion_time": completion_time,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add to results
    results.append(new_result)
    
    # Sort by completion time
    results.sort(key=lambda x: x["completion_time"])
    
    # Update ranks
    for i, result in enumerate(results, 1):
        result["rank"] = i
    
    save_results(results)
    return results

@router.get("/api/results/{player_id}")
async def get_results(player_id: str):
    try:
        results = load_results()
        
        # Find current player's result
        current_player = next((r for r in results if r["player_id"] == player_id), None)
        
        if not current_player:
            raise HTTPException(status_code=404, detail="Player results not found")
        
        # Get top 10 players
        leaderboard = results[:10]
        
        return {
            "current_player": current_player,
            "leaderboard": leaderboard
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/results")
async def submit_result(player_id: str, name: str, family_name: str, completion_time: int):
    try:
        results = update_leaderboard(player_id, name, family_name, completion_time)
        return {"message": "Result submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 