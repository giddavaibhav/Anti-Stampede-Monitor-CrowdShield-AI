// AgentCard.jsx — one pipeline step (used 4 times)
// status: 'standby' | 'processing' | 'done'
import styles from './AgentCard.module.css'

const RISK_COLOR = {
  LOW:    'var(--green-c)',
  MEDIUM: 'var(--amber-c)',
  HIGH:   'var(--red-c)',
}

function StatusBadge({ status }) {
  const cls = status === 'processing' ? styles.statusProcessing
            : status === 'done'       ? styles.statusDone
            :                           styles.statusStandby
  const label = status === 'processing' ? 'PROCESSING'
              : status === 'done'       ? 'DONE'
              :                           'STANDBY'
  return <span className={`${styles.status} ${cls}`}>{label}</span>
}

// ── Agent 1 body ─────────────────────────────────────────────────────────────
function Agent1Body({ data }) {
  if (!data?.density) return <p className={styles.placeholder}>Awaiting input…</p>
  const pct  = Math.min(100, (data.density / 10) * 100)
  const color = data.density <= 3 ? 'var(--green-c)'
              : data.density <= 5 ? 'var(--amber-c)'
              :                     'var(--red-c)'
  return (
    <div className={styles.grid2}>
      <KV label="CROWD COUNT" value={data.crowdCount.toLocaleString()} />
      <KV label="AREA"        value={`${data.area} m²`} />
      <div style={{ gridColumn: '1 / -1' }}>
        <KV label="COMPUTED DENSITY" value={`${data.density.toFixed(2)} p/m²`} large accent />
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className={styles.thresholds}>
          <span style={{ color: 'var(--green-c)' }}>0 LOW</span>
          <span style={{ color: 'var(--amber-c)' }}>3 MED</span>
          <span style={{ color: 'var(--red-c)'   }}>5 HIGH</span>
          <span style={{ color: 'var(--text-muted)' }}>10+</span>
        </div>
      </div>
    </div>
  )
}

// ── Agent 2 body ─────────────────────────────────────────────────────────────
function Agent2Body({ data }) {
  if (!data?.risk) return <p className={styles.placeholder}>Awaiting density…</p>
  const threshMap = {
    LOW:    'density ≤ 3 → LOW',
    MEDIUM: 'density ≤ 5 → MEDIUM',
    HIGH:   'density > 5 → HIGH',
  }
  return (
    <div className={styles.grid2}>
      <KV label="THRESHOLD CHECK" value={threshMap[data.risk]} />
      <KV label="RISK LEVEL"      value={data.risk} large
          style={{ color: RISK_COLOR[data.risk],
                   animation: data.risk === 'HIGH' ? 'risk-pulse 1s infinite' : undefined }} />
    </div>
  )
}

// ── Agent 3 body ─────────────────────────────────────────────────────────────
function Agent3Body({ data }) {
  if (!data?.recs) return <p className={styles.placeholder}>Awaiting risk level…</p>
  const color = RISK_COLOR[data.risk]
  return (
    <ul className={styles.recList}>
      {data.recs.map((r, i) => (
        <li key={i} className={styles.recItem}>
          <i className={`ti ${r.icon}`} style={{ color, fontSize: 14, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>{r.text}</span>
        </li>
      ))}
    </ul>
  )
}

// ── Agent 4 body ─────────────────────────────────────────────────────────────
function Agent4Body({ data, phase }) {
  if (!data?.risk) return <p className={styles.placeholder}>Awaiting risk assessment…</p>
  if (phase === 'hitl' || (data.risk === 'HIGH' && phase !== 'done')) {
    return <p className={styles.escalating}>Escalating to operator — awaiting human approval.</p>
  }
  if (data.risk !== 'HIGH') {
    return (
      <p className={styles.statusMsg} style={{ color: RISK_COLOR[data.risk] }}>
        [STATUS] Risk level is {data.risk}. Situation under observation. No immediate alert required.
      </p>
    )
  }
  return null
}

// ── Shared KV row ─────────────────────────────────────────────────────────────
function KV({ label, value, large, accent, style }) {
  return (
    <div className={styles.kv}>
      <span className={styles.kvKey}>{label}</span>
      <span
        className={styles.kvVal}
        style={{ fontSize: large ? 18 : undefined, color: accent ? 'var(--cyan)' : undefined, ...style }}
      >
        {value}
      </span>
    </div>
  )
}

// ── Main AgentCard ────────────────────────────────────────────────────────────
export default function AgentCard({ num, name, status, data, phase }) {
  const isActive = status === 'processing'
  const isDone   = status === 'done'

  return (
    <div className={`${styles.card} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}>
      {isActive && <div className={styles.scanLine} />}

      <div className={styles.cardHeader}>
        <span className={styles.agentNum}>AGENT 0{num}</span>
        <span className={styles.agentName}>{name}</span>
        <StatusBadge status={status} />
      </div>

      {num === 1 && <Agent1Body data={data} />}
      {num === 2 && <Agent2Body data={data} />}
      {num === 3 && <Agent3Body data={data} />}
      {num === 4 && <Agent4Body data={data} phase={phase} />}
    </div>
  )
}
