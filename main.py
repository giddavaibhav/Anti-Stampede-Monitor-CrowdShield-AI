# =============================================================================
# CrowdShield AI — FastAPI Backend
# Exposes the multi-agent pipeline over HTTP.
#
# Run:  uvicorn backend.main:app --reload
#       (from the crowdshield-ai/ root directory)
#
# Endpoint:
#   POST /analyze   → runs Agents 1-3 and returns results.
#                     Agent 4 (HITL alert) is handled by the frontend.
# =============================================================================

import sys
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Make `app/agent.py` importable when running from the project root.
# ---------------------------------------------------------------------------
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from agent import (
    crowd_analysis_agent,
    risk_assessment_agent,
    recommendation_agent,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CrowdShield AI",
    description="Anti-Stampede Multi-Agent Safety System API",
    version="1.0.0",
)

# Allow the Vite dev server (port 5173) and any localhost origin to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
],
    allow_methods=["POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    crowd_count: int   = Field(..., gt=0,  description="Number of people in the area")
    area:        float = Field(..., gt=0.0, description="Area in square metres")


class AnalyzeResponse(BaseModel):
    # Agent 1 output
    crowd_count:     int
    area:            float
    density:         float
    # Agent 2 output
    risk_level:      str
    # Agent 3 output
    recommendations: list[str]
    ai_powered:      bool


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    """
    Run Agents 1 → 2 → 3 and return the full pipeline result.
    Agent 4 (Human-in-the-Loop alert dispatch) is intentionally left
    to the frontend so the operator can approve or suppress in the UI.
    """
    try:
        analysis       = crowd_analysis_agent(request.crowd_count, request.area)
        assessment     = risk_assessment_agent(analysis)
        recommendation = recommendation_agent(assessment)
    except ValueError as e:
        # Raised by agent.py for invalid inputs (negative crowd, zero area, etc.)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    return AnalyzeResponse(
        crowd_count     = recommendation["crowd_count"],
        area            = recommendation["area"],
        density         = recommendation["density"],
        risk_level      = recommendation["risk_level"],
        recommendations = recommendation["recommendations"],
        ai_powered      = recommendation["ai_powered"],
    )