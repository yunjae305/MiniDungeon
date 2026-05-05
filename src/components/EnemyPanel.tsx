import { getEnemyIntent } from '../game/engine'
import type { EnemyState } from '../game/types'

type EnemyPanelProps = {
  enemy: EnemyState
}

export default function EnemyPanel({ enemy }: EnemyPanelProps) {
  const hpRatio = Math.max(0, (enemy.hp / enemy.maxHp) * 100)
  const intent = getEnemyIntent(enemy)

  return (
    <article className="panel enemy-panel">
      <div className="panel-heading">
        <h2>{enemy.name}</h2>
        <span className="status-chip enemy-chip">다음 행동: {intent.label}</span>
      </div>
      <div className="hp-track enemy-track" aria-label={`${enemy.name} 체력`}>
        <div className="hp-fill enemy-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      <dl className="stats-grid">
        <div>
          <dt>HP</dt>
          <dd>{enemy.hp}</dd>
        </div>
        <div>
          <dt>Block</dt>
          <dd>{enemy.block}</dd>
        </div>
        <div>
          <dt>Poison</dt>
          <dd>{enemy.poison}</dd>
        </div>
        <div>
          <dt>Pattern</dt>
          <dd>{enemy.actionIndex + 1}</dd>
        </div>
      </dl>
    </article>
  )
}
