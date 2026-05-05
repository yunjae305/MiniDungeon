import type { CardDefinition } from '../game/types'

type CardItemProps = {
  card: CardDefinition
  onUseCard: (cardId: string) => void
}

export default function CardItem({ card, onUseCard }: CardItemProps) {
  return (
    <button type="button" className={`card-item type-${card.type}`} onClick={() => onUseCard(card.id)}>
      <span className="card-type">{card.type}</span>
      <strong className="card-name">{card.name}</strong>
      <span className="card-text">{card.description}</span>
      <span className="card-action">선택</span>
    </button>
  )
}
