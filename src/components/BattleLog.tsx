type BattleLogProps = {
  logs: string[]
}

export default function BattleLog({ logs }: BattleLogProps) {
  return (
    <section className="panel log-panel">
      <div className="panel-heading">
        <h2>전투 로그</h2>
        <span className="status-chip">{logs.length}개</span>
      </div>
      <ol className="log-list">
        {logs.toReversed().map((log, index) => (
          <li key={`${index}-${log}`}>{log}</li>
        ))}
      </ol>
    </section>
  )
}
