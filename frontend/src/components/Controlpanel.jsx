// ControlPanel.jsx — left sidebar: inputs, quick scenarios, run/reset buttons
import { useState } from 'react'
import styles from './ControlPanel.module.css'

const SCENARIOS = [
  { label: 'SPARSE',   sub: 'LOW',    color: 'var(--green-c)', crowd: 50,   area: 100 },
  { label: 'MODERATE', sub: 'MEDIUM', color: 'var(--amber-c)', crowd: 400,  area: 100 },
  { label: 'DENSE',    sub: 'HIGH',   color: 'var(--red-c)',   crowd: 800,  area: 100 },
  { label: 'CRITICAL', sub: 'HIGH',   color: 'var(--red-c)',   crowd: 1200, area: 100 },
]

export default function ControlPanel({ onRun, onReset, running }) {
  const [crowd, setCrowd] = useState(400)
  const [area,  setArea]  = useState(100)

  function applyScenario(s) {
    setCrowd(s.crowd)
    setArea(s.area)
  }

  function handleAreaSlider(e) {
    setArea(Number(e.target.value))
  }

  function handleRun() {
    if (!crowd || !area || crowd < 1 || area <= 0) return
    onRun(crowd, area)
  }

  return (
    <aside className={styles.panel}>
      {/* ── Inputs ── */}
      <div>
        <p className={styles.sectionLabel}>Input Parameters</p>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Crowd Count</label>
            <div className={styles.inputWrap}>
              <i className="ti ti-users" aria-hidden="true" />
              <input
                className={styles.input}
                type="number"
                min={1}
                max={5000}
                value={crowd}
                onChange={e => setCrowd(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Area (sq. metres)</label>
            <div className={styles.inputWrap}>
              <i className="ti ti-layout-grid" aria-hidden="true" />
              <input
                className={styles.input}
                type="number"
                min={1}
                max={10000}
                value={area}
                onChange={e => setArea(Number(e.target.value))}
              />
            </div>
          </div>

          <div className={styles.sliderWrap}>
            <label className={styles.fieldLabel}>Area quick-set</label>
            <div className={styles.sliderRow}>
              <span className={styles.sliderEdge}>10m²</span>
              <span className={styles.sliderVal}>{area} m²</span>
              <span className={styles.sliderEdge}>2000m²</span>
            </div>
            <input
              type="range"
              min={10}
              max={2000}
              step={10}
              value={area}
              onChange={handleAreaSlider}
            />
          </div>
        </div>
      </div>

      {/* ── Quick Scenarios ── */}
      <div>
        <p className={styles.sectionLabel}>Quick Scenarios</p>
        <div className={styles.quickGrid}>
          {SCENARIOS.map(s => (
            <button
              key={s.label}
              className={styles.quickBtn}
              onClick={() => applyScenario(s)}
            >
              {s.label}<br />
              <span style={{ color: s.color }}>{s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button
          className={styles.runBtn}
          onClick={handleRun}
          disabled={running}
        >
          <i className="ti ti-player-play" aria-hidden="true" style={{ marginRight: 6, fontSize: 13 }} />
          ANALYZE CROWD
        </button>
        <button className={styles.resetBtn} onClick={onReset}>
          <i className="ti ti-refresh" aria-hidden="true" style={{ marginRight: 6 }} />
          RESET PIPELINE
        </button>
      </div>
    </aside>
  )
}
