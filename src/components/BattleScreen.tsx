import type { GameState } from '../game/types'
import BattleLog from './BattleLog'
import CardList from './CardList'
import EnemyPanel from './EnemyPanel'
import RelicBar from './RelicBar'
import StatusPanel from './StatusPanel'

type BattleScreenProps = {
  state: GameState
  onUseCard: (cardId: string) => void
  onEndTurn: () => void
}

export default function BattleScreen({ state, onUseCard, onEndTurn }: BattleScreenProps) {
  const playerEffects = state.battleEffects.filter((effect) => effect.target === 'player')
  const enemyEffects = state.battleEffects.filter((effect) => effect.target === 'enemy')
  const areaLabel = state.currentNode?.type === 'elite' ? '엘리트 전투' : state.currentNode?.type === 'boss' ? '보스 전투' : '일반 전투'

  return (
    <section className="screen battle-screen">
      <div className="battle-banner">
        <div>
          <p className="hero-kicker">{state.stage} / {state.totalStages}층 {areaLabel}</p>
          <h1>의도를 읽고 턴을 설계하세요</h1>
        </div>
        <dl className="run-stats">
          <div>
            <dt>턴 수</dt>
            <dd>{state.stats.turns}</dd>
          </div>
          <div>
            <dt>골드</dt>
            <dd>{state.gold}</dd>
          </div>
          <div>
            <dt>유물</dt>
            <dd>{state.relics.length}</dd>
          </div>
        </dl>
      </div>

      <RelicBar relicIds={state.relics} />

      <div className="battle-grid">
        <div className="panel-column">
          <StatusPanel
            key={`player-${state.playerImpactKey}`}
            title="플레이어"
            hp={state.player.hp}
            maxHp={state.player.maxHp}
            block={state.player.block}
            poison={state.player.poison}
            vulnerable={state.player.vulnerable}
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
          취약은 다음 피해 계산에 1.5배를 곱하고, 중독과 취약은 턴 종료 페이즈에서 함께 줄어듭니다.
        </p>
        <button type="button" className="secondary-button end-turn-button" onClick={onEndTurn}>
          턴 종료
        </button>
      </div>
    </section>
  )
}
