type StatusPanelProps = {
  title: string
  hp: number
  maxHp: number
  block: number
  poison: number
  attackBonus?: number
  pendingDrawPenalty?: number
}

export default function StatusPanel({
  title,
  hp,
  maxHp,
  block,
  poison,
  attackBonus = 0,
  pendingDrawPenalty = 0,
}: StatusPanelProps) {
  const hpRatio = Math.max(0, (hp / maxHp) * 100)

  return (
    <article className="panel status-panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        <span className="status-chip">{hp} / {maxHp}</span>
      </div>
      <div className="hp-track" aria-label={`${title} 체력`}>
        <div className="hp-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      <dl className="stats-grid">
        <div>
          <dt>Block</dt>
          <dd>{block}</dd>
        </div>
        <div>
          <dt>Poison</dt>
          <dd>{poison}</dd>
        </div>
        <div>
          <dt>Buff</dt>
          <dd>{attackBonus}</dd>
        </div>
        <div>
          <dt>Draw Penalty</dt>
          <dd>{pendingDrawPenalty}</dd>
        </div>
      </dl>
    </article>
  )
}
