export type CardType = 'attack' | 'defense' | 'heal' | 'debuff' | 'buff'

export type CardEffect = {
  damage?: number
  block?: number
  heal?: number
  poison?: number
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

export type EnemyActionType = 'attack' | 'block' | 'heavyAttack' | 'poison'
export type EnemyBehaviorMode = 'sequential' | 'weighted_random'

export type EnemyAction = {
  type: EnemyActionType
  value: number
  label: string
  weight?: number
}

export type EnemyDefinition = {
  id: string
  name: string
  maxHp: number
  behaviorMode: EnemyBehaviorMode
  actions: EnemyAction[]
}

export type PlayerState = {
  hp: number
  maxHp: number
  block: number
  poison: number
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
  actionIndex: number
  behaviorMode?: EnemyBehaviorMode
  actions?: EnemyAction[]
}

export type BattleEffectTone = 'damage' | 'poison' | 'heal'
export type BattleEffectTarget = 'player' | 'enemy'

export type BattleEffect = {
  id: number
  target: BattleEffectTarget
  tone: BattleEffectTone
  value: number
}

export type Screen = 'start' | 'battle' | 'reward' | 'result'

export type ResultType = 'clear' | 'gameover' | null

export type GameStats = {
  turns: number
  cardsEarned: number
}

export type GameState = {
  screen: Screen
  stage: number
  totalStages: number
  energy: number
  maxEnergy: number
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
}

export type RandomSource = () => number
