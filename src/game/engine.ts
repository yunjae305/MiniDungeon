import { cardsById, rewardCards, starterCards } from './cards'
import { getEnemyById } from './enemies'
import { createDungeonMap, getMapNode, getStageForScreen, normalizeSeed } from './map'
import { relics, relicsById } from './relics'
import type {
  BattleEffect,
  CardDefinition,
  EnemyAction,
  EnemyPhase,
  EnemyState,
  GameState,
  MapNode,
  PlayerState,
  RandomSource,
  RelicDefinition,
  ResultType,
} from './types'

const baseMaxEnergy = 3
const maxHandSize = 3
const maxLogCount = 18
const normalBattleGold = 18
const eliteBattleGold = 35
const shopCardCost = 20
const shopRelicCost = 40

type BattleEffectDraft = Omit<BattleEffect, 'id'>

function createPlayerState(): PlayerState {
  return {
    hp: 50,
    maxHp: 50,
    block: 0,
    poison: 0,
    vulnerable: 0,
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
    poison: player.poison ?? 0,
    vulnerable: player.vulnerable ?? 0,
    attackBonus: player.attackBonus ?? 0,
    pendingDrawPenalty: player.pendingDrawPenalty ?? 0,
    pendingEnergyPenalty: player.pendingEnergyPenalty ?? 0,
    pendingEnergyPenaltyTurns: player.pendingEnergyPenaltyTurns ?? 0,
    reflectDamage: player.reflectDamage ?? false,
  }
}

function createEnemyState(enemyId: string): EnemyState {
  const enemy = getEnemyById(enemyId)

  return {
    id: enemy.id,
    name: enemy.name,
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    block: 0,
    poison: 0,
    vulnerable: 0,
    actionIndex: 0,
    kind: enemy.kind,
    phases: enemy.phases,
  }
}

function normalizeEnemyState(enemy: EnemyState): EnemyState {
  const definition = getEnemyById(enemy.id)

  return {
    ...enemy,
    poison: enemy.poison ?? 0,
    vulnerable: enemy.vulnerable ?? 0,
    kind: enemy.kind ?? definition.kind,
    phases: enemy.phases ?? definition.phases,
  }
}

function normalizeBattleState(state: GameState): GameState {
  return {
    ...state,
    maxEnergy: state.maxEnergy ?? baseMaxEnergy,
    gold: state.gold ?? 0,
    player: normalizePlayerState(state.player),
    enemy: normalizeEnemyState(state.enemy),
    rewardOptions: state.rewardOptions ?? [],
    battleEffects: state.battleEffects ?? [],
    effectSequence: state.effectSequence ?? 0,
    playerImpactKey: state.playerImpactKey ?? 0,
    relics: state.relics ?? [],
    shopCards: state.shopCards ?? [],
    shopRelic: state.shopRelic ?? null,
    earnedRelic: state.earnedRelic ?? null,
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

function getRelicList(relicIds: string[]) {
  return relicIds.map((relicId) => relicsById[relicId]).filter(Boolean)
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

function decayVulnerable<T extends { vulnerable: number }>(target: T) {
  return {
    ...target,
    vulnerable: Math.max(0, target.vulnerable - 1),
  }
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

function getBattleStartBlock(relicIds: string[]) {
  return getRelicList(relicIds).reduce((total, relic) => total + (relic.effect.battleStartBlock ?? 0), 0)
}

function getBonusPoison(relicIds: string[]) {
  return getRelicList(relicIds).reduce((total, relic) => total + (relic.effect.bonusPoison ?? 0), 0)
}

function getBonusDamageAgainstVulnerable(relicIds: string[], enemy: EnemyState) {
  if (enemy.vulnerable <= 0) {
    return 0
  }

  return getRelicList(relicIds).reduce((total, relic) => total + (relic.effect.bonusDamageAgainstVulnerable ?? 0), 0)
}

function getTurnStartRelicBlock(relicIds: string[], enemy: EnemyState) {
  if (enemy.poison <= 0) {
    return 0
  }

  return getRelicList(relicIds).reduce((total, relic) => total + (relic.effect.turnStartBlockIfEnemyPoisoned ?? 0), 0)
}

function getScaledDamage(baseDamage: number, vulnerable: number, bonusDamage: number) {
  const scaledDamage = vulnerable > 0 ? Math.ceil(baseDamage * 1.5) : baseDamage

  return scaledDamage + bonusDamage
}

function getEncounterGold(node: MapNode | null) {
  if (!node) {
    return 0
  }

  if (node.type === 'elite') {
    return eliteBattleGold
  }

  if (node.type === 'battle') {
    return normalBattleGold
  }

  return 0
}

function getAvailableRelics(relicIds: string[]) {
  return relics.filter((relic) => !relicIds.includes(relic.id))
}

function pickRelic(relicIds: string[], random: RandomSource) {
  const pool = getAvailableRelics(relicIds)

  if (pool.length === 0) {
    return null
  }

  return (sampleWithoutReplacement(pool, 1, random)[0] ?? null) as RelicDefinition | null
}

function createResultState(state: GameState, result: ResultType, message: string): GameState {
  return {
    ...state,
    screen: 'result',
    hand: [],
    rewardOptions: [],
    battleEffects: [],
    shopCards: [],
    shopRelic: null,
    earnedRelic: null,
    result,
    logs: addLogs(state.logs, [message]),
  }
}

function getActiveEnemyPhase(enemy: EnemyState) {
  const ratio = enemy.hp / enemy.maxHp
  const phases = [...enemy.phases].sort((left, right) => right.minHpRatio - left.minHpRatio)

  return phases.find((phase) => ratio >= phase.minHpRatio) ?? phases[phases.length - 1]
}

function prepareTurnStart(
  player: PlayerState,
  enemy: EnemyState,
  maxEnergy: number,
  deck: CardDefinition[],
  relicIds: string[],
  random: RandomSource,
) {
  const refreshedPlayer = {
    ...player,
    block: 0,
    reflectDamage: false,
  }
  const energy = getTurnEnergy(refreshedPlayer, maxEnergy)
  let settledPlayer = advanceEnergyPenalty(refreshedPlayer)
  const logs: string[] = []
  const relicBlock = getTurnStartRelicBlock(relicIds, enemy)

  if (relicBlock > 0) {
    settledPlayer = {
      ...settledPlayer,
      block: settledPlayer.block + relicBlock,
    }
    logs.push(`잔불 반지: 방어도 ${relicBlock}를 얻습니다.`)
  }

  const { hand, player: drawnPlayer } = drawHand(deck, settledPlayer, random)

  return {
    hand,
    energy,
    player: drawnPlayer,
    logs,
  }
}

function prepareNextTurn(state: GameState, random: RandomSource): GameState {
  const turnStart = prepareTurnStart(state.player, state.enemy, state.maxEnergy, state.deck, state.relics, random)

  return {
    ...state,
    hand: turnStart.hand,
    energy: turnStart.energy,
    player: turnStart.player,
    logs: addLogs(
      state.logs,
      [`${state.stats.turns + 1}턴 시작, 카드 ${turnStart.hand.length}장을 뽑습니다.`, ...turnStart.logs],
    ),
    stats: {
      ...state.stats,
      turns: state.stats.turns + 1,
    },
  }
}

function openMapState(state: GameState, logs: string[]) {
  const map = {
    ...state.map,
    clearedNodeIds: state.currentNode
      ? [...new Set([...state.map.clearedNodeIds, state.currentNode.id])]
      : state.map.clearedNodeIds,
    availableNodeIds: state.currentNode?.nextNodeIds ?? state.map.availableNodeIds,
  }

  return {
    ...state,
    screen: 'map' as const,
    stage: getStageForScreen(map, null),
    hand: [],
    rewardOptions: [],
    battleEffects: [],
    currentNode: null,
    earnedRelic: null,
    shopCards: [],
    shopRelic: null,
    map,
    logs: addLogs(state.logs, logs),
  }
}

function createRewardState(state: GameState, random: RandomSource): GameState {
  if (state.currentNode?.type === 'boss') {
    return createResultState(state, 'clear', '던전 보스를 쓰러뜨렸습니다. 탐험을 완수했습니다.')
  }

  const goldEarned = getEncounterGold(state.currentNode)
  const earnedRelic = state.currentNode?.type === 'elite' ? pickRelic(state.relics, random) : null
  const relics = earnedRelic ? [...state.relics, earnedRelic.id] : state.relics

  return {
    ...state,
    screen: 'reward',
    hand: [],
    rewardOptions: sampleWithoutReplacement(rewardCards, 3, random),
    battleEffects: [],
    gold: state.gold + goldEarned,
    relics,
    earnedRelic,
    stats: {
      ...state.stats,
      battlesWon: state.stats.battlesWon + 1,
      elitesWon: state.stats.elitesWon + (state.currentNode?.type === 'elite' ? 1 : 0),
    },
    logs: addLogs(
      state.logs,
      [
        `${state.enemy.name}을 쓰러뜨렸습니다.`,
        `${goldEarned} 골드를 획득했습니다.`,
        ...(earnedRelic ? [`${earnedRelic.name} 유물을 획득했습니다.`] : []),
        '보상 카드를 선택하세요.',
      ],
    ),
  }
}

function beginBattle(state: GameState, node: MapNode, random: RandomSource): GameState {
  const enemy = createEnemyState(node.enemyId ?? 'slime')
  let player = normalizePlayerState(state.player)
  const logs = [`${node.row + 1}층 ${node.type === 'elite' ? '엘리트' : node.type === 'boss' ? '보스' : '전투'} 구역에 진입했습니다.`]
  const battleStartBlock = getBattleStartBlock(state.relics)

  if (battleStartBlock > 0) {
    player = {
      ...player,
      block: player.block + battleStartBlock,
    }
    logs.push(`전투 토템: 방어도 ${battleStartBlock}를 얻습니다.`)
  }

  const turnStart = prepareTurnStart(player, enemy, baseMaxEnergy, state.deck, state.relics, random)

  return {
    ...state,
    screen: 'battle',
    stage: node.row + 1,
    totalStages: state.map.rows.length,
    energy: turnStart.energy,
    maxEnergy: baseMaxEnergy,
    player: turnStart.player,
    enemy,
    hand: turnStart.hand,
    rewardOptions: [],
    battleEffects: [],
    effectSequence: 0,
    playerImpactKey: 0,
    currentNode: node,
    earnedRelic: null,
    shopCards: [],
    shopRelic: null,
    logs: addLogs(
      state.logs,
      [...logs, `${enemy.name}이(가) 모습을 드러냈습니다.`, `1턴 시작, 카드 ${turnStart.hand.length}장을 뽑습니다.`, ...turnStart.logs],
    ),
    result: null,
    stats: {
      ...state.stats,
      turns: state.stats.turns + 1,
    },
  }
}

function openRest(state: GameState, node: MapNode): GameState {
  return {
    ...state,
    screen: 'rest',
    stage: node.row + 1,
    currentNode: node,
    logs: addLogs(state.logs, ['모닥불 앞에서 잠시 숨을 고릅니다.']),
  }
}

function openShop(state: GameState, node: MapNode, random: RandomSource): GameState {
  return {
    ...state,
    screen: 'shop',
    stage: node.row + 1,
    currentNode: node,
    shopCards: sampleWithoutReplacement(rewardCards, 3, random),
    shopRelic: pickRelic(state.relics, random),
    logs: addLogs(state.logs, ['행상인이 희귀한 카드와 유물을 늘어놓았습니다.']),
  }
}

function hasPlayableCard(state: GameState) {
  return state.hand.some((card) => card.cost <= state.energy)
}

function resolveCopiedAction(player: PlayerState, enemy: EnemyState, action: EnemyAction, relicIds: string[]) {
  const logs: string[] = []
  const effects: BattleEffectDraft[] = []

  if (action.type === 'attack') {
    const totalDamage = getScaledDamage(action.value, enemy.vulnerable, getBonusDamageAgainstVulnerable(relicIds, enemy))
    const damageResult = applyDamage(enemy, totalDamage)

    enemy = damageResult.target
    logs.push(`흉내: ${enemy.name}에게 피해 ${totalDamage}을 줍니다.`)
    effects.push({
      target: 'enemy',
      tone: 'damage',
      value: totalDamage,
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
    const poison = action.value + getBonusPoison(relicIds)

    enemy = {
      ...enemy,
      poison: enemy.poison + poison,
    }
    logs.push(`흉내: ${enemy.name}에게 중독 ${poison}을 부여합니다.`)
  }

  if (action.type === 'vulnerable') {
    enemy = {
      ...enemy,
      vulnerable: enemy.vulnerable + action.value,
    }
    logs.push(`흉내: ${enemy.name}에게 취약 ${action.value}를 부여합니다.`)
  }

  return {
    player,
    enemy,
    logs,
    effects,
  }
}

function resolveCard(state: GameState, card: CardDefinition) {
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
      vulnerable: Math.max(0, player.vulnerable - 1),
    }
    logs.push(`${card.name}: 약화 상태를 정리합니다.`)
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
    logs.push(`${card.name}: 이번 턴에 받은 피해를 반사합니다.`)
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
    const poison = effect.poison + getBonusPoison(state.relics)

    enemy = {
      ...enemy,
      poison: enemy.poison + poison,
    }
    logs.push(`${card.name}: ${enemy.name}에게 중독 ${poison}을 부여합니다.`)
  }

  if (effect.vulnerable) {
    enemy = {
      ...enemy,
      vulnerable: enemy.vulnerable + effect.vulnerable,
    }
    logs.push(`${card.name}: ${enemy.name}에게 취약 ${effect.vulnerable}를 부여합니다.`)
  }

  if (effect.mimicNext) {
    const copied = resolveCopiedAction(player, enemy, getNextEnemyAction(enemy), state.relics)

    player = copied.player
    enemy = copied.enemy
    logs.push(...copied.logs)
    effects.push(...copied.effects)
  }

  if (card.type === 'attack') {
    const baseDamage = effect.useBlockAsDamage ? player.block : (effect.damage ?? 0) * (effect.repeat ?? 1)
    const totalDamage = getScaledDamage(
      baseDamage + player.attackBonus,
      enemy.vulnerable,
      getBonusDamageAgainstVulnerable(state.relics, enemy),
    )
    const damageResult = applyDamage(enemy, totalDamage)

    enemy = damageResult.target
    logs.push(`${card.name}: ${enemy.name}에게 피해 ${totalDamage}을 줍니다.`)
    effects.push({
      target: 'enemy',
      tone: 'damage',
      value: totalDamage,
    })

    if (effect.drainRatio) {
      const healed = healPlayer(player, Math.floor(damageResult.hpDamage * effect.drainRatio))

      player = healed.player

      if (healed.restored > 0) {
        logs.push(`${card.name}: 체력 ${healed.restored}를 흡수합니다.`)
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
    logs.push(`${card.name}: 다음 ${effect.energyPenaltyTurns}턴 동안 에너지가 ${effect.energyPenalty} 감소합니다.`)
  }

  return {
    player,
    enemy,
    logs,
    effects,
  }
}

export function getNextEnemyAction(enemy: EnemyState): EnemyAction {
  const normalizedEnemy = normalizeEnemyState(enemy)
  const phase = getActiveEnemyPhase(normalizedEnemy)

  return phase.actions[normalizedEnemy.actionIndex % phase.actions.length]
}

function runEnemyTurn(state: GameState) {
  const action = getNextEnemyAction(state.enemy)
  let player = state.player
  let enemy = {
    ...state.enemy,
    actionIndex: state.enemy.actionIndex + 1,
  }
  const logs: string[] = []
  const effects: BattleEffectDraft[] = []
  let playerHit = false

  if (action.type === 'attack') {
    const totalDamage = getScaledDamage(action.value, player.vulnerable, 0)
    const damageResult = applyDamage(player, totalDamage)

    player = damageResult.target
    logs.push(`${state.enemy.name} ${action.label}: 피해 ${totalDamage}을 받습니다.`)
    effects.push({
      target: 'player',
      tone: 'damage',
      value: totalDamage,
    })
    playerHit = true

    if (player.reflectDamage && damageResult.totalDamage > 0) {
      const reflected = applyDamage(enemy, damageResult.totalDamage)

      enemy = reflected.target
      logs.push(`가시 갑옷: ${enemy.name}에게 피해 ${damageResult.totalDamage}을 반사합니다.`)
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

  if (action.type === 'vulnerable') {
    player = {
      ...player,
      vulnerable: player.vulnerable + action.value,
    }
    logs.push(`${state.enemy.name} ${action.label}: 취약 ${action.value}를 받습니다.`)
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

  player = decayVulnerable(playerPoison.target)

  if (playerPoison.damage > 0) {
    logs.push(`플레이어가 중독 피해 ${playerPoison.damage}를 받습니다.`)
    effects.push({
      target: 'player',
      tone: 'poison',
      value: playerPoison.damage,
    })
  }

  const enemyPoison = applyPoison(enemy)

  enemy = decayVulnerable(enemyPoison.target)

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
  const enemyTurn = runEnemyTurn(nextState)

  nextState = {
    ...nextState,
    player: enemyTurn.player,
    enemy: enemyTurn.enemy,
    logs: addLogs(nextState.logs, enemyTurn.logs),
  }
  effects.push(...enemyTurn.effects)

  if (nextState.player.hp <= 0) {
    return createResultState(nextState, 'gameover', `${nextState.enemy.name}에게 패배했습니다.`)
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
    return createResultState(nextState, 'gameover', '중독에 쓰러졌습니다.')
  }

  if (nextState.enemy.hp <= 0) {
    return createRewardState(nextState, random)
  }

  return finalizeBattleState(prepareNextTurn(nextState, random), effects, enemyTurn.playerHit)
}

export function createWelcomeState(): GameState {
  const map = createDungeonMap(20260506)

  return {
    screen: 'start',
    stage: 1,
    totalStages: map.rows.length,
    energy: baseMaxEnergy,
    maxEnergy: baseMaxEnergy,
    gold: 30,
    player: createPlayerState(),
    enemy: createEnemyState('slime'),
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
      battlesWon: 0,
      elitesWon: 0,
    },
    relics: [],
    map,
    currentNode: null,
    earnedRelic: null,
    shopCards: [],
    shopRelic: null,
  }
}

export function startGame(seed?: number | string) {
  const map = createDungeonMap(normalizeSeed(seed))

  return {
    screen: 'map',
    stage: getStageForScreen(map, null),
    totalStages: map.rows.length,
    energy: baseMaxEnergy,
    maxEnergy: baseMaxEnergy,
    gold: 30,
    player: createPlayerState(),
    enemy: createEnemyState('slime'),
    deck: [...starterCards],
    hand: [],
    rewardOptions: [],
    battleEffects: [],
    effectSequence: 0,
    playerImpactKey: 0,
    logs: [`시드 ${map.seed}로 던전을 생성했습니다.`],
    result: null,
    stats: {
      turns: 0,
      cardsEarned: 0,
      battlesWon: 0,
      elitesWon: 0,
    },
    relics: [],
    map,
    currentNode: null,
    earnedRelic: null,
    shopCards: [],
    shopRelic: null,
  } satisfies GameState
}

export function selectMapNode(state: GameState, nodeId: string, random: RandomSource = Math.random) {
  if (state.screen !== 'map' || !state.map.availableNodeIds.includes(nodeId)) {
    return state
  }

  const node = getMapNode(state.map, nodeId)

  if (!node) {
    return state
  }

  if (node.type === 'rest') {
    return openRest(state, node)
  }

  if (node.type === 'shop') {
    return openShop(state, node, random)
  }

  return beginBattle(state, node, random)
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
  const resolved = resolveCard(normalizedState, selected)
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

export function selectRewardCard(state: GameState, cardId: string | null) {
  if (state.screen !== 'reward') {
    return state
  }

  if (cardId === null) {
    return openMapState(state, ['보상 카드를 건너뛰고 다음 길을 고릅니다.'])
  }

  const selected = state.rewardOptions.find((card) => card.id === cardId)

  if (!selected) {
    return state
  }

  return openMapState(
    {
      ...state,
      deck: [...state.deck, selected],
      stats: {
        ...state.stats,
        cardsEarned: state.stats.cardsEarned + 1,
      },
    },
    [`${selected.name} 카드를 덱에 추가했습니다.`],
  )
}

export function resolveRest(state: GameState) {
  if (state.screen !== 'rest') {
    return state
  }

  const healed = healPlayer(normalizePlayerState(state.player), 12)

  return openMapState(
    {
      ...state,
      player: healed.player,
    },
    [`모닥불 휴식으로 체력 ${healed.restored}를 회복했습니다.`],
  )
}

export function buyShopCard(state: GameState, cardId: string) {
  if (state.screen !== 'shop' || state.gold < shopCardCost) {
    return state
  }

  const selected = state.shopCards.find((card) => card.id === cardId)

  if (!selected) {
    return state
  }

  return {
    ...state,
    gold: state.gold - shopCardCost,
    deck: [...state.deck, selected],
    shopCards: state.shopCards.filter((card) => card.id !== cardId),
    logs: addLogs(state.logs, [`${selected.name} 카드를 구입했습니다.`]),
  }
}

export function buyShopRelic(state: GameState, relicId: string) {
  if (state.screen !== 'shop' || state.gold < shopRelicCost || !state.shopRelic || state.shopRelic.id !== relicId) {
    return state
  }

  return {
    ...state,
    gold: state.gold - shopRelicCost,
    relics: state.relics.includes(relicId) ? state.relics : [...state.relics, relicId],
    shopRelic: null,
    logs: addLogs(state.logs, [`${relicsById[relicId].name} 유물을 구입했습니다.`]),
  }
}

export function leaveShop(state: GameState) {
  if (state.screen !== 'shop') {
    return state
  }

  return openMapState(state, ['상점을 떠나 다음 길로 향합니다.'])
}

export function getEnemyIntent(enemy: EnemyState): EnemyAction {
  return getNextEnemyAction(normalizeEnemyState(enemy))
}

export function getRelicById(relicId: string): RelicDefinition {
  return relicsById[relicId]
}

export function getCardById(cardId: string) {
  return cardsById[cardId]
}

export function getEnemyPhase(enemy: EnemyState): EnemyPhase {
  return getActiveEnemyPhase(normalizeEnemyState(enemy))
}
