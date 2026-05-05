import type { GameState } from '../game/types'

type RewardScreenProps = {
  state: GameState
  onSelectCard: (cardId: string) => void
}

export default function RewardScreen({ state, onSelectCard }: RewardScreenProps) {
  return (
    <section className="screen reward-screen">
      <div className="hero-copy reward-copy">
        <p className="hero-kicker">전투 승리</p>
        <h1>보상 카드를 선택하세요</h1>
        <p className="hero-body">현재 체력 {state.player.hp} / {state.player.maxHp}로 다음 스테이지에 진입합니다.</p>
      </div>

      <div className="reward-grid">
        {state.rewardOptions.map((card) => (
          <button
            type="button"
            key={card.id}
            className={`reward-card type-${card.type}`}
            onClick={() => onSelectCard(card.id)}
          >
            <span className="card-type">{card.type}</span>
            <strong className="card-name">{card.name}</strong>
            <span className="card-text">{card.description}</span>
            <span className="card-action">획득하고 다음 스테이지</span>
          </button>
        ))}
      </div>
    </section>
  )
}
