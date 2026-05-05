import type { EnemyDefinition } from './types'

export const enemies: EnemyDefinition[] = [
  {
    id: 'slime',
    name: '슬라임',
    maxHp: 24,
    behaviorMode: 'sequential',
    actions: [
      { type: 'attack', value: 5, label: '끈적한 몸통 박치기' },
      { type: 'attack', value: 6, label: '몸통 짓누르기' },
    ],
  },
  {
    id: 'goblin',
    name: '고블린',
    maxHp: 32,
    behaviorMode: 'sequential',
    actions: [
      { type: 'attack', value: 6, label: '단검 투척' },
      { type: 'block', value: 5, label: '고철 방패' },
      { type: 'attack', value: 7, label: '난폭한 돌진' },
    ],
  },
  {
    id: 'bat',
    name: '박쥐',
    maxHp: 28,
    behaviorMode: 'weighted_random',
    actions: [
      { type: 'attack', value: 4, label: '날개 베기', weight: 4 },
      { type: 'poison', value: 2, label: '독성 물기', weight: 3 },
      { type: 'attack', value: 6, label: '급강하 돌진', weight: 3 },
    ],
  },
  {
    id: 'orc',
    name: '오크',
    maxHp: 45,
    behaviorMode: 'weighted_random',
    actions: [
      { type: 'attack', value: 8, label: '도끼 휘두르기', weight: 3 },
      { type: 'heavyAttack', value: 12, label: '분쇄 일격', weight: 4 },
      { type: 'attack', value: 9, label: '전쟁의 발구르기', weight: 3 },
    ],
  },
  {
    id: 'boss',
    name: '던전 보스',
    maxHp: 70,
    behaviorMode: 'weighted_random',
    actions: [
      { type: 'attack', value: 8, label: '왕의 참격', weight: 3 },
      { type: 'block', value: 8, label: '암석 수비', weight: 2 },
      { type: 'heavyAttack', value: 14, label: '대파멸', weight: 3 },
      { type: 'poison', value: 3, label: '암흑 독기', weight: 2 },
    ],
  },
]

export const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>

export function getEnemyByStage(stage: number) {
  return enemies[Math.max(0, Math.min(enemies.length - 1, stage - 1))]
}
