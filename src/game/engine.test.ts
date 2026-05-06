import { describe, expect, it } from 'vitest'
import { cardsById } from './cards'
import { getEnemyById } from './enemies'
import {
  buyShopCard,
  buyShopRelic,
  getEnemyIntent,
  leaveShop,
  resolveRest,
  selectMapNode,
  selectRewardCard,
  startGame,
  useCard,
} from './engine'
import type { EnemyState, GameState, RandomSource } from './types'

function queueRandom(values: number[]) {
  let index = 0

  return () => {
    const value = values[index]

    index += 1

    return value ?? 0
  }
}

function flatNodes(state: GameState) {
  return state.map.rows.flat().map((node) => `${node.id}:${node.type}:${node.enemyId ?? 'none'}`)
}

function openBattle(seed = 20260506, random: RandomSource = queueRandom([0, 0.2, 0.4])) {
  const state = startGame(seed)

  return selectMapNode(state, state.map.availableNodeIds[0], random)
}

function requireNode(state: GameState, type: string) {
  const node = state.map.rows.flat().find((candidate) => candidate.type === type)

  expect(node).toBeTruthy()

  if (!node) {
    throw new Error(`${type} node missing`)
  }

  return node
}

describe('engine', () => {
  it('starts on a seeded map with deterministic node layout', () => {
    const one = startGame(20260506)
    const two = startGame(20260506)

    expect(one.screen).toBe('map')
    expect(two.screen).toBe('map')
    expect(one.map.seed).toBe(20260506)
    expect(one.map.availableNodeIds).toHaveLength(3)
    expect(flatNodes(one)).toEqual(flatNodes(two))
    expect(one.map.rows.flat().some((node) => node.type === 'elite')).toBe(true)
    expect(one.map.rows.flat().some((node) => node.type === 'rest')).toBe(true)
    expect(one.map.rows.flat().some((node) => node.type === 'shop')).toBe(true)
    expect(one.map.rows.flat().some((node) => node.type === 'boss')).toBe(true)
  })

  it('lets the player choose a reachable map node and enter battle', () => {
    const state = startGame(20260506)
    const battle = selectMapNode(state, state.map.availableNodeIds[0], queueRandom([0, 0.2, 0.4]))

    expect(battle.screen).toBe('battle')
    expect(battle.currentNode?.type).toBe('battle')
    expect(battle.hand).toHaveLength(3)
    expect(battle.energy).toBe(3)
  })

  it('scales damage with vulnerable and relic bonuses', () => {
    const battle = openBattle()
    const next = useCard(
      {
        ...battle,
        relics: ['hunter_emblem'],
        enemy: {
          ...battle.enemy,
          hp: 40,
          vulnerable: 2,
        },
        hand: [cardsById.strike, cardsById.guard],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.enemy.hp).toBe(28)
    expect(next.enemy.vulnerable).toBe(2)
  })

  it('adds extra poison when the poison relic is equipped', () => {
    const battle = openBattle()
    const next = useCard(
      {
        ...battle,
        relics: ['venom_idol'],
        hand: [cardsById.poison_dart, cardsById.guard],
      },
      'poison_dart',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.enemy.poison).toBe(4)
  })

  it('shows deterministic intent from the enemy phase pattern', () => {
    const boss = getEnemyById('boss')
    const intent = getEnemyIntent({
      id: boss.id,
      name: boss.name,
      hp: 30,
      maxHp: boss.maxHp,
      block: 0,
      poison: 0,
      vulnerable: 0,
      actionIndex: 0,
      kind: boss.kind,
      phases: boss.phases,
    } satisfies EnemyState)

    expect(intent.label).toBe('파멸의 강타')
    expect(intent.value).toBe(18)
  })

  it('grants a relic after an elite victory and returns to the map after reward selection', () => {
    const state = startGame(20260506)
    const eliteNode = requireNode(state, 'elite')
    const battle = selectMapNode(
      {
        ...state,
        map: {
          ...state.map,
          availableNodeIds: [eliteNode.id],
        },
      },
      eliteNode.id,
      queueRandom([0, 0.2, 0.4]),
    )
    const won = useCard(
      {
        ...battle,
        enemy: {
          ...battle.enemy,
          hp: 6,
        },
        hand: [cardsById.strike, cardsById.guard],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(won.screen).toBe('reward')
    expect(won.earnedRelic?.id).toBeTruthy()

    const advanced = selectRewardCard(won, won.rewardOptions[0].id)

    expect(advanced.screen).toBe('map')
    expect(advanced.relics.length).toBeGreaterThan(0)
  })

  it('resolves rest nodes by healing and returning to the map', () => {
    const state = startGame(20260506)
    const restNode = requireNode(state, 'rest')
    const restState = selectMapNode(
      {
        ...state,
        player: {
          ...state.player,
          hp: 18,
        },
        map: {
          ...state.map,
          availableNodeIds: [restNode.id],
        },
      },
      restNode.id,
      queueRandom([0, 0.2, 0.4]),
    )

    expect(restState.screen).toBe('rest')

    const rested = resolveRest(restState)

    expect(rested.screen).toBe('map')
    expect(rested.player.hp).toBe(30)
  })

  it('lets the player buy a relic in the shop and leave with the updated inventory', () => {
    const state = startGame(20260506)
    const shopNode = requireNode(state, 'shop')
    const shopState = selectMapNode(
      {
        ...state,
        gold: 80,
        map: {
          ...state.map,
          availableNodeIds: [shopNode.id],
        },
      },
      shopNode.id,
      queueRandom([0, 0.2, 0.4, 0.6, 0.8]),
    )

    expect(shopState.screen).toBe('shop')
    expect(shopState.shopRelic?.id).toBeTruthy()

    const bought = buyShopRelic(shopState, shopState.shopRelic!.id)

    expect(bought.relics.length).toBe(1)
    expect(bought.gold).toBe(40)

    const afterLeave = leaveShop(bought)

    expect(afterLeave.screen).toBe('map')
  })

  it('lets the player buy a card in the shop', () => {
    const state = startGame(20260506)
    const shopNode = requireNode(state, 'shop')
    const shopState = selectMapNode(
      {
        ...state,
        gold: 60,
        map: {
          ...state.map,
          availableNodeIds: [shopNode.id],
        },
      },
      shopNode.id,
      queueRandom([0, 0.2, 0.4, 0.6, 0.8]),
    )

    expect(shopState.shopCards[0]?.id).toBeTruthy()

    const bought = buyShopCard(shopState, shopState.shopCards[0].id)

    expect(bought.deck.length).toBe(shopState.deck.length + 1)
    expect(bought.gold).toBe(40)
  })
})
