// App.jsx — root component; wires ControlPanel ↔ usePipeline ↔ PipelineView
import { usePipeline }   from './hooks/usePipeline'
import Header            from './components/Header'
import ControlPanel      from './components/ControlPanel'
import PipelineView      from './components/PipelineView'
import styles            from './App.module.css'

export default function App() {
  const { state, run, decide, reset } = usePipeline()
  const running = state.phase === 'running' || state.phase === 'hitl'

  return (
    <div className={styles.root}>
      <Header />
      <div className={styles.body}>
        <ControlPanel onRun={run} onReset={reset} running={running} />
        <main className={styles.main}>
          <PipelineView state={state} onDecide={decide} />
        </main>
      </div>
    </div>
  )
}
