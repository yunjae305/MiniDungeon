import { getEnemyIntent } from '../game/engine'
import type { BattleEffect, EnemyState } from '../game/types'

const behaviorModeLabel = {
  sequential: '순차',
  weighted_random: '무작위',
} satisfies Record<NonNullable<EnemyState['behaviorMode']>, string>

type EnemyPanelProps = {
  enemy: EnemyState
  effects: BattleEffect[]
}

export default function EnemyPanel({ enemy, effects }: EnemyPanelProps) {
  const hpRatio = Math.max(0, (enemy.hp / enemy.maxHp) * 100)
  const intent = getEnemyIntent(enemy)
  const mode = behaviorModeLabel[enemy.behaviorMode ?? 'sequential']

  return (
    <article className="panel enemy-panel">
      <div className="battle-effect-layer">
        {effects.map((effect) => (
          <span key={effect.id} className={`battle-effect tone-${effect.tone}`}>
            {effect.tone === 'heal' ? '+' : '-'}
            {effect.value}
          </span>
        ))}
      </div>
      <div className="panel-heading">
        <h2>{enemy.name}</h2>
        <span className="status-chip enemy-chip">다음 행동: {intent.label}</span>
      </div>
      <div className="hp-track enemy-track" aria-label={`${enemy.name} 체력`}>
        <div className="hp-fill enemy-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      <dl className="stats-grid">
        <div>
          <dt>체력</dt>
          <dd>{enemy.hp}</dd>
        </div>
        <div>
          <dt>방어도</dt>
          <dd>{enemy.block}</dd>
        </div>
        <div>
          <dt>중독</dt>
          <dd>{enemy.poison}</dd>
        </div>
        <div>
          <dt>행동 방식</dt>
          <dd>{mode}</dd>
        </div>
        <div>
          <dt>턴</dt>
          <dd>{enemy.actionIndex + 1}</dd>
        </div>
      </dl>
    </article>
  )
}
