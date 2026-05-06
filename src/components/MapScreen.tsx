import { enemiesById } from '../game/enemies'
import type { GameState, MapNodeType } from '../game/types'
import RelicBar from './RelicBar'

const nodeTypeLabel = {
  battle: '일반 전투',
  elite: '엘리트',
  rest: '휴식',
  shop: '상점',
  boss: '보스',
} satisfies Record<MapNodeType, string>

const nodeTypeShort = {
  battle: '전',
  elite: '정',
  rest: '휴',
  shop: '상',
  boss: '보',
} satisfies Record<MapNodeType, string>

type MapScreenProps = {
  state: GameState
  onSelectNode: (nodeId: string) => void
}

export default function MapScreen({ state, onSelectNode }: MapScreenProps) {
  return (
    <section className="screen map-screen">
      <div className="hero-copy">
        <p className="hero-kicker">절차적 맵 / 시드 {state.map.seed}</p>
        <h1>다음 경로를 선택하세요</h1>
        <p className="hero-body">
          현재 체력은 {state.player.hp} / {state.player.maxHp}이고, 선택 가능한 노드는 {state.map.availableNodeIds.length}개입니다.
        </p>
      </div>

      <RelicBar relicIds={state.relics} />

      <section className="panel map-panel">
        <div className="panel-heading">
          <h2>던전 경로</h2>
          <span className="status-chip">{state.stage} / {state.totalStages}층</span>
        </div>
        <div className="map-rows">
          {state.map.rows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="map-row">
              <span className="map-floor-label">{rowIndex + 1}층</span>
              <div className="map-node-row">
                {row.map((node) => {
                  const isAvailable = state.map.availableNodeIds.includes(node.id)
                  const isCleared = state.map.clearedNodeIds.includes(node.id)
                  const enemyName = node.enemyId ? enemiesById[node.enemyId].name : nodeTypeLabel[node.type]

                  return (
                    <button
                      key={node.id}
                      type="button"
                      className={`map-node map-${node.type}${isAvailable ? ' is-available' : ''}${isCleared ? ' is-cleared' : ''}`}
                      disabled={!isAvailable}
                      onClick={() => onSelectNode(node.id)}
                    >
                      <span className="map-node-mark">{nodeTypeShort[node.type]}</span>
                      <strong>{nodeTypeLabel[node.type]}</strong>
                      <span>{enemyName}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}
