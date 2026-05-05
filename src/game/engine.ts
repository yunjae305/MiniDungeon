import { cardsById, rewardCards, starterCards } from './cards'
import { enemies, enemiesById, getEnemyByStage } from './enemies'
import type {
  BattleEffect,
  CardDefinition,
  EnemyAction,
  EnemyState,
  GameState,
  PlayerState,
  RandomSource,
  ResultType,
} from './types'

const baseMaxEnergy = 3
const maxHandSize = 3
const maxLogCount = 16

type BattleEffectDraft = Omit<BattleEffect, 'id'>

function createPlayerState(): PlayerState {
  return {
    hp: 50,
    maxHp: 50,
    block: 0,
    poison: 0,
    attackBonus: 0,
    pendingDrawPenalty: 0,
    pendingEnergyPenalty: 0,
    pendingEnergyPenaltyTurns: 0,
    reflectDamage: false,
  }
}

function normalizePlayerState(player: PlayerState): PlayerState {
  return {
    ...player,
    pendingEnergyPenalty: player.pendingEnergyPenalty ?? 0,
    pendingEnergyPenaltyTurns: player.pendingEnergyPenaltyTurns ?? 0,
    reflectDamage: player.reflectDamage ?? false,
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
    behaviorMode: enemy.behaviorMode,
    actions: enemy.actions,
  }
}

function normalizeEnemyState(enemy: EnemyState): EnemyState {
  const definition = enemiesById[enemy.id]

  return {
    ...enemy,
    behaviorMode: enemy.behaviorMode ?? definition.behaviorMode,
    actions: enemy.actions ?? definition.actions,
  }
}

function normalizeBattleState(state: GameState): GameState {
  const player = normalizePlayerState(state.player)
  const maxEnergy = state.maxEnergy ?? baseMaxEnergy

  return {
    ...state,
    maxEnergy,
    energy: state.energy ?? getTurnEnergy(player, maxEnergy),
    player,
    enemy: normalizeEnemyState(state.enemy),
    battleEffects: state.battleEffects ?? [],
    effectSequence: state.effectSequence ?? 0,
    playerImpactKey: state.playerImpactKey ?? 0,
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

function finalizeBattleState(state: GameState, drafts: BattleEffectDraft[], playerHit = false): GameState {
  let effectSequence = state.effectSequence
  const battleEffects = drafts.map((draft) => ({
    ...draft,
    id: effectSequence++,
  }))
  const playerImpactKey = playerHit ? effectSequence++ : state.playerImpactKey

  return {
    ...state,
    battleEffects,
    effectSequence,
    playerImpactKey,
  }
}

function getTurnEnergy(player: PlayerState, maxEnergy: number) {
  const penalty = player.pendingEnergyPenaltyTurns > 0 ? player.pendingEnergyPenalty : 0

  return Math.max(0, maxEnergy - penalty)
}

function advanceEnergyPenalty(player: PlayerState) {
  if (player.pendingEnergyPenaltyTurns <= 0) {
    return player
  }

  const turnsLeft = player.pendingEnergyPenaltyTurns - 1

  return {
    ...player,
    pendingEnergyPenaltyTurns: turnsLeft,
    pendingEnergyPenalty: turnsLeft > 0 ? player.pendingEnergyPenalty : 0,
  }
}

function applyDamage<T extends { hp: number; block: number }>(target: T, damage: number) {
  const blocked = Math.min(target.block, damage)
  const hpDamage = Math.max(0, damage - blocked)

  return {
    target: {
      ...target,
      block: target.block - blocked,
      hp: Math.max(0, target.hp - hpDamage),
    },
    blocked,
    hpDamage,
    totalDamage: damage,
  }
}

function healPlayer(player: PlayerState, amount: number) {
  const nextPlayer = {
    ...player,
    hp: Math.min(player.maxHp, player.hp + amount),
  }

  return {
    player: nextPlayer,
    restored: nextPlayer.hp - player.hp,
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

function getEnemyActions(enemy: EnemyState) {
  return enemy.actions ?? enemiesById[enemy.id].actions
}

function getEnemyBehaviorMode(enemy: EnemyState) {
  return enemy.behaviorMode ?? enemiesById[enemy.id].behaviorMode
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
    battleEffects: [],
    result,
    stats: {
      ...state.stats,
      turns: Math.max(state.stats.turns, 1),
    },
    logs: addLogs(state.logs, [message]),
  }
}

function createRewardState(state: GameState, random: RandomSource): GameState {
  if (state.stage >= state.totalStages) {
    return createResultState(state, 'clear', '던전 보스를 쓰러뜨렸습니다. 모험을 완수했습니다.')
  }

  return {
    ...state,
    screen: 'reward',
    hand: [],
    rewardOptions: sampleWithoutReplacement(rewardCards, 3, random),
    battleEffects: [],
    logs: addLogs(state.logs, [`${state.enemy.name}을(를) 처치했습니다.`, '보상 카드를 선택하세요.']),
  }
}

function prepareTurnStart(player: PlayerState, maxEnergy: number, deck: CardDefinition[], random: RandomSource) {
  const refreshedPlayer = {
    ...player,
    block: 0,
    reflectDamage: false,
  }
  const energy = getTurnEnergy(refreshedPlayer, maxEnergy)
  const settledPlayer = advanceEnergyPenalty(refreshedPlayer)
  const { hand, player: drawnPlayer } = drawHand(deck, settledPlayer, random)

  return {
    hand,
    energy,
    player: drawnPlayer,
  }
}

function prepareNextTurn(state: GameState, random: RandomSource): GameState {
  const turnStart = prepareTurnStart(state.player, state.maxEnergy, state.deck, random)

  return {
    ...state,
    hand: turnStart.hand,
    energy: turnStart.energy,
    player: turnStart.player,
    enemy: {
      ...state.enemy,
      block: 0,
    },
    logs: addLogs(state.logs, [`${state.stats.turns + 1}턴 시작, 카드 ${turnStart.hand.length}장을 뽑았습니다.`]),
    stats: {
      ...state.stats,
      turns: state.stats.turns + 1,
    },
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
  const turnStart = prepareTurnStart(normalizePlayerState(player), baseMaxEnergy, deck, random)

  return {
    screen: 'battle',
    stage,
    totalStages: enemies.length,
    energy: turnStart.energy,
    maxEnergy: baseMaxEnergy,
    player: turnStart.player,
    enemy: createEnemyState(stage),
    deck,
    hand: turnStart.hand,
    rewardOptions: [],
    battleEffects: [],
    effectSequence: 0,
    playerImpactKey: 0,
    logs: addLogs(logs, [`${stage} 스테이지 전투가 시작됩니다.`, `${stats.turns + 1}턴 시작, 카드 ${turnStart.hand.length}장을 뽑았습니다.`]),
    result: null,
    stats,
  }
}

function hasPlayableCard(state: GameState) {
  return state.hand.some((card) => card.cost <= state.energy)
}

function resolveCopiedAction(player: PlayerState, enemy: EnemyState, action: EnemyAction) {
  const logs: string[] = []
  const effects: BattleEffectDraft[] = []

  if (action.type === 'attack' || action.type === 'heavyAttack') {
    const damageResult = applyDamage(enemy, action.value)

    enemy = damageResult.target
    logs.push(`흉내: ${enemy.name}에게 피해 ${action.value}를 줍니다.`)
    effects.push({
      target: 'enemy',
      tone: 'damage',
      value: action.value,
    })
  }

  if (action.type === 'block') {
    player = {
      ...player,
      block: player.block + action.value,
    }
    logs.push(`흉내: 방어도 ${action.value}를 얻습니다.`)
  }

  if (action.type === 'poison') {
    enemy = {
      ...enemy,
      poison: enemy.poison + action.value,
    }
    logs.push(`흉내: ${enemy.name}에게 중독 ${action.value}를 부여합니다.`)
  }

  return {
    player,
    enemy,
    logs,
    effects,
  }
}

function resolveCard(state: GameState, card: CardDefinition, random: RandomSource) {
  let player = state.player
  let enemy = state.enemy
  const logs: string[] = []
  const effects: BattleEffectDraft[] = []
  const effect = card.effect

  if (effect.selfDamage) {
    player = {
      ...player,
      hp: Math.max(0, player.hp - effect.selfDamage),
    }
    logs.push(`${card.name}: 체력 ${effect.selfDamage}를 잃습니다.`)
    effects.push({
      target: 'player',
      tone: 'damage',
      value: effect.selfDamage,
    })
  }

  if (effect.cleanse) {
    player = {
      ...player,
      poison: 0,
    }
    logs.push(`${card.name}: 중독이 제거되었습니다.`)
  }

  if (effect.block) {
    player = {
      ...player,
      block: player.block + effect.block,
    }
    logs.push(`${card.name}: 방어도 ${effect.block}를 얻습니다.`)
  }

  if (effect.reflectDamage) {
    player = {
      ...player,
      reflectDamage: true,
    }
    logs.push(`${card.name}: 이번 턴 피해 반사가 활성화됩니다.`)
  }

  if (effect.heal) {
    const healed = healPlayer(player, effect.heal)

    player = healed.player

    if (healed.restored > 0) {
      logs.push(`${card.name}: 체력 ${healed.restored}를 회복합니다.`)
      effects.push({
        target: 'player',
        tone: 'heal',
        value: healed.restored,
      })
    }
  }

  if (effect.poison) {
    enemy = {
      ...enemy,
      poison: enemy.poison + effect.poison,
    }
    logs.push(`${card.name}: ${enemy.name}에게 중독 ${effect.poison}를 부여합니다.`)
  }

  if (effect.mimicNext) {
    const copied = resolveCopiedAction(player, enemy, getNextEnemyAction(enemy, random))

    player = copied.player
    enemy = copied.enemy
    logs.push(...copied.logs)
    effects.push(...copied.effects)
  }

  const isAttack = card.type === 'attack'
  const baseDamage = effect.useBlockAsDamage
    ? player.block
    : (effect.damage ?? 0) * (effect.repeat ?? 1)

  if (isAttack) {
    const totalDamage = baseDamage + player.attackBonus
    const damageResult = applyDamage(enemy, totalDamage)

    enemy = damageResult.target
    logs.push(`${card.name}: ${enemy.name}에게 피해 ${totalDamage}를 줍니다.`)
    effects.push({
      target: 'enemy',
      tone: 'damage',
      value: totalDamage,
    })

    if (effect.drainRatio) {
      const healed = healPlayer(player, Math.floor(damageResult.hpDamage * effect.drainRatio))

      player = healed.player

      if (healed.restored > 0) {
        logs.push(`${card.name}: 흡수 효과로 체력 ${healed.restored}를 회복합니다.`)
        effects.push({
          target: 'player',
          tone: 'heal',
          value: healed.restored,
        })
      }
    }

    player = {
      ...player,
      attackBonus: 0,
    }
  }

  if (effect.attackBonus) {
    player = {
      ...player,
      attackBonus: player.attackBonus + effect.attackBonus,
    }
    logs.push(`${card.name}: 다음 공격 피해가 ${effect.attackBonus} 증가합니다.`)
  }

  if (effect.drawPenalty) {
    player = {
      ...player,
      pendingDrawPenalty: player.pendingDrawPenalty + effect.drawPenalty,
    }
    logs.push(`${card.name}: 다음 턴에 카드 ${effect.drawPenalty}장을 덜 뽑습니다.`)
  }

  if (effect.energyPenalty && effect.energyPenaltyTurns) {
    player = {
      ...player,
      pendingEnergyPenalty: player.pendingEnergyPenalty + effect.energyPenalty,
      pendingEnergyPenaltyTurns: Math.max(player.pendingEnergyPenaltyTurns, effect.energyPenaltyTurns),
    }
    logs.push(`${card.name}: 다음 ${effect.energyPenaltyTurns}턴 동안 에너지가 ${effect.energyPenalty} 줄어듭니다.`)
  }

  return {
    player,
    enemy,
    logs,
    effects,
  }
}

export function getNextEnemyAction(enemy: EnemyState, random: RandomSource = Math.random): EnemyAction {
  const actions = getEnemyActions(normalizeEnemyState(enemy))

  if (getEnemyBehaviorMode(enemy) === 'sequential') {
    return actions[enemy.actionIndex % actions.length]
  }

  const totalWeight = actions.reduce((sum, action) => sum + (action.weight ?? 1), 0)
  let cursor = random() * totalWeight

  for (const action of actions) {
    cursor -= action.weight ?? 1

    if (cursor < 0) {
      return action
    }
  }

  return actions[actions.length - 1]
}

function runEnemyTurn(state: GameState, random: RandomSource) {
  const action = getNextEnemyAction(state.enemy, random)
  let player = state.player
  let enemy = {
    ...state.enemy,
    actionIndex: state.enemy.actionIndex + 1,
  }
  const logs: string[] = []
  const effects: BattleEffectDraft[] = []
  let playerHit = false

  if (action.type === 'attack' || action.type === 'heavyAttack') {
    const damageResult = applyDamage(player, action.value)

    player = damageResult.target
    logs.push(`${state.enemy.name} ${action.label}: 피해 ${action.value}를 받습니다.`)
    effects.push({
      target: 'player',
      tone: 'damage',
      value: action.value,
    })
    playerHit = true

    if (player.reflectDamage && damageResult.totalDamage > 0) {
      const reflected = applyDamage(enemy, damageResult.totalDamage)

      enemy = reflected.target
      logs.push(`가시 갑옷: ${enemy.name}에게 피해 ${damageResult.totalDamage}를 반사합니다.`)
      effects.push({
        target: 'enemy',
        tone: 'damage',
        value: damageResult.totalDamage,
      })
    }
  }

  if (action.type === 'block') {
    enemy = {
      ...enemy,
      block: enemy.block + action.value,
    }
    logs.push(`${state.enemy.name} ${action.label}: 방어도 ${action.value}를 얻습니다.`)
  }

  if (action.type === 'poison') {
    player = {
      ...player,
      poison: player.poison + action.value,
    }
    logs.push(`${state.enemy.name} ${action.label}: 중독 ${action.value}를 받습니다.`)
  }

  return {
    player,
    enemy,
    logs,
    effects,
    playerHit,
  }
}

function runEndTurn(state: GameState) {
  let player = state.player
  let enemy = state.enemy
  const logs: string[] = []
  const effects: BattleEffectDraft[] = []

  const playerPoison = applyPoison(player)

  player = playerPoison.target

  if (playerPoison.damage > 0) {
    logs.push(`플레이어가 중독 피해 ${playerPoison.damage}를 받습니다.`)
    effects.push({
      target: 'player',
      tone: 'poison',
      value: playerPoison.damage,
    })
  }

  const enemyPoison = applyPoison(enemy)

  enemy = enemyPoison.target

  if (enemyPoison.damage > 0) {
    logs.push(`${enemy.name}이(가) 중독 피해 ${enemyPoison.damage}를 받습니다.`)
    effects.push({
      target: 'enemy',
      tone: 'poison',
      value: enemyPoison.damage,
    })
  }

  return {
    player,
    enemy,
    logs,
    effects,
  }
}

function finishTurn(state: GameState, random: RandomSource, initialEffects: BattleEffectDraft[] = []) {
  let nextState = state
  const effects = [...initialEffects]

  const enemyTurn = runEnemyTurn(nextState, random)

  nextState = {
    ...nextState,
    player: enemyTurn.player,
    enemy: enemyTurn.enemy,
    logs: addLogs(nextState.logs, enemyTurn.logs),
  }
  effects.push(...enemyTurn.effects)

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', `${nextState.enemy.name}에게 쓰러졌습니다.`)
  }

  if (nextState.enemy.hp <= 0) {
    return createRewardState(nextState, random)
  }

  const endTurn = runEndTurn(nextState)

  nextState = {
    ...nextState,
    player: endTurn.player,
    enemy: endTurn.enemy,
    logs: addLogs(nextState.logs, endTurn.logs),
  }
  effects.push(...endTurn.effects)

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', '중독으로 쓰러졌습니다.')
  }

  if (nextState.enemy.hp <= 0) {
    return createRewardState(nextState, random)
  }

  return finalizeBattleState(prepareNextTurn(nextState, random), effects, enemyTurn.playerHit)
}

export function createWelcomeState(): GameState {
  return {
    screen: 'start',
    stage: 1,
    totalStages: enemies.length,
    energy: baseMaxEnergy,
    maxEnergy: baseMaxEnergy,
    player: createPlayerState(),
    enemy: createEnemyState(1),
    deck: [...starterCards],
    hand: [],
    rewardOptions: [],
    battleEffects: [],
    effectSequence: 0,
    playerImpactKey: 0,
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
    ['던전으로 들어섭니다.'],
    random,
  )
}

export function useCard(state: GameState, cardId: string, random: RandomSource = Math.random) {
  const normalizedState = normalizeBattleState(state)

  if (normalizedState.screen !== 'battle') {
    return normalizedState
  }

  const cardIndex = normalizedState.hand.findIndex((card) => card.id === cardId)

  if (cardIndex === -1) {
    return normalizedState
  }

  const selected = normalizedState.hand[cardIndex]

  if (selected.cost > normalizedState.energy) {
    return normalizedState
  }

  const hand = normalizedState.hand.filter((_, index) => index !== cardIndex)
  const resolved = resolveCard(normalizedState, selected, random)
  const nextState: GameState = {
    ...normalizedState,
    hand,
    energy: normalizedState.energy - selected.cost,
    player: resolved.player,
    enemy: resolved.enemy,
    logs: addLogs(normalizedState.logs, resolved.logs),
  }

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', '카드 반동으로 쓰러졌습니다.')
  }

  if (nextState.enemy.hp <= 0) {
    return createRewardState(nextState, random)
  }

  if (nextState.energy <= 0 || nextState.hand.length === 0 || !hasPlayableCard(nextState)) {
    return finishTurn(nextState, random, resolved.effects)
  }

  return finalizeBattleState(nextState, resolved.effects)
}

export function endTurn(state: GameState, random: RandomSource = Math.random) {
  const normalizedState = normalizeBattleState(state)

  if (normalizedState.screen !== 'battle') {
    return normalizedState
  }

  return finishTurn(normalizedState, random)
}

export function selectRewardCard(state: GameState, cardId: string | null, random: RandomSource = Math.random) {
  if (state.screen !== 'reward') {
    return state
  }

  if (cardId === null) {
    return beginBattle(
      state.stage + 1,
      [...state.deck],
      {
        ...normalizePlayerState(state.player),
        block: 0,
        poison: 0,
        attackBonus: 0,
        reflectDamage: false,
      },
      state.stats,
      addLogs(state.logs, ['보상을 받지 않고 지나갑니다.']),
      random,
    )
  }

  const selected = state.rewardOptions.find((card) => card.id === cardId)

  if (!selected) {
    return state
  }

  return beginBattle(
    state.stage + 1,
    [...state.deck, selected],
    {
      ...normalizePlayerState(state.player),
      block: 0,
      poison: 0,
      attackBonus: 0,
      reflectDamage: false,
    },
    {
      ...state.stats,
      cardsEarned: state.stats.cardsEarned + 1,
    },
    addLogs(state.logs, [`${selected.name} 카드를 덱에 추가했습니다.`]),
    random,
  )
}

export function getEnemyIntent(enemy: EnemyState): EnemyAction {
  const normalizedEnemy = normalizeEnemyState(enemy)

  if (getEnemyBehaviorMode(normalizedEnemy) === 'weighted_random') {
    return {
      type: 'attack',
      value: 0,
      label: '예측 불가',
    }
  }

  return getNextEnemyAction(normalizedEnemy, () => 0)
}

export function getCardById(cardId: string) {
  return cardsById[cardId]
}
