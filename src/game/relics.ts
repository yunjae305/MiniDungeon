import type { RelicDefinition } from './types'

export const relics: RelicDefinition[] = [
  {
    id: 'venom_idol',
    name: '독니 부적',
    description: '중독을 부여할 때 중독 1을 추가합니다.',
    effect: {
      bonusPoison: 1,
    },
  },
  {
    id: 'hunter_emblem',
    name: '사냥 증표',
    description: '취약한 적을 공격할 때 피해 3을 추가합니다.',
    effect: {
      bonusDamageAgainstVulnerable: 3,
    },
  },
  {
    id: 'war_totem',
    name: '전투 토템',
    description: '전투 시작 시 방어도 6을 얻습니다.',
    effect: {
      battleStartBlock: 6,
    },
  },
  {
    id: 'ember_ring',
    name: '잔불 반지',
    description: '턴 시작 시 적이 중독 상태면 방어도 4를 얻습니다.',
    effect: {
      turnStartBlockIfEnemyPoisoned: 4,
    },
  },
]

export const relicsById = Object.fromEntries(relics.map((relic) => [relic.id, relic])) as Record<string, RelicDefinition>
