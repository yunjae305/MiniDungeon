import { describe, expect, it } from 'vitest'
import { cardsById } from './cards'
import * as engine from './engine'
import type { EnemyState } from './types'

type GameStateLike = ReturnType<typeof engine.startGame>
type RandomSource = () => number
type ActionLike = {
  type: string
  value: number
  label: string
}

const { startGame, selectRewardCard, useCard } = engine
const endTurn = (engine as typeof engine & {
  endTurn?: (state: GameStateLike, random?: RandomSource) => GameStateLike
}).endTurn
const getNextEnemyAction = (engine as typeof engine & {
  getNextEnemyAction?: (enemy: EnemyState, random?: RandomSource) => ActionLike
}).getNextEnemyAction

function queueRandom(values: number[]) {
  let index = 0

  return () => {
    const value = values[index]

    index += 1

    return value ?? 0
  }
}

describe('engine', () => {
  it('starts with stage one, five deck cards, and three hand cards', () => {
    const state = startGame(queueRandom([0, 0.4, 0.8]))

    expect(state.screen).toBe('battle')
    expect(state.stage).toBe(1)
    expect(state.player.hp).toBe(50)
    expect(state.enemy.name).toBe('슬라임')
    expect(state.deck).toHaveLength(5)
    expect(state.hand).toHaveLength(3)
    expect(state.energy).toBe(3)
    expect(state.maxEnergy).toBe(3)
  })

  it('keeps the turn open while energy remains and ends the turn when the second card spends it', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const afterGuard = useCard(
      {
        ...state,
        hand: [cardsById.guard, cardsById.strike],
      },
      'guard',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(afterGuard.screen).toBe('battle')
    expect(afterGuard.energy).toBe(2)
    expect(afterGuard.player.block).toBe(6)
    expect(afterGuard.enemy.hp).toBe(24)
    expect(afterGuard.hand).toHaveLength(1)

    const afterStrike = useCard(
      {
        ...afterGuard,
        hand: [cardsById.strike],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(afterStrike.energy).toBe(3)
    expect(afterStrike.player.block).toBe(0)
    expect(afterStrike.enemy.hp).toBe(18)
    expect(afterStrike.logs.length).toBeGreaterThan(afterGuard.logs.length)
  })

  it('lets the player end the turn early and refreshes energy on the next turn', () => {
    expect(endTurn).toBeTypeOf('function')

    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const afterFocus = useCard(
      {
        ...state,
        hand: [cardsById.focus, cardsById.guard],
      },
      'focus',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(afterFocus.energy).toBe(2)

    const next = endTurn!(afterFocus, queueRandom([0, 0.5, 0.8]))

    expect(next.screen).toBe('battle')
    expect(next.energy).toBe(3)
    expect(next.player.hp).toBe(45)
    expect(next.player.attackBonus).toBe(5)
    expect(next.enemy.actionIndex).toBe(1)
  })

  it('lets guard absorb enemy damage and resets block after the turn', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const next = useCard(
      {
        ...state,
        hand: [cardsById.guard],
      },
      'guard',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.player.hp).toBe(50)
    expect(next.player.block).toBe(0)
    expect(next.screen).toBe('battle')
    expect(next.logs.length).toBeGreaterThan(state.logs.length)
  })

  it('applies poison at turn end and lowers poison by one', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const next = useCard(
      {
        ...state,
        hand: [cardsById.poison_dart],
      },
      'poison_dart',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.enemy.hp).toBe(21)
    expect(next.enemy.poison).toBe(2)
  })

  it('stores focus bonus and spends it on the next attack', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const focused = useCard(
      {
        ...state,
        hand: [cardsById.focus],
      },
      'focus',
      queueRandom([0, 0.5, 0.8]),
    )
    const attacked = useCard(
      {
        ...focused,
        hand: [cardsById.strike],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(focused.player.attackBonus).toBe(5)
    expect(attacked.player.attackBonus).toBe(0)
    expect(attacked.enemy.hp).toBe(13)
  })

  it('shows reward choices after a non-final stage victory and advances after selection', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const won = useCard(
      {
        ...state,
        enemy: {
          ...state.enemy,
          hp: 12,
        },
        hand: [cardsById.heavy_blow],
      },
      'heavy_blow',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(won.screen).toBe('reward')
    expect(won.rewardOptions).toHaveLength(3)

    const advanced = selectRewardCard(won, won.rewardOptions[0].id, queueRandom([0, 0.33, 0.66]))

    expect(advanced.screen).toBe('battle')
    expect(advanced.stage).toBe(2)
    expect(advanced.enemy.name).toBe('고블린')
    expect(advanced.deck).toHaveLength(6)
    expect(advanced.hand).toHaveLength(2)
  })

  it('allows skipping a reward and keeps the deck size the same', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const won = useCard(
      {
        ...state,
        enemy: {
          ...state.enemy,
          hp: 6,
        },
        hand: [cardsById.strike],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    const advanced = selectRewardCard(won, null as unknown as string, queueRandom([0, 0.33, 0.66]))

    expect(advanced.screen).toBe('battle')
    expect(advanced.stage).toBe(2)
    expect(advanced.deck).toHaveLength(5)
    expect(advanced.stats.cardsEarned).toBe(0)
  })

  it('ends the run with clear on stage five victory', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const won = useCard(
      {
        ...state,
        stage: 5,
        enemy: {
          id: 'boss',
          name: '던전 보스',
          hp: 6,
          maxHp: 70,
          block: 0,
          poison: 0,
          actionIndex: 0,
        },
        hand: [cardsById.strike],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(won.screen).toBe('result')
    expect(won.result).toBe('clear')
    expect(won.stats.turns).toBeGreaterThan(0)
  })

  it('ends the run with game over when the player dies during the enemy turn', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const lost = useCard(
      {
        ...state,
        player: {
          ...state.player,
          hp: 4,
        },
        hand: [cardsById.strike],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(lost.screen).toBe('result')
    expect(lost.result).toBe('gameover')
  })

  it('uses weighted random enemy actions for irregular enemies', () => {
    expect(getNextEnemyAction).toBeTypeOf('function')

    const orc: EnemyState = {
      id: 'orc',
      name: '오크',
      hp: 45,
      maxHp: 45,
      block: 0,
      poison: 0,
      actionIndex: 0,
    }

    const action = getNextEnemyAction!(orc, queueRandom([0.55]))

    expect(action.type).toBe('heavyAttack')
    expect(action.value).toBe(12)
  })

  it('thorns reflects direct enemy damage during the turn', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const next = useCard(
      {
        ...state,
        hand: [cardsById.thorns],
      },
      'thorns',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.player.hp).toBe(50)
    expect(next.enemy.hp).toBe(19)
  })

  it('drain restores health based on the damage dealt', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const next = useCard(
      {
        ...state,
        player: {
          ...state.player,
          hp: 30,
        },
        enemy: {
          ...state.enemy,
          hp: 20,
          block: 2,
        },
        hand: [cardsById.drain, cardsById.guard],
      },
      'drain',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.player.hp).toBe(33)
    expect(next.enemy.hp).toBe(14)
    expect(next.energy).toBe(1)
  })

  it('overload reduces energy for the next two turns before wearing off', () => {
    expect(endTurn).toBeTypeOf('function')

    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const afterOverload = useCard(
      {
        ...state,
        hand: [cardsById.overload],
      },
      'overload',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(afterOverload.energy).toBe(2)

    const secondPenaltyTurn = endTurn!(afterOverload, queueRandom([0, 0.5, 0.8]))
    const recoveredTurn = endTurn!(secondPenaltyTurn, queueRandom([0, 0.5, 0.8]))

    expect(secondPenaltyTurn.energy).toBe(2)
    expect(recoveredTurn.energy).toBe(3)
  })

  it('cleanse removes poison and sets up the next attack', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const cleaned = useCard(
      {
        ...state,
        player: {
          ...state.player,
          poison: 3,
        },
        hand: [cardsById.cleanse, cardsById.strike],
      },
      'cleanse',
      queueRandom([0, 0.5, 0.8]),
    )
    const attacked = useCard(
      {
        ...cleaned,
        hand: [cardsById.strike],
      },
      'strike',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(cleaned.player.poison).toBe(0)
    expect(cleaned.player.attackBonus).toBe(4)
    expect(attacked.enemy.hp).toBe(14)
  })

  it('mimic copies the enemy next action before the enemy acts', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const next = useCard(
      {
        ...state,
        hand: [cardsById.mimic, cardsById.guard],
      },
      'mimic',
      queueRandom([0, 0.5, 0.8]),
    )

    expect(next.enemy.hp).toBe(19)
    expect(next.energy).toBe(1)
  })
})
