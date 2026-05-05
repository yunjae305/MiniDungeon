import type { GameState } from '../game/types'

type ResultScreenProps = {
  state: GameState
  onRestart: () => void
}

export default function ResultScreen({ state, onRestart }: ResultScreenProps) {
  const isClear = state.result === 'clear'

  return (
    <section className="screen result-screen">
      <div className="hero-copy">
        <p className="hero-kicker">{isClear ? '던전 정복' : '원정 종료'}</p>
        <h1>{isClear ? '게임 클리어' : '게임 오버'}</h1>
        <p className="hero-body">
          총 {state.stats.turns}턴 동안 {state.stats.cardsEarned}장의 보상 카드를 모았습니다.
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
              <dt>도달 스테이지</dt>
              <dd>{state.stage}</dd>
            </div>
            <div>
              <dt>최종 덱 수</dt>
              <dd>{state.deck.length}</dd>
            </div>
          </dl>
        </article>

        <article className="info-panel">
          <h2>마지막 로그</h2>
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
    </section>
  )
}
