import type { CardDefinition } from '../game/types'

const cardTypeLabel = {
  attack: '공격',
  defense: '방어',
  heal: '회복',
  debuff: '약화',
  buff: '강화',
} satisfies Record<CardDefinition['type'], string>

type CardItemProps = {
  card: CardDefinition
  canUseCard: boolean
  onUseCard: (cardId: string) => void
}

export default function CardItem({ card, canUseCard, onUseCard }: CardItemProps) {
  return (
    <button
      type="button"
      className={`card-item type-${card.type}${canUseCard ? '' : ' is-disabled'}`}
      disabled={!canUseCard}
      onClick={() => onUseCard(card.id)}
    >
      <div className="card-meta">
        <span className="card-type">{cardTypeLabel[card.type]}</span>
        <span className="card-cost">비용 {card.cost}</span>
      </div>
      <strong className="card-name">{card.name}</strong>
      <span className="card-text">{card.description}</span>
      <span className="card-action">{canUseCard ? '카드 사용' : '에너지 부족'}</span>
    </button>
  )
}
