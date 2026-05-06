import type { DungeonMap, MapNode, MapNodeType } from './types'

function createSeededRandom(seed: number) {
  let state = seed >>> 0

  if (state === 0) {
    state = 1
  }

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number) {
  const pool = [...items]

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = pool[index]

    pool[index] = pool[swapIndex]
    pool[swapIndex] = current
  }

  return pool
}

export function normalizeSeed(seed?: number | string) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return Math.max(1, Math.floor(Math.abs(seed)))
  }

  if (typeof seed === 'string') {
    const trimmed = seed.trim()

    if (trimmed.length > 0) {
      const parsed = Number.parseInt(trimmed, 10)

      if (Number.isFinite(parsed)) {
        return Math.max(1, Math.floor(Math.abs(parsed)))
      }
    }
  }

  return 20260506
}

function createNode(row: number, lane: number, type: MapNodeType, enemyId: string | null): MapNode {
  return {
    id: `node-${row}-${lane}`,
    row,
    lane,
    type,
    nextNodeIds: [],
    enemyId,
  }
}

function createRow(row: number, types: MapNodeType[], enemyIds: Array<string | null>) {
  return types.map((type, lane) => createNode(row, lane, type, enemyIds[lane] ?? null))
}

function createConnections(rows: MapNode[][], random: () => number) {
  for (let rowIndex = 0; rowIndex < rows.length - 1; rowIndex += 1) {
    const row = rows[rowIndex]
    const nextRow = rows[rowIndex + 1]

    for (const node of row) {
      if (nextRow.length === 1) {
        node.nextNodeIds = [nextRow[0].id]
        continue
      }

      if (node.lane === 0) {
        node.nextNodeIds = [nextRow[0].id, nextRow[1].id]
        continue
      }

      if (node.lane === nextRow.length - 1) {
        node.nextNodeIds = [nextRow[nextRow.length - 1].id, nextRow[nextRow.length - 2].id]
        continue
      }

      const sideLane = random() < 0.5 ? node.lane - 1 : node.lane + 1

      node.nextNodeIds = [nextRow[node.lane].id, nextRow[sideLane].id]
    }
  }
}

export function createDungeonMap(seed?: number | string): DungeonMap {
  const normalizedSeed = normalizeSeed(seed)
  const random = createSeededRandom(normalizedSeed)
  const normalEnemies = shuffle(['slime', 'goblin', 'bat', 'slime', 'goblin', 'bat'], random)
  const eliteEnemies = shuffle(['orc', 'sentinel'], random)
  const rowOneTypes = shuffle<MapNodeType>(['battle', 'battle', 'rest'], random)
  const rowTwoTypes = shuffle<MapNodeType>(['battle', 'elite', 'shop'], random)
  const rowThreeTypes = shuffle<MapNodeType>(['battle', 'elite', 'rest'], random)
  const rows = [
    createRow(0, ['battle', 'battle', 'battle'], normalEnemies.splice(0, 3)),
    createRow(
      1,
      rowOneTypes,
      rowOneTypes.map((type) => (type === 'battle' ? normalEnemies.shift() ?? 'slime' : null)),
    ),
    createRow(
      2,
      rowTwoTypes,
      rowTwoTypes.map((type) => {
        if (type === 'battle') {
          return normalEnemies.shift() ?? 'goblin'
        }

        if (type === 'elite') {
          return eliteEnemies[0]
        }

        return null
      }),
    ),
    createRow(
      3,
      rowThreeTypes,
      rowThreeTypes.map((type) => {
        if (type === 'battle') {
          return normalEnemies.shift() ?? 'bat'
        }

        if (type === 'elite') {
          return eliteEnemies[1] ?? eliteEnemies[0]
        }

        return null
      }),
    ),
    [createNode(4, 1, 'boss', 'boss')],
  ]

  createConnections(rows, random)

  return {
    seed: normalizedSeed,
    rows,
    availableNodeIds: rows[0].map((node) => node.id),
    clearedNodeIds: [],
  }
}

export function getMapNode(map: DungeonMap, nodeId: string) {
  return map.rows.flat().find((node) => node.id === nodeId) ?? null
}

export function getStageForScreen(map: DungeonMap, currentNode: MapNode | null) {
  if (currentNode) {
    return currentNode.row + 1
  }

  const nextNode = map.rows.flat().find((node) => map.availableNodeIds.includes(node.id))

  return (nextNode?.row ?? 0) + 1
}
