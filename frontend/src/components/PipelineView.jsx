// PipelineView.jsx — right panel: idle screen or live agent pipeline
import AgentCard   from './AgentCard'
import HitlBanner  from './HitlBanner'
import AlertResult from './AlertResult'
import styles      from './PipelineView.module.css'

const AGENTS = [
  { num: 1, name: 'CROWD ANALYSIS'  },
  { num: 2, name: 'RISK ASSESSMENT' },
  { num: 3, name: 'RECOMMENDATION'  },
  { num: 4, name: 'ALERT SYSTEM'    },
]

function Connector({ visible }) {
  return (
    <div className={`${styles.connector} ${visible ? styles.connectorVisible : ''}`}>
      <div className={styles.connLine} />
      <i className="ti ti-arrow-down" aria-hidden="true" />
      <div className={styles.connLine} />
    </div>
  )
}

export default function PipelineView({ state, onDecide }) {
  const { phase, agents, connectors, result } = state

  if (phase === 'idle') {
    return (
      <div className={styles.idle}>
        <i className="ti ti-radar-2" style={{ fontSize: 48, color: 'var(--cyan)' }} aria-hidden="true" />
        <p className={styles.idleTitle}>AWAITING CROWD DATA</p>
        <p className={styles.idleSub}>Configure parameters and run analysis</p>
      </div>
    )
  }

  return (
    <div className={styles.pipeline}>
      {AGENTS.map(({ num, name }, idx) => (
        <>
          <AgentCard
            key={num}
            num={num}
            name={name}
            status={agents[num].status}
            data={agents[num].data}
            phase={phase}
          />
          {idx < 3 && <Connector key={`conn-${num}`} visible={connectors[num]} />}
        </>
      ))}

      <HitlBanner
        visible={phase === 'hitl'}
        onDecide={onDecide}
      />

      {phase === 'done' && <AlertResult result={result} />}
    </div>
  )
}
