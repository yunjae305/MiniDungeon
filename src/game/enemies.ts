import type { EnemyDefinition } from './types'

export const enemies: EnemyDefinition[] = [
  {
    id: 'slime',
    name: 'Slime',
    maxHp: 24,
    actions: [
      { type: 'attack', value: 5, label: '점액 충돌' },
      { type: 'attack', value: 6, label: '점프 강타' },
    ],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    maxHp: 32,
    actions: [
      { type: 'attack', value: 6, label: '단검 베기' },
      { type: 'block', value: 5, label: '뒤틀린 방패' },
      { type: 'attack', value: 7, label: '매복 찌르기' },
    ],
  },
  {
    id: 'bat',
    name: 'Bat',
    maxHp: 28,
    actions: [
      { type: 'attack', value: 4, label: '날개 할퀴기' },
      { type: 'poison', value: 2, label: '독 이빨' },
      { type: 'attack', value: 6, label: '급강하' },
    ],
  },
  {
    id: 'orc',
    name: 'Orc',
    maxHp: 45,
    actions: [
      { type: 'attack', value: 8, label: '도끼 강타' },
      { type: 'heavyAttack', value: 12, label: '대지 분쇄' },
      { type: 'attack', value: 9, label: '흉포한 돌진' },
    ],
  },
  {
    id: 'boss',
    name: 'Dungeon Boss',
    maxHp: 70,
    actions: [
      { type: 'attack', value: 8, label: '군주의 검격' },
      { type: 'block', value: 8, label: '암흑 장막' },
      { type: 'heavyAttack', value: 14, label: '붕괴의 일격' },
      { type: 'poison', value: 3, label: '독 숨결' },
    ],
  },
]

export const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>

export function getEnemyByStage(stage: number) {
  return enemies[Math.max(0, Math.min(enemies.length - 1, stage - 1))]
}
