import { describe, expect, it } from 'vitest'
import { cardsById } from './cards'
import { startGame, selectRewardCard, useCard } from './engine'

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
    expect(state.enemy.name).toBe('Slime')
    expect(state.deck).toHaveLength(5)
    expect(state.hand).toHaveLength(3)
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
    expect(next.logs.at(-1)).toContain('턴 준비')
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
    expect(advanced.enemy.name).toBe('Goblin')
    expect(advanced.deck).toHaveLength(6)
    expect(advanced.hand).toHaveLength(2)
  })

  it('ends the run with clear on stage five victory', () => {
    const state = startGame(queueRandom([0, 0.2, 0.4]))
    const won = useCard(
      {
        ...state,
        stage: 5,
        enemy: {
          id: 'boss',
          name: 'Dungeon Boss',
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
})
