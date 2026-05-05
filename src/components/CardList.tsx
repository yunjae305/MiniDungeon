import type { CardDefinition } from '../game/types'
import CardItem from './CardItem'

type CardListProps = {
  cards: CardDefinition[]
  energy: number
  onUseCard: (cardId: string) => void
}

export default function CardList({ cards, energy, onUseCard }: CardListProps) {
  return (
    <section className="panel hand-panel">
      <div className="panel-heading">
        <h2>현재 손패</h2>
        <span className="status-chip">{cards.length}장</span>
      </div>
      <div className="card-list">
        {cards.map((card, index) => (
          <CardItem
            key={`${card.id}-${index}`}
            card={card}
            canUseCard={card.cost <= energy}
            onUseCard={onUseCard}
          />
        ))}
      </div>
    </section>
  )
}
