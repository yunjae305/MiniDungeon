import type { EnemyDefinition } from './types'

export const enemies: EnemyDefinition[] = [
  {
    id: 'slime',
    name: '슬라임',
    maxHp: 26,
    kind: 'normal',
    phases: [
      {
        id: 'slime-base',
        minHpRatio: 0,
        actions: [
          { type: 'attack', value: 6, label: '점액 박치기' },
          { type: 'block', value: 5, label: '점액 응축' },
          { type: 'vulnerable', value: 1, label: '질척한 족쇄' },
        ],
      },
    ],
  },
  {
    id: 'goblin',
    name: '고블린',
    maxHp: 34,
    kind: 'normal',
    phases: [
      {
        id: 'goblin-base',
        minHpRatio: 0,
        actions: [
          { type: 'attack', value: 7, label: '재빠른 찌르기' },
          { type: 'block', value: 6, label: '뼈방패 세우기' },
          { type: 'attack', value: 9, label: '빈틈 베기' },
        ],
      },
    ],
  },
  {
    id: 'bat',
    name: '박쥐',
    maxHp: 30,
    kind: 'normal',
    phases: [
      {
        id: 'bat-calm',
        minHpRatio: 0.5,
        actions: [
          { type: 'poison', value: 2, label: '독안개 살포' },
          { type: 'attack', value: 5, label: '급강하' },
          { type: 'attack', value: 6, label: '피비린내 물기' },
        ],
      },
      {
        id: 'bat-frenzy',
        minHpRatio: 0,
        actions: [
          { type: 'attack', value: 8, label: '난도질 급습' },
          { type: 'poison', value: 3, label: '심독 분사' },
        ],
      },
    ],
  },
  {
    id: 'orc',
    name: '오크 용사',
    maxHp: 50,
    kind: 'elite',
    phases: [
      {
        id: 'orc-stance',
        minHpRatio: 0.45,
        actions: [
          { type: 'block', value: 8, label: '강철 버티기' },
          { type: 'attack', value: 12, label: '분쇄 강타' },
          { type: 'vulnerable', value: 1, label: '전투 포효' },
        ],
      },
      {
        id: 'orc-rage',
        minHpRatio: 0,
        actions: [
          { type: 'attack', value: 14, label: '광란의 도끼질' },
          { type: 'attack', value: 16, label: '목덜미 찍기' },
        ],
      },
    ],
  },
  {
    id: 'sentinel',
    name: '석상 수호자',
    maxHp: 54,
    kind: 'elite',
    phases: [
      {
        id: 'sentinel-wall',
        minHpRatio: 0.5,
        actions: [
          { type: 'block', value: 10, label: '석벽 전개' },
          { type: 'attack', value: 10, label: '암석 낙하' },
          { type: 'poison', value: 2, label: '부식 가루' },
        ],
      },
      {
        id: 'sentinel-core',
        minHpRatio: 0,
        actions: [
          { type: 'attack', value: 15, label: '핵심 진동파' },
          { type: 'vulnerable', value: 2, label: '균열 표식' },
        ],
      },
    ],
  },
  {
    id: 'boss',
    name: '던전 보스',
    maxHp: 72,
    kind: 'boss',
    phases: [
      {
        id: 'boss-command',
        minHpRatio: 0.5,
        actions: [
          { type: 'block', value: 10, label: '어둠 장막' },
          { type: 'poison', value: 3, label: '부패 숨결' },
          { type: 'attack', value: 14, label: '군주 강타' },
        ],
      },
      {
        id: 'boss-doom',
        minHpRatio: 0,
        actions: [
          { type: 'attack', value: 18, label: '파멸의 강타' },
          { type: 'vulnerable', value: 2, label: '절망 각인' },
          { type: 'attack', value: 16, label: '암흑 연격' },
        ],
      },
    ],
  },
]

export const enemiesById = Object.fromEntries(enemies.map((enemy) => [enemy.id, enemy])) as Record<string, EnemyDefinition>

export function getEnemyById(enemyId: string) {
  return enemiesById[enemyId]
}
