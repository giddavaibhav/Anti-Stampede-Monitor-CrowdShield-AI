// AlertResult.jsx — final outcome displayed after HITL decision (or LOW/MEDIUM auto-close)
import styles from './AlertResult.module.css'

export default function AlertResult({ result }) {
  if (!result) return null

  const dispatched = result.alertSent

  if (dispatched) {
    const msg = result.risk === 'HIGH'
      ? '[CRITICAL ALERT DISPATCHED] HIGH crowd density confirmed. Emergency protocols activated. All units notified. Emergency exits opening. Crowd being redirected.'
      : `[STATUS] Risk level is ${result.risk}. Situation under observation. No immediate alert required.`

    return (
      <div className={styles.dispatched}>
        <i className="ti ti-circle-check" style={{ color: 'var(--green-c)', fontSize: 22 }} aria-hidden="true" />
        <p className={styles.dispatchedMsg}>{msg}</p>
      </div>
    )
  }

  return (
    <div className={styles.suppressed}>
      <i className="ti ti-circle-x" style={{ color: 'var(--text-muted)', fontSize: 22 }} aria-hidden="true" />
      <p className={styles.suppressedMsg}>
        ALERT SUPPRESSED — Operator chose not to dispatch the HIGH RISK alert. Situation remains under manual watch.
      </p>
    </div>
  )
}
