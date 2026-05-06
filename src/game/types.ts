export type CardType = 'attack' | 'defense' | 'heal' | 'debuff' | 'buff'

export type CardEffect = {
  damage?: number
  block?: number
  heal?: number
  poison?: number
  vulnerable?: number
  attackBonus?: number
  selfDamage?: number
  repeat?: number
  drawPenalty?: number
  useBlockAsDamage?: boolean
  reflectDamage?: boolean
  drainRatio?: number
  energyPenalty?: number
  energyPenaltyTurns?: number
  cleanse?: boolean
  mimicNext?: boolean
}

export type CardDefinition = {
  id: string
  name: string
  type: CardType
  description: string
  cost: number
  source: 'starter' | 'reward'
  effect: CardEffect
}

export type EnemyActionType = 'attack' | 'block' | 'poison' | 'vulnerable'
export type EnemyKind = 'normal' | 'elite' | 'boss'

export type EnemyAction = {
  type: EnemyActionType
  value: number
  label: string
}

export type EnemyPhase = {
  id: string
  minHpRatio: number
  actions: EnemyAction[]
}

export type EnemyDefinition = {
  id: string
  name: string
  maxHp: number
  kind: EnemyKind
  phases: EnemyPhase[]
}

export type RelicEffect = {
  battleStartBlock?: number
  bonusPoison?: number
  bonusDamageAgainstVulnerable?: number
  turnStartBlockIfEnemyPoisoned?: number
}

export type RelicDefinition = {
  id: string
  name: string
  description: string
  effect: RelicEffect
}

export type PlayerState = {
  hp: number
  maxHp: number
  block: number
  poison: number
  vulnerable: number
  attackBonus: number
  pendingDrawPenalty: number
  pendingEnergyPenalty: number
  pendingEnergyPenaltyTurns: number
  reflectDamage: boolean
}

export type EnemyState = {
  id: string
  name: string
  hp: number
  maxHp: number
  block: number
  poison: number
  vulnerable: number
  actionIndex: number
  kind: EnemyKind
  phases: EnemyPhase[]
}

export type BattleEffectTone = 'damage' | 'poison' | 'heal'
export type BattleEffectTarget = 'player' | 'enemy'

export type BattleEffect = {
  id: number
  target: BattleEffectTarget
  tone: BattleEffectTone
  value: number
}

export type MapNodeType = 'battle' | 'elite' | 'rest' | 'shop' | 'boss'

export type MapNode = {
  id: string
  row: number
  lane: number
  type: MapNodeType
  nextNodeIds: string[]
  enemyId: string | null
}

export type DungeonMap = {
  seed: number
  rows: MapNode[][]
  availableNodeIds: string[]
  clearedNodeIds: string[]
}

export type Screen = 'start' | 'map' | 'battle' | 'reward' | 'rest' | 'shop' | 'result'

export type ResultType = 'clear' | 'gameover' | null

export type GameStats = {
  turns: number
  cardsEarned: number
  battlesWon: number
  elitesWon: number
}

export type GameState = {
  screen: Screen
  stage: number
  totalStages: number
  energy: number
  maxEnergy: number
  gold: number
  player: PlayerState
  enemy: EnemyState
  deck: CardDefinition[]
  hand: CardDefinition[]
  rewardOptions: CardDefinition[]
  battleEffects: BattleEffect[]
  effectSequence: number
  playerImpactKey: number
  logs: string[]
  result: ResultType
  stats: GameStats
  relics: string[]
  map: DungeonMap
  currentNode: MapNode | null
  earnedRelic: RelicDefinition | null
  shopCards: CardDefinition[]
  shopRelic: RelicDefinition | null
}

export type RandomSource = () => number
