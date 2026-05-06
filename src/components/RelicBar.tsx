import { relicsById } from '../game/relics'

type RelicBarProps = {
  relicIds: string[]
}

export default function RelicBar({ relicIds }: RelicBarProps) {
  return (
    <section className="panel relic-panel">
      <div className="panel-heading">
        <h2>보유 유물</h2>
        <span className="status-chip">{relicIds.length}개</span>
      </div>
      <div className="relic-grid">
        {relicIds.length === 0 && <span className="empty-copy">아직 획득한 유물이 없습니다.</span>}
        {relicIds.map((relicId) => {
          const relic = relicsById[relicId]

          return (
            <article key={relic.id} className="relic-card">
              <strong>{relic.name}</strong>
              <span>{relic.description}</span>
            </article>
          )
        })}
      </div>
    </section>
  )
}
