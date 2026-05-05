type StartScreenProps = {
  onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <section className="screen start-screen">
      <div className="hero-copy">
        <p className="hero-kicker">턴제 카드 배틀 / 미니 로그라이크</p>
        <h1>Mini Dungeon Cards</h1>
        <p className="hero-body">
          매 턴 3장의 카드 중 1장을 골라 던전을 돌파하세요. 승리할 때마다 새 카드를 얻고 5스테이지 보스를
          쓰러뜨리면 클리어입니다.
        </p>
      </div>

      <div className="start-grid">
        <div className="info-panel">
          <h2>핵심 규칙</h2>
          <ul className="bullet-list">
            <li>시작 덱 5장으로 1스테이지 전투를 시작합니다.</li>
            <li>카드 효과 뒤에 적이 즉시 행동합니다.</li>
            <li>독은 턴 종료 시 피해를 주고 1씩 줄어듭니다.</li>
            <li>전투 승리 후 보상 카드 3장 중 1장을 얻습니다.</li>
          </ul>
        </div>

        <div className="info-panel accent-panel">
          <h2>시작 카드</h2>
          <div className="starter-stack">
            <span>Strike</span>
            <span>Guard</span>
            <span>Heal</span>
            <span>Poison Dart</span>
            <span>Focus</span>
          </div>
          <button type="button" className="primary-button" onClick={onStart}>
            게임 시작
          </button>
        </div>
      </div>
    </section>
  )
}
