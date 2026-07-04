# =============================================================================
# CrowdShield AI — Anti-Stampede Multi-Agent Safety System
# Kaggle AI Agents Capstone Project
#
# Architecture: Sequential Multi-Agent Pipeline
#   Agent 1 (Crowd Analysis) → Agent 2 (Risk Assessment)
#   → Agent 3 (Recommendation — powered by Gemini AI)
#   → Agent 4 (Alert + Human-in-the-Loop)
# =============================================================================

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Configure Gemini once at module load.
# Set your key via:  export GOOGLE_API_KEY="your-key-here"
# On Kaggle: add it as a Secret named GOOGLE_API_KEY.
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# =============================================================================
# AGENT 1: CROWD ANALYSIS AGENT
# Responsibility: Calculate crowd density from raw inputs.
# Formula: density = crowd_count / area (people per square metre)
# =============================================================================

def crowd_analysis_agent(crowd_count: int, area: float) -> dict:
    """
    Analyses crowd data and computes density.

    Args:
        crowd_count (int): Number of people in the area.
        area (float):      Area in square metres.

    Returns:
        dict: {crowd_count, area, density}
    """
    if area <= 0:
        raise ValueError("Area must be greater than zero.")
    if crowd_count < 0:
        raise ValueError("Crowd count cannot be negative.")

    density = round(crowd_count / area, 2)   # people per sq. metre

    print("\n[Agent 1 — Crowd Analysis]")
    print(f"  People   : {crowd_count}")
    print(f"  Area     : {area} sq. metres")
    print(f"  Density  : {density} people/sq. metre")

    return {
        "crowd_count": crowd_count,
        "area": area,
        "density": density,
    }


# =============================================================================
# AGENT 2: RISK ASSESSMENT AGENT
# Responsibility: Map density to a risk level.
#   density <= 3  → LOW
#   density <= 5  → MEDIUM
#   density >  5  → HIGH
# =============================================================================

def risk_assessment_agent(analysis: dict) -> dict:
    """
    Assesses stampede risk based on crowd density.

    Args:
        analysis (dict): Output from crowd_analysis_agent.

    Returns:
        dict: analysis data + {risk_level}
    """
    density = analysis["density"]

    if density <= 3:
        risk_level = "LOW"
    elif density <= 5:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    print("\n[Agent 2 — Risk Assessment]")
    print(f"  Density    : {density} people/sq. metre")
    print(f"  Risk Level : {risk_level}")

    return {**analysis, "risk_level": risk_level}


# =============================================================================
# AGENT 3: RECOMMENDATION AGENT  (Gemini-powered)
# Responsibility: Ask Gemini to produce actionable safety recommendations
#   based on the crowd density and risk level. Falls back to hardcoded
#   recommendations if the API call fails, so the pipeline never breaks.
# =============================================================================

# Fallback recommendations used when Gemini is unavailable.
_FALLBACK_RECS = {
    "LOW": [
        "Continue routine monitoring.",
    ],
    "MEDIUM": [
        "Increase surveillance camera coverage.",
        "Alert on-ground staff to stay vigilant.",
        "Prepare crowd-control barriers as a precaution.",
    ],
    "HIGH": [
        "Deploy additional security personnel immediately.",
        "Open all emergency exits without delay.",
        "Redirect incoming crowd to alternate entry points.",
        "Activate public address system to guide movement.",
        "Notify emergency services and local authorities.",
    ],
}


def recommendation_agent(assessment: dict) -> dict:
    """
    Generates AI-powered safety recommendations via Gemini 2.0 Flash.

    Args:
        assessment (dict): Output from risk_assessment_agent.

    Returns:
        dict: assessment data + {recommendations, ai_powered}
    """
    risk_level = assessment["risk_level"]
    density    = assessment["density"]
    crowd      = assessment["crowd_count"]
    area       = assessment["area"]

    prompt = f"""You are a crowd safety expert advising event security staff.

Situation:
- Crowd count : {crowd} people
- Area        : {area} sq. metres
- Density     : {density} people per sq. metre
- Risk level  : {risk_level}

Provide a concise, numbered list of actionable safety recommendations for
this exact situation. Rules:
- Return ONLY the numbered list, nothing else.
- Each item must be one clear sentence.
- {3 if risk_level == "LOW" else 4 if risk_level == "MEDIUM" else 5} items maximum.
- Be specific to the density and risk level above.
- Do not include any introduction, summary, or closing remarks."""

    print("\n[Agent 3 — Recommendation]  (Gemini 2.0 Flash)")
    print(f"  Risk Level : {risk_level}  |  Density : {density} p/m²")

    try:
        model    = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        raw_text = response.text.strip()

        # Parse "1. Some text." → ["Some text.", ...]
        recommendations = []
        for line in raw_text.splitlines():
            line = line.strip()
            if not line:
                continue
            # Strip leading "1." / "1)" / "- " markers if present
            for prefix in range(1, 10):
                line = line.removeprefix(f"{prefix}.").removeprefix(f"{prefix})").strip()
            line = line.removeprefix("-").strip()
            if line:
                recommendations.append(line)

        if not recommendations:
            raise ValueError("Gemini returned an empty response.")

        ai_powered = True
        print("  Source     : Gemini AI")

    except Exception as e:
        # Graceful fallback — pipeline continues uninterrupted.
        print(f"  Source     : Fallback (Gemini error: {e})")
        recommendations = _FALLBACK_RECS[risk_level]
        ai_powered = False

    print(f"  Recommendations  :")
    for i, rec in enumerate(recommendations, 1):
        print(f"    {i}. {rec}")

    return {**assessment, "recommendations": recommendations, "ai_powered": ai_powered}


# =============================================================================
# AGENT 4: ALERT AGENT  (with Human-in-the-Loop)
# Responsibility:
#   - LOW / MEDIUM → log a standard status message.
#   - HIGH         → pause and ask a human operator to approve the alert
#                    before it is dispatched.
# =============================================================================

def alert_agent(recommendation: dict, auto_approve: bool = False) -> dict:
    """
    Dispatches alerts. For HIGH risk, requires human approval first.

    Args:
        recommendation (dict): Output from recommendation_agent.
        auto_approve (bool):   Set True to skip the input prompt (used in
                               automated test cases so they don't block).

    Returns:
        dict: full pipeline result + {alert_sent, alert_message}
    """
    risk_level = recommendation["risk_level"]

    print("\n[Agent 4 — Alert Agent]")

    # ------------------------------------------------------------------
    # LOW / MEDIUM — no human gate needed; log and continue.
    # ------------------------------------------------------------------
    if risk_level in ("LOW", "MEDIUM"):
        alert_message = (
            f"[STATUS] Risk level is {risk_level}. "
            "Situation under observation. No immediate alert required."
        )
        alert_sent = True
        print(f"  {alert_message}")

    # ------------------------------------------------------------------
    # HIGH — Human-in-the-Loop approval required before alert dispatch.
    # ------------------------------------------------------------------
    else:
        print("  ⚠️  HIGH RISK DETECTED — Human approval required.")
        print("  Recommended actions:")
        for i, rec in enumerate(recommendation["recommendations"], 1):
            print(f"    {i}. {rec}")

        if auto_approve:
            # Automated path: used by test cases to avoid blocking stdin.
            decision = "yes"
            print("  [Auto-approve mode] Decision: YES")
        else:
            # Interactive path: real operator makes the call.
            decision = input(
                "\n  >> Approve sending HIGH RISK alert? (yes/no): "
            ).strip().lower()

        if decision == "yes":
            alert_message = (
                "[CRITICAL ALERT] HIGH crowd density detected! "
                "Immediate intervention required. "
                "Emergency protocols have been activated."
            )
            alert_sent = True
            print(f"\n  ✅  Alert APPROVED and dispatched.")
            print(f"  {alert_message}")
        else:
            alert_message = (
                "[ALERT SUPPRESSED] Operator chose not to dispatch "
                "the HIGH RISK alert."
            )
            alert_sent = False
            print(f"\n  ❌  Alert SUPPRESSED by operator.")
            print(f"  {alert_message}")

    return {
        **recommendation,
        "alert_sent": alert_sent,
        "alert_message": alert_message,
    }


# =============================================================================
# PIPELINE RUNNER
# Chains all four agents together for a single scenario.
# =============================================================================

def run_crowdshield_pipeline(
    crowd_count: int,
    area: float,
    auto_approve: bool = False,
) -> dict:
    """
    Runs the complete CrowdShield AI multi-agent pipeline.

    Args:
        crowd_count (int): Number of people in the monitored area.
        area (float):      Size of the area in square metres.
        auto_approve (bool): Skip human prompt for HIGH alerts (testing).

    Returns:
        dict: Final result containing all intermediate outputs.
    """
    print("\n" + "=" * 60)
    print("  CrowdShield AI — Pipeline Start")
    print("=" * 60)

    # Agent 1 → Agent 2 → Agent 3 → Agent 4
    analysis       = crowd_analysis_agent(crowd_count, area)
    assessment     = risk_assessment_agent(analysis)
    recommendation = recommendation_agent(assessment)
    result         = alert_agent(recommendation, auto_approve=auto_approve)

    print("\n" + "=" * 60)
    print("  Pipeline Complete")
    print("=" * 60)

    return result


# =============================================================================
# SAMPLE TEST CASES
# =============================================================================

def run_test_cases():
    """
    Runs three predefined scenarios covering all three risk levels.
    auto_approve=True is used so HIGH-risk tests don't block for input.
    """
    test_cases = [
        {
            "label"       : "Test 1 — LOW Risk (sparse crowd)",
            "crowd_count" : 50,
            "area"        : 100.0,   # density = 0.5 → LOW
        },
        {
            "label"       : "Test 2 — MEDIUM Risk (moderate crowd)",
            "crowd_count" : 400,
            "area"        : 100.0,   # density = 4.0 → MEDIUM
        },
        {
            "label"       : "Test 3 — HIGH Risk (dangerously dense)",
            "crowd_count" : 800,
            "area"        : 100.0,   # density = 8.0 → HIGH
        },
    ]

    for tc in test_cases:
        print(f"\n\n{'#' * 60}")
        print(f"  {tc['label']}")
        print(f"{'#' * 60}")

        result = run_crowdshield_pipeline(
            crowd_count  = tc["crowd_count"],
            area         = tc["area"],
            auto_approve = True,   # Skip human prompt during automated tests
        )

        # Summary
        print(f"\n  --- Final Summary ---")
        print(f"  Density     : {result['density']} people/sq. metre")
        print(f"  Risk Level  : {result['risk_level']}")
        print(f"  Alert Sent  : {result['alert_sent']}")
        print(f"  Message     : {result['alert_message']}")


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    # Run all automated test cases first.
    run_test_cases()

    # -------------------------------------------------------------------
    # Interactive demo — comment this block out on Kaggle if not needed.
    # -------------------------------------------------------------------
    print("\n\n" + "=" * 60)
    print("  Interactive Mode — Enter your own scenario")
    print("=" * 60)

    try:
        crowd_count = int(input("  Enter crowd count : "))
        area        = float(input("  Enter area (sq m) : "))

        # auto_approve=False so the human gate activates for HIGH risk.
        run_crowdshield_pipeline(crowd_count, area, auto_approve=False)

    except ValueError as e:
        print(f"  Invalid input: {e}")