import type { GameState } from '../game/types'
import RelicBar from './RelicBar'

type ResultScreenProps = {
  state: GameState
  onRestart: () => void
}

export default function ResultScreen({ state, onRestart }: ResultScreenProps) {
  const isClear = state.result === 'clear'

  return (
    <section className="screen result-screen">
      <div className="hero-copy">
        <p className="hero-kicker">{isClear ? '탐험 성공' : '탐험 실패'}</p>
        <h1>{isClear ? '던전 정복 완료' : '게임 오버'}</h1>
        <p className="hero-body">
          총 {state.stats.turns}턴 동안 전투 {state.stats.battlesWon}회를 돌파했고 엘리트 {state.stats.elitesWon}회를 제압했습니다.
        </p>
      </div>

      <div className="result-grid">
        <article className="info-panel">
          <h2>최종 기록</h2>
          <dl className="summary-list">
            <div>
              <dt>남은 체력</dt>
              <dd>{state.player.hp}</dd>
            </div>
            <div>
              <dt>도달 층</dt>
              <dd>{state.stage}</dd>
            </div>
            <div>
              <dt>보유 골드</dt>
              <dd>{state.gold}</dd>
            </div>
            <div>
              <dt>덱 크기</dt>
              <dd>{state.deck.length}</dd>
            </div>
          </dl>
        </article>

        <article className="info-panel">
          <h2>최근 전투 기록</h2>
          <ul className="bullet-list compact-list">
            {state.logs.toReversed().slice(0, 5).map((log, index) => (
              <li key={`${index}-${log}`}>{log}</li>
            ))}
          </ul>
          <button type="button" className="primary-button" onClick={onRestart}>
            다시 시작
          </button>
        </article>
      </div>

      <RelicBar relicIds={state.relics} />
    </section>
  )
}
