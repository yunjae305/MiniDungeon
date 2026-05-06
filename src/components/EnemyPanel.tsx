import { getEnemyIntent, getEnemyPhase } from '../game/engine'
import type { BattleEffect, EnemyActionType, EnemyState } from '../game/types'

const intentMark = {
  attack: '공',
  block: '방',
  poison: '독',
  vulnerable: '취',
} satisfies Record<EnemyActionType, string>

const phaseLabel = {
  'slime-base': '점액 순환',
  'goblin-base': '교란 전술',
  'bat-calm': '잠복 비행',
  'bat-frenzy': '광란 비행',
  'orc-stance': '정면 압박',
  'orc-rage': '분노 폭주',
  'sentinel-wall': '석벽 수호',
  'sentinel-core': '핵심 개방',
  'boss-command': '군주 지휘',
  'boss-doom': '파멸 돌입',
} satisfies Record<string, string>

type EnemyPanelProps = {
  enemy: EnemyState
  effects: BattleEffect[]
}

export default function EnemyPanel({ enemy, effects }: EnemyPanelProps) {
  const hpRatio = Math.max(0, (enemy.hp / enemy.maxHp) * 100)
  const intent = getEnemyIntent(enemy)
  const phase = getEnemyPhase(enemy)
  const phaseName = phaseLabel[phase.id as keyof typeof phaseLabel] ?? phase.id

  return (
    <article className="panel enemy-panel">
      <div className="battle-effect-layer">
        {effects.map((effect) => (
          <span key={effect.id} className={`battle-effect tone-${effect.tone}`}>
            {effect.tone === 'heal' ? '+' : '-'}
            {effect.value}
          </span>
        ))}
      </div>
      <div className="panel-heading">
        <h2>{enemy.name}</h2>
        <div className="intent-chip">
          <span className="intent-mark">{intentMark[intent.type]}</span>
          <span>{intent.label}</span>
          <strong>{intent.value}</strong>
        </div>
      </div>
      <div className="hp-track enemy-track" aria-label={`${enemy.name} 체력`}>
        <div className="hp-fill enemy-fill" style={{ width: `${hpRatio}%` }} />
      </div>
      <dl className="stats-grid">
        <div>
          <dt>체력</dt>
          <dd>{enemy.hp}</dd>
        </div>
        <div>
          <dt>방어도</dt>
          <dd>{enemy.block}</dd>
        </div>
        <div>
          <dt>중독</dt>
          <dd>{enemy.poison}</dd>
        </div>
        <div>
          <dt>취약</dt>
          <dd>{enemy.vulnerable}</dd>
        </div>
        <div>
          <dt>페이즈</dt>
          <dd>{phaseName}</dd>
        </div>
        <div>
          <dt>다음 순번</dt>
          <dd>{enemy.actionIndex + 1}</dd>
        </div>
      </dl>
    </article>
  )
}
