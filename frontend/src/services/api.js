// services/api.js
// Connects the React frontend to the CrowdShield AI FastAPI backend.

const API_BASE = "http://127.0.0.1:8000";

/**
 * Sends crowd data to the backend pipeline (Agents 1–3).
 *
 * @param {number} crowd_count - Number of people in the area.
 * @param {number} area        - Area in square metres.
 * @returns {Promise<Object>}  - { crowd_count, area, density, risk_level, recommendations, ai_powered }
 */
export async function analyzeCrowd(crowd_count, area) {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crowd_count, area }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}