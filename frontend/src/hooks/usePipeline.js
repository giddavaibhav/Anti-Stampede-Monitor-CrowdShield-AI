// usePipeline.js
// Owns all pipeline state and the simulation that drives the four agents.
// The UI components stay pure — they only read state and call the returned handlers.

import { useState, useCallback } from 'react'
import { analyzeCrowd } from '../services/api'

// ── Icon map for recommendations returned by the real backend ────────────────
// The backend returns plain strings; we assign icons by risk level + position.
const REC_ICONS = {
  LOW:    ['ti-eye', 'ti-eye', 'ti-eye'],
  MEDIUM: ['ti-camera', 'ti-user-check', 'ti-barrier-block'],
  HIGH:   ['ti-shield-check', 'ti-door-exit', 'ti-arrow-bounce', 'ti-speakerphone', 'ti-truck-emergency'],
}

// Convert a plain string array from the API into { icon, text } objects.
function toRecObjects(strings, risk) {
  const icons = REC_ICONS[risk] || []
  return strings.map((text, i) => ({
    icon: icons[i] || 'ti-alert-circle',
    text,
  }))
}

// ── Initial / reset state ────────────────────────────────────────────────────
const INITIAL = {
  phase: 'idle',        // idle | running | hitl | done | error
  agents: {             // per-agent display state
    1: { status: 'standby', data: {} },
    2: { status: 'standby', data: {} },
    3: { status: 'standby', data: {} },
    4: { status: 'standby', data: {} },
  },
  connectors: { 1: false, 2: false, 3: false },
  result: null,         // final pipeline output
  hitlApproved: null,   // true | false | null
  error: null,          // error message string | null
}

const delay = ms => new Promise(r => setTimeout(r, ms))

export function usePipeline() {
  const [state, setState] = useState(INITIAL)

  // Convenience: merge a partial update into state
  const patch = useCallback(partial =>
    setState(prev => ({ ...prev, ...partial })), [])

  const patchAgent = useCallback((id, partial) =>
    setState(prev => ({
      ...prev,
      agents: {
        ...prev.agents,
        [id]: { ...prev.agents[id], ...partial },
      },
    })), [])

  // ── Main pipeline run ────────────────────────────────────────────────────
  const run = useCallback(async (crowdCount, area) => {
    // Reset everything first
    setState({ ...INITIAL, phase: 'running' })
    await delay(150)

    // ── Agent 1: Crowd Analysis (animate, then show input values) ────────
    patchAgent(1, { status: 'processing' })
    await delay(900)
    const localDensity = parseFloat((crowdCount / area).toFixed(2))
    patchAgent(1, {
      status: 'done',
      data: { crowdCount, area, density: localDensity },
    })
    setState(prev => ({ ...prev, connectors: { ...prev.connectors, 1: true } }))
    await delay(500)

    // ── Agent 2: Risk Assessment (animate while real API call runs) ──────
    patchAgent(2, { status: 'processing' })
    await delay(400)

    let result
    try {
      result = await analyzeCrowd(crowdCount, area)
    } catch (err) {
      patch({ phase: 'error', error: err.message })
      return
    }

    // Unpack real backend response
    const { density, risk_level: risk, recommendations, ai_powered } = result
    const recs = toRecObjects(recommendations, risk)

    patchAgent(2, {
      status: 'done',
      data: { density, risk },
    })
    setState(prev => ({ ...prev, connectors: { ...prev.connectors, 2: true } }))
    await delay(500)

    // ── Agent 3: Recommendation (display Gemini results) ─────────────────
    patchAgent(3, { status: 'processing' })
    await delay(600)
    patchAgent(3, {
      status: 'done',
      data: { risk, recs, ai_powered },
    })
    setState(prev => ({ ...prev, connectors: { ...prev.connectors, 3: true } }))
    await delay(500)

    // ── Agent 4: Alert ────────────────────────────────────────────────────
    patchAgent(4, { status: 'processing' })
    await delay(700)
    patchAgent(4, { status: 'done', data: { risk } })

    if (risk !== 'HIGH') {
      patch({
        phase: 'done',
        result: { risk, density, crowdCount, area, recs, ai_powered, alertSent: true },
      })
    } else {
      // Pause for human-in-the-loop approval
      patch({
        phase: 'hitl',
        result: { risk, density, crowdCount, area, recs, ai_powered },
      })
    }
  }, [patch, patchAgent])

  // ── HITL decision ─────────────────────────────────────────────────────────
  const decide = useCallback((approved) => {
    setState(prev => ({
      ...prev,
      phase: 'done',
      hitlApproved: approved,
      result: { ...prev.result, alertSent: approved },
    }))
  }, [])

  const reset = useCallback(() => setState(INITIAL), [])

  return { state, run, decide, reset }
}