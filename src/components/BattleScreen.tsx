import type { GameState } from '../game/types'
import BattleLog from './BattleLog'
import CardList from './CardList'
import EnemyPanel from './EnemyPanel'
import StatusPanel from './StatusPanel'

type BattleScreenProps = {
  state: GameState
  onUseCard: (cardId: string) => void
}

export default function BattleScreen({ state, onUseCard }: BattleScreenProps) {
  return (
    <section className="screen battle-screen">
      <div className="battle-banner">
        <div>
          <p className="hero-kicker">Stage {state.stage} / {state.totalStages}</p>
          <h1>던전 전투 진행 중</h1>
        </div>
        <dl className="run-stats">
          <div>
            <dt>Turns</dt>
            <dd>{state.stats.turns}</dd>
          </div>
          <div>
            <dt>Deck</dt>
            <dd>{state.deck.length}</dd>
          </div>
          <div>
            <dt>Rewards</dt>
            <dd>{state.stats.cardsEarned}</dd>
          </div>
        </dl>
      </div>

      <div className="battle-grid">
        <div className="panel-column">
          <StatusPanel
            title="플레이어"
            hp={state.player.hp}
            maxHp={state.player.maxHp}
            block={state.player.block}
            poison={state.player.poison}
            attackBonus={state.player.attackBonus}
            pendingDrawPenalty={state.player.pendingDrawPenalty}
          />
          <EnemyPanel enemy={state.enemy} />
        </div>
        <BattleLog logs={state.logs} />
      </div>

      <CardList cards={state.hand} onUseCard={onUseCard} />
    </section>
  )
}
