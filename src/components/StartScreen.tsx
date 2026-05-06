import { useState } from 'react'

type StartScreenProps = {
  onStart: (seed: string) => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [seed, setSeed] = useState('20260506')

  return (
    <section className="screen start-screen">
      <div className="hero-copy">
        <p className="hero-kicker">카드 배틀 / 미니 로그라이크</p>
        <h1>미니 던전 카드</h1>
        <p className="hero-body">
          시드 기반 절차적 맵 위에서 경로를 고르고, 상태 이상과 유물 시너지를 엮어 다섯 층 던전을 돌파하세요.
        </p>
      </div>

      <div className="start-grid">
        <div className="info-panel">
          <h2>핵심 시스템</h2>
          <ul className="bullet-list">
            <li>중독과 취약이 턴 종료 페이즈에서 차감되며 다음 계산에 직접 반영됩니다.</li>
            <li>적의 다음 행동 의도를 먼저 보고 손패와 에너지를 맞춰 대응할 수 있습니다.</li>
            <li>전투, 엘리트, 휴식, 상점을 포함한 노드 맵이 시드마다 같은 구조로 재생성됩니다.</li>
            <li>엘리트와 상점에서 얻은 유물이 조건부 지속 효과를 만들어 전투 루프를 바꿉니다.</li>
          </ul>
        </div>

        <div className="info-panel accent-panel">
          <h2>탐험 시작</h2>
          <label className="seed-field">
            <span>던전 시드</span>
            <input value={seed} onChange={(event) => setSeed(event.target.value)} />
          </label>
          <div className="starter-stack">
            <span>일격</span>
            <span>방어</span>
            <span>치유</span>
            <span>독침</span>
            <span>집중</span>
          </div>
          <button type="button" className="primary-button" onClick={() => onStart(seed)}>
            탐험 시작
          </button>
        </div>
      </div>
    </section>
  )
}
