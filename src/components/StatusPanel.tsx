import type { BattleEffect } from '../game/types'

type StatusPanelProps = {
  title: string
  hp: number
  maxHp: number
  block: number
  poison: number
  attackBonus?: number
  pendingDrawPenalty?: number
  energy: number
  maxEnergy: number
  effects: BattleEffect[]
  isHit?: boolean
}

export default function StatusPanel({
  title,
  hp,
  maxHp,
  block,
  poison,
  attackBonus = 0,
  pendingDrawPenalty = 0,
  energy,
  maxEnergy,
  effects,
  isHit = false,
}: StatusPanelProps) {
  const hpRatio = Math.max(0, (hp / maxHp) * 100)

  return (
    <article className={`panel status-panel${isHit ? ' is-hit' : ''}`}>
      <div className="battle-effect-layer">
        {effects.map((effect) => (
          <span key={effect.id} className={`battle-effect tone-${effect.tone}`}>
            {effect.tone === 'heal' ? '+' : '-'}
            {effect.value}
          </span>
        ))}
      </div>
      <div className="panel-heading">
        <h2>{title}</h2>
        <span className="status-chip">{hp} / {maxHp}</span>
      </div>
      <div className="hp-track" aria-label={`${title} 체력`}>
        <div className="hp-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      <dl className="stats-grid">
        <div>
          <dt>에너지</dt>
          <dd>{energy} / {maxEnergy}</dd>
        </div>
        <div>
          <dt>방어도</dt>
          <dd>{block}</dd>
        </div>
        <div>
          <dt>중독</dt>
          <dd>{poison}</dd>
        </div>
        <div>
          <dt>강화</dt>
          <dd>{attackBonus}</dd>
        </div>
        <div>
          <dt>드로우 감소</dt>
          <dd>{pendingDrawPenalty}</dd>
        </div>
      </dl>
    </article>
  )
}
