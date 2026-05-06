import type { CardDefinition, GameState } from '../game/types'
import RelicBar from './RelicBar'

const cardTypeLabel = {
  attack: '공격',
  defense: '방어',
  heal: '회복',
  debuff: '약화',
  buff: '강화',
} satisfies Record<CardDefinition['type'], string>

type ShopScreenProps = {
  state: GameState
  onBuyCard: (cardId: string) => void
  onBuyRelic: (relicId: string) => void
  onLeave: () => void
}

export default function ShopScreen({ state, onBuyCard, onBuyRelic, onLeave }: ShopScreenProps) {
  return (
    <section className="screen shop-screen">
      <div className="hero-copy">
        <p className="hero-kicker">상점</p>
        <h1>행상인의 진열대</h1>
        <p className="hero-body">
          카드 한 장은 20골드, 유물 한 개는 40골드입니다. 필요한 장비를 챙기고 다음 분기로 이동하세요.
        </p>
      </div>

      <div className="battle-actions">
        <span className="status-chip">보유 골드 {state.gold}</span>
        <button type="button" className="secondary-button" onClick={onLeave}>
          상점 떠나기
        </button>
      </div>

      <div className="shop-layout">
        <section className="panel">
          <div className="panel-heading">
            <h2>판매 카드</h2>
            <span className="status-chip">{state.shopCards.length}장</span>
          </div>
          <div className="reward-grid">
            {state.shopCards.map((card) => (
              <button
                type="button"
                key={card.id}
                className={`reward-card type-${card.type}`}
                disabled={state.gold < 20}
                onClick={() => onBuyCard(card.id)}
              >
                <div className="card-meta">
                  <span className="card-type">{cardTypeLabel[card.type]}</span>
                  <span className="card-cost">20 골드</span>
                </div>
                <strong className="card-name">{card.name}</strong>
                <span className="card-text">{card.description}</span>
                <span className="card-action">{state.gold < 20 ? '골드 부족' : '구입하기'}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <h2>판매 유물</h2>
            <span className="status-chip">{state.shopRelic ? '준비 완료' : '매진'}</span>
          </div>
          {state.shopRelic ? (
            <button
              type="button"
              className="reward-card type-buff relic-shop-card"
              disabled={state.gold < 40}
              onClick={() => onBuyRelic(state.shopRelic!.id)}
            >
              <div className="card-meta">
                <span className="card-type">유물</span>
                <span className="card-cost">40 골드</span>
              </div>
              <strong className="card-name">{state.shopRelic.name}</strong>
              <span className="card-text">{state.shopRelic.description}</span>
              <span className="card-action">{state.gold < 40 ? '골드 부족' : '구입하기'}</span>
            </button>
          ) : (
            <div className="empty-panel-copy">이번 상점에서 살 수 있는 유물은 모두 소진됐습니다.</div>
          )}
        </section>
      </div>

      <RelicBar relicIds={state.relics} />
    </section>
  )
}
