// HitlBanner.jsx — shown when risk is HIGH; operator approves or suppresses alert
import styles from './HitlBanner.module.css'

export default function HitlBanner({ visible, onDecide }) {
  if (!visible) return null
  return (
    <div className={styles.banner}>
      <div className={styles.title}>
        <i className="ti ti-alert-triangle" aria-hidden="true" />
        HUMAN APPROVAL REQUIRED
      </div>
      <p className={styles.msg}>
        HIGH risk crowd density detected. As the safety operator, you must review
        and approve this critical alert before it is dispatched to emergency services
        and on-ground personnel.
      </p>
      <div className={styles.btns}>
        <button className={styles.approve} onClick={() => onDecide(true)}>
          <i className="ti ti-check" aria-hidden="true" />
          APPROVE &amp; DISPATCH
        </button>
        <button className={styles.deny} onClick={() => onDecide(false)}>
          <i className="ti ti-x" aria-hidden="true" />
          SUPPRESS ALERT
        </button>
      </div>
    </div>
  )
}
