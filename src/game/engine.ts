import { cardsById, rewardCards, starterCards } from './cards'
import { enemies, enemiesById, getEnemyByStage } from './enemies'
import type {
  CardDefinition,
  EnemyAction,
  EnemyState,
  GameState,
  PlayerState,
  RandomSource,
  ResultType,
} from './types'

const maxHandSize = 3
const maxLogCount = 16

function createPlayerState(): PlayerState {
  return {
    hp: 50,
    maxHp: 50,
    block: 0,
    poison: 0,
    attackBonus: 0,
    pendingDrawPenalty: 0,
  }
}

function createEnemyState(stage: number): EnemyState {
  const enemy = getEnemyByStage(stage)

  return {
    id: enemy.id,
    name: enemy.name,
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    block: 0,
    poison: 0,
    actionIndex: 0,
    actions: enemy.actions,
  }
}

function sampleWithoutReplacement<T>(items: T[], count: number, random: RandomSource) {
  const pool = [...items]
  const picked: T[] = []

  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(random() * pool.length)
    const [selected] = pool.splice(index, 1)

    picked.push(selected)
  }

  return picked
}

function addLogs(logs: string[], entries: string[]) {
  return [...logs, ...entries].slice(-maxLogCount)
}

function applyDamage<T extends { hp: number; block: number }>(target: T, damage: number): T {
  const blocked = Math.min(target.block, damage)
  const hpDamage = Math.max(0, damage - blocked)

  return {
    ...target,
    block: target.block - blocked,
    hp: Math.max(0, target.hp - hpDamage),
  }
}

function healPlayer(player: PlayerState, amount: number) {
  return {
    ...player,
    hp: Math.min(player.maxHp, player.hp + amount),
  }
}

function applyPoison<T extends { hp: number; poison: number }>(target: T) {
  if (target.poison <= 0) {
    return {
      target,
      damage: 0,
    }
  }

  return {
    target: {
      ...target,
      hp: Math.max(0, target.hp - target.poison),
      poison: Math.max(0, target.poison - 1),
    },
    damage: target.poison,
  }
}

function resolveEnemyActions(enemy: EnemyState) {
  return enemy.actions ?? enemiesById[enemy.id].actions
}

function drawHand(deck: CardDefinition[], player: PlayerState, random: RandomSource) {
  const drawCount = Math.max(1, maxHandSize - player.pendingDrawPenalty)

  return {
    hand: sampleWithoutReplacement(deck, Math.min(drawCount, deck.length), random),
    player: {
      ...player,
      pendingDrawPenalty: 0,
    },
  }
}

function createResultState(state: GameState, result: ResultType, message: string): GameState {
  return {
    ...state,
    screen: 'result',
    hand: [],
    rewardOptions: [],
    result,
    logs: addLogs(state.logs, [message]),
  }
}

function createRewardState(state: GameState, random: RandomSource): GameState {
  if (state.stage >= state.totalStages) {
    return createResultState(state, 'clear', 'Dungeon Boss를 쓰러뜨렸습니다. 던전 공략 완료')
  }

  return {
    ...state,
    screen: 'reward',
    hand: [],
    rewardOptions: sampleWithoutReplacement(rewardCards, 3, random),
    logs: addLogs(state.logs, [`${state.enemy.name} 격파`, '보상 카드 선택']),
  }
}

function prepareNextTurn(state: GameState, random: RandomSource): GameState {
  const { hand, player } = drawHand(
    state.deck,
    {
      ...state.player,
      block: 0,
    },
    random,
  )

  return {
    ...state,
    hand,
    player,
    enemy: {
      ...state.enemy,
      block: 0,
    },
    logs: addLogs(state.logs, [`${state.stats.turns + 1}턴 준비: 카드 ${hand.length}장`]),
  }
}

function beginBattle(
  stage: number,
  deck: CardDefinition[],
  player: PlayerState,
  stats: GameState['stats'],
  logs: string[],
  random: RandomSource,
): GameState {
  const { hand, player: drawnPlayer } = drawHand(deck, player, random)

  return {
    screen: 'battle',
    stage,
    totalStages: enemies.length,
    player: {
      ...drawnPlayer,
      block: 0,
    },
    enemy: createEnemyState(stage),
    deck,
    hand,
    rewardOptions: [],
    logs: addLogs(logs, [`${stage}스테이지 전투 시작`, `${stats.turns + 1}턴 준비: 카드 ${hand.length}장`]),
    result: null,
    stats,
  }
}

function runEnemyTurn(state: GameState): GameState {
  const actions = resolveEnemyActions(state.enemy)
  const action = actions[state.enemy.actionIndex % actions.length]
  const enemy = {
    ...state.enemy,
    actionIndex: state.enemy.actionIndex + 1,
  }
  let player = state.player
  const logs: string[] = []

  if (action.type === 'attack' || action.type === 'heavyAttack') {
    player = applyDamage(player, action.value)
    logs.push(`${state.enemy.name} ${action.label}: 플레이어에게 ${action.value} 피해`)
  }

  if (action.type === 'block') {
    enemy.block += action.value
    logs.push(`${state.enemy.name} ${action.label}: 방어도 ${action.value} 획득`)
  }

  if (action.type === 'poison') {
    player = {
      ...player,
      poison: player.poison + action.value,
    }
    logs.push(`${state.enemy.name} ${action.label}: 플레이어 독 ${action.value}`)
  }

  return {
    ...state,
    player,
    enemy,
    logs: addLogs(state.logs, logs),
  }
}

function runEndTurn(state: GameState): GameState {
  let player = state.player
  let enemy = state.enemy
  const logs: string[] = []

  const playerPoison = applyPoison(player)
  player = playerPoison.target

  if (playerPoison.damage > 0) {
    logs.push(`플레이어 중독: ${playerPoison.damage} 피해`)
  }

  const enemyPoison = applyPoison(enemy)
  enemy = enemyPoison.target

  if (enemyPoison.damage > 0) {
    logs.push(`${enemy.name} 중독: ${enemyPoison.damage} 피해`)
  }

  return {
    ...state,
    player,
    enemy,
    logs: addLogs(state.logs, logs),
  }
}

function resolveCard(state: GameState, card: CardDefinition) {
  let player = state.player
  let enemy = state.enemy
  const logs: string[] = []
  const effect = card.effect

  if (effect.selfDamage) {
    player = {
      ...player,
      hp: Math.max(0, player.hp - effect.selfDamage),
    }
    logs.push(`${card.name}: 플레이어가 ${effect.selfDamage} 피해`)
  }

  const isAttack = card.type === 'attack'
  const baseDamage = effect.useBlockAsDamage
    ? player.block
    : (effect.damage ?? 0) * (effect.repeat ?? 1)
  const totalDamage = isAttack ? baseDamage + player.attackBonus : 0

  if (isAttack) {
    enemy = applyDamage(enemy, totalDamage)
    logs.push(`${card.name}: ${enemy.name}에게 ${totalDamage} 피해`)
    player = {
      ...player,
      attackBonus: 0,
    }
  }

  if (effect.block) {
    player = {
      ...player,
      block: player.block + effect.block,
    }
    logs.push(`${card.name}: 방어도 ${effect.block} 획득`)
  }

  if (effect.heal) {
    const nextPlayer = healPlayer(player, effect.heal)
    const restored = nextPlayer.hp - player.hp

    player = nextPlayer

    logs.push(`${card.name}: 체력 ${restored} 회복`)
  }

  if (effect.poison) {
    enemy = {
      ...enemy,
      poison: enemy.poison + effect.poison,
    }
    logs.push(`${card.name}: ${enemy.name}에게 독 ${effect.poison}`)
  }

  if (effect.attackBonus) {
    player = {
      ...player,
      attackBonus: player.attackBonus + effect.attackBonus,
    }
    logs.push(`${card.name}: 다음 공격 피해 +${effect.attackBonus}`)
  }

  if (effect.drawPenalty) {
    player = {
      ...player,
      pendingDrawPenalty: player.pendingDrawPenalty + effect.drawPenalty,
    }
    logs.push(`${card.name}: 다음 턴 손패 -${effect.drawPenalty}`)
  }

  return {
    player,
    enemy,
    logs,
  }
}

export function createWelcomeState(): GameState {
  return {
    screen: 'start',
    stage: 1,
    totalStages: enemies.length,
    player: createPlayerState(),
    enemy: createEnemyState(1),
    deck: [...starterCards],
    hand: [],
    rewardOptions: [],
    logs: [],
    result: null,
    stats: {
      turns: 0,
      cardsEarned: 0,
    },
  }
}

export function startGame(random: RandomSource = Math.random) {
  return beginBattle(
    1,
    [...starterCards],
    createPlayerState(),
    {
      turns: 0,
      cardsEarned: 0,
    },
    ['던전에 진입했습니다.'],
    random,
  )
}

export function useCard(state: GameState, cardId: string, random: RandomSource = Math.random) {
  if (state.screen !== 'battle') {
    return state
  }

  const cardIndex = state.hand.findIndex((card) => card.id === cardId)

  if (cardIndex === -1) {
    return state
  }

  const selected = state.hand[cardIndex]
  const hand = state.hand.filter((_, index) => index !== cardIndex)
  const resolved = resolveCard(state, selected)
  let nextState: GameState = {
    ...state,
    hand,
    player: resolved.player,
    enemy: resolved.enemy,
    logs: addLogs(state.logs, resolved.logs),
    stats: {
      ...state.stats,
      turns: state.stats.turns + 1,
    },
  }

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', '플레이어가 쓰러졌습니다.')
  }

  if (nextState.enemy.hp <= 0) {
    return createRewardState(nextState, random)
  }

  nextState = runEnemyTurn(nextState)

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', `${nextState.enemy.name}의 공격으로 패배`)
  }

  nextState = runEndTurn(nextState)

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', '중독으로 쓰러졌습니다.')
  }

  if (nextState.enemy.hp <= 0) {
    return createRewardState(nextState, random)
  }

  return prepareNextTurn(nextState, random)
}

export function selectRewardCard(state: GameState, cardId: string, random: RandomSource = Math.random) {
  if (state.screen !== 'reward') {
    return state
  }

  const selected = state.rewardOptions.find((card) => card.id === cardId)

  if (!selected) {
    return state
  }

  const nextPlayer: PlayerState = {
    ...state.player,
    block: 0,
    poison: 0,
    attackBonus: 0,
  }
  const nextDeck = [...state.deck, selected]

  return beginBattle(
    state.stage + 1,
    nextDeck,
    nextPlayer,
    {
      ...state.stats,
      cardsEarned: state.stats.cardsEarned + 1,
    },
    addLogs(state.logs, [`${selected.name} 획득`]),
    random,
  )
}

export function getEnemyIntent(enemy: EnemyState): EnemyAction {
  const actions = resolveEnemyActions(enemy)

  return actions[enemy.actionIndex % actions.length]
}

export function getCardById(cardId: string) {
  return cardsById[cardId]
}
