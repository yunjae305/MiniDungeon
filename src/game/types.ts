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
}

export type CardDefinition = {
  id: string
  name: string
  type: CardType
  description: string
  source: 'starter' | 'reward'
  effect: CardEffect
}

export type EnemyActionType = 'attack' | 'block' | 'heavyAttack' | 'poison'

export type EnemyAction = {
  type: EnemyActionType
  value: number
  label: string
}

export type EnemyDefinition = {
  id: string
  name: string
  maxHp: number
  actions: EnemyAction[]
}

export type PlayerState = {
  hp: number
  maxHp: number
  block: number
  poison: number
  attackBonus: number
  pendingDrawPenalty: number
}

export type EnemyState = {
  id: string
  name: string
  hp: number
  maxHp: number
  block: number
  poison: number
  actionIndex: number
  actions?: EnemyAction[]
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
  player: PlayerState
  enemy: EnemyState
  deck: CardDefinition[]
  hand: CardDefinition[]
  rewardOptions: CardDefinition[]
  logs: string[]
  result: ResultType
  stats: GameStats
}

export type RandomSource = () => number
