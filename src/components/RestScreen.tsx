import type { GameState } from '../game/types'
import RelicBar from './RelicBar'

type RestScreenProps = {
  state: GameState
  onResolve: () => void
}

export default function RestScreen({ state, onResolve }: RestScreenProps) {
  return (
    <section className="screen rest-screen">
      <div className="hero-copy">
        <p className="hero-kicker">모닥불</p>
        <h1>잠시 숨을 고르세요</h1>
        <p className="hero-body">
          불빛 곁에서 상처를 정리하면 체력 12를 회복하고 다음 분기점으로 이동합니다.
        </p>
      </div>

      <div className="result-grid">
        <article className="info-panel">
          <h2>현재 상태</h2>
          <dl className="summary-list">
            <div>
              <dt>체력</dt>
              <dd>{state.player.hp} / {state.player.maxHp}</dd>
            </div>
            <div>
              <dt>골드</dt>
              <dd>{state.gold}</dd>
            </div>
            <div>
              <dt>보유 유물</dt>
              <dd>{state.relics.length}</dd>
            </div>
          </dl>
        </article>

        <article className="info-panel accent-panel">
          <h2>휴식 효과</h2>
          <ul className="bullet-list">
            <li>체력 12 회복</li>
            <li>현재 경로 해소 후 다음 층 분기로 복귀</li>
          </ul>
          <button type="button" className="primary-button" onClick={onResolve}>
            휴식 마치기
          </button>
        </article>
      </div>

      <RelicBar relicIds={state.relics} />
    </section>
  )
}
