type StartScreenProps = {
  onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <div className="hero-copy">
        <p className="hero-kicker">카드 배틀 / 미니 로그라이크</p>
        <h1>미니 던전 카드</h1>
        <p className="hero-body">
          덱을 강화하고 에너지를 관리하며 다섯 개 스테이지를 돌파해 던전 보스를 쓰러뜨리세요.
        </p>
      </div>

      <div className="start-grid">
        <div className="info-panel">
          <h2>진행 규칙</h2>
          <ul className="bullet-list">
            <li>기본 카드 5장과 턴마다 주어지는 에너지 3으로 시작합니다.</li>
            <li>에너지가 남아 있으면 한 턴에 여러 장의 카드를 사용할 수 있습니다.</li>
            <li>에너지가 모두 떨어지거나 직접 턴을 끝내면 적이 행동합니다.</li>
            <li>승리할 때마다 보상 카드 1장을 고르거나 건너뛸 수 있습니다.</li>
          </ul>
        </div>

        <div className="info-panel accent-panel">
          <h2>시작 카드</h2>
          <div className="starter-stack">
            <span>일격</span>
            <span>방어</span>
            <span>치유</span>
            <span>독침</span>
            <span>집중</span>
          </div>
          <button type="button" className="primary-button" onClick={onStart}>
            탐험 시작
          </button>
        </div>
      </div>
    </section>
  )
}
