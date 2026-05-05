import type { GameState } from '../game/types'
import BattleLog from './BattleLog'
import CardList from './CardList'
import EnemyPanel from './EnemyPanel'
import StatusPanel from './StatusPanel'

type BattleScreenProps = {
  state: GameState
  onUseCard: (cardId: string) => void
  onEndTurn: () => void
}

export default function BattleScreen({ state, onUseCard, onEndTurn }: BattleScreenProps) {
  const playerEffects = state.battleEffects.filter((effect) => effect.target === 'player')
  const enemyEffects = state.battleEffects.filter((effect) => effect.target === 'enemy')

  return (
    <section className="screen battle-screen">
      <div className="battle-banner">
        <div>
          <p className="hero-kicker">{state.stage} / {state.totalStages} 스테이지</p>
          <h1>전투 진행 중</h1>
        </div>
        <dl className="run-stats">
          <div>
            <dt>턴 수</dt>
            <dd>{state.stats.turns}</dd>
          </div>
          <div>
            <dt>덱</dt>
            <dd>{state.deck.length}</dd>
          </div>
          <div>
            <dt>보상</dt>
            <dd>{state.stats.cardsEarned}</dd>
          </div>
        </dl>
      </div>

      <div className="battle-grid">
        <div className="panel-column">
          <StatusPanel
            key={`player-${state.playerImpactKey}`}
            title="플레이어"
            hp={state.player.hp}
            maxHp={state.player.maxHp}
            block={state.player.block}
            poison={state.player.poison}
            attackBonus={state.player.attackBonus}
            pendingDrawPenalty={state.player.pendingDrawPenalty}
            energy={state.energy}
            maxEnergy={state.maxEnergy}
            effects={playerEffects}
            isHit={state.playerImpactKey > 0}
          />
          <EnemyPanel enemy={state.enemy} effects={enemyEffects} />
        </div>
        <BattleLog logs={state.logs} />
      </div>

      <CardList cards={state.hand} energy={state.energy} onUseCard={onUseCard} />

      <div className="battle-actions">
        <p className="battle-tip">
          에너지가 남아 있는 동안 카드를 계속 사용할 수 있습니다. 손패를 아끼고 싶다면 직접 턴을 끝내세요.
        </p>
        <button type="button" className="secondary-button end-turn-button" onClick={onEndTurn}>
          턴 종료
        </button>
      </div>
    </section>
  )
}
