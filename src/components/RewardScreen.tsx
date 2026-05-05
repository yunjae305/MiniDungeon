import { useState } from 'react'
import type { CardDefinition, GameState } from '../game/types'

const cardTypeLabel = {
  attack: '공격',
  defense: '방어',
  heal: '회복',
  debuff: '약화',
  buff: '강화',
} satisfies Record<CardDefinition['type'], string>

type RewardScreenProps = {
  state: GameState
  onSelectCard: (cardId: string | null) => void
}

export default function RewardScreen({ state, onSelectCard }: RewardScreenProps) {
  const [showDeck, setShowDeck] = useState(false)
  const deckSummary = Object.values(
    state.deck.reduce<Record<string, { id: string; name: string; type: CardDefinition['type']; cost: number; count: number }>>(
      (summary, card) => {
        const existing = summary[card.id]

        if (existing) {
          existing.count += 1
          return summary
        }

        summary[card.id] = {
          id: card.id,
          name: card.name,
          type: card.type,
          cost: card.cost,
          count: 1,
        }

        return summary
      },
      {},
    ),
  )

  return (
    <section className="screen reward-screen">
      <div className="hero-copy reward-copy">
        <p className="hero-kicker">전투 승리</p>
        <h1>보상 카드를 선택하세요</h1>
        <p className="hero-body">
          현재 체력은 {state.player.hp} / {state.player.maxHp}이며, 선택을 마치면 다음 스테이지로 이동합니다.
        </p>
      </div>

      <div className="reward-actions">
        <button type="button" className="secondary-button" onClick={() => setShowDeck(true)}>
          현재 덱 보기
        </button>
        <button type="button" className="secondary-button" onClick={() => onSelectCard(null)}>
          보상 받지 않기
        </button>
      </div>

      <div className="reward-grid">
        {state.rewardOptions.map((card) => (
          <button
            type="button"
            key={card.id}
            className={`reward-card type-${card.type}`}
            onClick={() => onSelectCard(card.id)}
          >
            <div className="card-meta">
              <span className="card-type">{cardTypeLabel[card.type]}</span>
              <span className="card-cost">비용 {card.cost}</span>
            </div>
            <strong className="card-name">{card.name}</strong>
            <span className="card-text">{card.description}</span>
            <span className="card-action">덱에 추가하기</span>
          </button>
        ))}
      </div>

      {showDeck && (
        <div className="deck-overlay" role="dialog" aria-modal="true">
          <div className="deck-dialog">
            <div className="panel-heading">
              <h2>현재 덱</h2>
              <button type="button" className="secondary-button deck-close" onClick={() => setShowDeck(false)}>
                닫기
              </button>
            </div>
            <div className="deck-list">
              {deckSummary.map((card) => (
                <div key={card.id} className={`deck-entry type-${card.type}`}>
                  <strong>{card.name}</strong>
                  <span>{cardTypeLabel[card.type]}</span>
                  <span>비용 {card.cost}</span>
                  <span>x{card.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
