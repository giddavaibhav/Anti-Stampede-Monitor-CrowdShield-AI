// Header.jsx — top bar with logo and system-online indicator
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <i className="ti ti-shield-lock" style={{ color: 'var(--cyan)', fontSize: 18 }} aria-hidden="true" />
      <span className={styles.logo}>
        CROWD<span className={styles.logoLight}>SHIELD</span> AI
      </span>
      <div className={styles.statusGroup}>
        <div className={styles.dot} />
        <span className={styles.statusLabel}>SYSTEM ONLINE</span>
      </div>
    </header>
  )
}
