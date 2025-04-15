export function loadMap(mapData) {
  const { gridSize, hexes: mapHexes, units, features } = mapData;
  const hexes = [];
  for (let q = 0; q < gridSize; q++) {
    for (let r = 0; r < gridSize; r++) {
      const key = `${q},${r}`;
      const hexData = mapHexes[key] || { terrain: 'plains' };
      hexes.push({
        q,
        r,
        ...hexData,
        units: hexData.units || [],
        road: hexData.road || false,
        height: hexData.height || 0, // Add height, default 0
      });
    }
  }

  units.forEach(unit => {
    const hex = hexes.find(h => h.q === unit.position[0] && h.r === unit.position[1]);
    if (hex) hex.units.push(unit.id);
  });

  const roadGraph = {};
  if (features && features.roads) {
    features.roads.forEach(road => {
      for (let i = 0; i < road.path.length - 1; i++) {
        const [q1, r1] = road.path[i];
        const [q2, r2] = road.path[i + 1];
        const key1 = `${q1},${r1}`;
        const key2 = `${q2},${r2}`;
        const hex1 = hexes.find(h => h.q === q1 && h.r === r1);
        const hex2 = hexes.find(h => h.q === q2 && h.r === r2);
        if (hex1) hex1.road = true;
        if (hex2) hex2.road = true;
        roadGraph[key1] = roadGraph[key1] || [];
        roadGraph[key2] = roadGraph[key2] || [];
        if (!roadGraph[key1].includes(key2)) roadGraph[key1].push(key2);
        if (!roadGraph[key2].includes(key1)) roadGraph[key2].push(key1);
      }
    });
  }

  console.log('Generated roadGraph:', roadGraph);
  return { hexes, units, features: { roads: roadGraph } };
}

export function getHexAtPosition(x, y, hexes, hexWidth, hexHeight, zoom, offset) {
  const adjustedX = (x - offset.x) / zoom;
  const adjustedY = (y - offset.y) / zoom;
  const r = Math.round(adjustedY / hexHeight);
  const offsetX = r % 2 === 0 ? 0 : hexWidth * 0.5;
  const q = Math.round((adjustedX - offsetX) / hexWidth);
  return hexes.find(h => h.q === q && h.r === r);
}

export function hexDistance(q1, r1, q2, r2) {
  const aq1 = q1 - Math.floor(r1 / 2);
  const ar1 = r1;
  const aq2 = q2 - Math.floor(r2 / 2);
  const ar2 = r2;
  return Math.max(
    Math.abs(aq1 - aq2),
    Math.abs(ar1 - ar2),
    Math.abs((aq1 + ar1) - (aq2 + ar2))
  );
}

// 0.2 Super Advanced Functions
export function getPathCost(path, hexes, costFn) {
  if (!path || path.length < 1) return { cost: 0, valid: false };
  let cost = 0;
  let valid = true;

  for (let i = 0; i < path.length - 1; i++) {
    const [q1, r1] = path[i];
    const [q2, r2] = path[i + 1];
    const hex1 = hexes.find(h => h.q === q1 && h.r === r1);
    const hex2 = hexes.find(h => h.q === q2 && h.r === r2);

    if (!hex1 || !hex2 || hexDistance(q1, r1, q2, r2) !== 1) {
      valid = false;
      break;
    }

    cost += costFn(hex2, hex1);
  }

  return { cost, valid };
}

export function getShortestPath(startQ, startR, endQ, endR, hexes, maxCost, costFn) {
  if (hexDistance(startQ, startR, endQ, endR) > maxCost) return { path: [], cost: Infinity };

  const open = new PriorityQueue((a, b) => a.cost + a.heuristic < b.cost + b.heuristic);
  const closed = new Set();
  open.push({
    q: startQ,
    r: startR,
    cost: 0,
    path: [[startQ, startR]],
    heuristic: hexDistance(startQ, startR, endQ, endR)
  });

  while (open.size()) {
    const { q, r, cost, path, heuristic } = open.pop();
    if (q === endQ && r === endR) return { path, cost };
    if (closed.has(`${q},${r}`)) continue;
    closed.add(`${q},${r}`);

    const hex = hexes.find(h => h.q === q && h.r === r);
    if (!hex) continue;

    getNeighbors(q, r).forEach(([nq, nr]) => {
      const nHex = hexes.find(h => h.q === nq && h.r === nr);
      if (!nHex || closed.has(`${nq},${nr}`)) return;

      const moveCost = costFn(nHex, hex);
      const totalCost = cost + moveCost;
      if (totalCost <= maxCost) {
        open.push({
          q: nq,
          r: nr,
          cost: totalCost,
          path: [...path, [nq, nr]],
          heuristic: hexDistance(nq, nr, endQ, endR)
        });
      }
    });
  }

  return { path: [], cost: Infinity };
}

export function getHexRange(q, r, maxCost, hexes, costFn, unitElevation = 0) {
  const reachable = [];
  const visited = new Set();
  const queue = [{ q, r, cost: 0, visible: true }];
  visited.add(`${q},${r}`);

  while (queue.length) {
    const { q, r, cost, visible } = queue.shift();
    const hex = hexes.find(h => h.q === q && h.r === r);
    if (!hex) continue;

    reachable.push({ q, r, cost, visible });

    getNeighbors(q, r).forEach(([nq, nr]) => {
      if (visited.has(`${nq},${nr}`)) return;
      const nHex = hexes.find(h => h.q === nq && h.r === nr);
      if (!nHex) return;

      const moveCost = costFn(nHex, hex, true); // isLOS mode
      const totalCost = cost + moveCost;
      const isBlocked = moveCost === Infinity || nHex.height > unitElevation + 1;
      if (totalCost <= maxCost && !isBlocked) {
        queue.push({ q: nq, r: nr, cost: totalCost, visible: visible && moveCost < Infinity });
        visited.add(`${nq},${nr}`);
      }
    });
  }

  return reachable;
}

// Helpers
export function getNeighbors(q, r) {
  return [
    [q + 1, r], [q + 1, r - 1], [q, r - 1], // Right, top-right, top
    [q - 1, r], [q - 1, r + 1], [q, r + 1]  // Left, bottom-left, bottom
  ];
}

function getTerrainCost(terrain, isLOS = false) {
  const costs = {
    plains: isLOS ? 1 : 1,
    woods: isLOS ? 2 : 2,
    hills: isLOS ? Infinity : 3, // Blocks LOS, high move cost
    crops: isLOS ? 1.5 : 1.5,
    swamps: isLOS ? 1.5 : 2.5
  };
  return costs[terrain] || 1;
}

function defaultCostFn(hex, prevHex, isLOS = false) {
  if (isLOS) {
    return getTerrainCost(hex.terrain, true);
  }
  const baseCost = hex.road ? 0.5 : getTerrainCost(hex.terrain);
  const elevCost = prevHex ? Math.abs(hex.height - prevHex.height) * 0.5 : 0;
  return baseCost + elevCost;
}

// Simple Priority Queue (for A*)
class PriorityQueue {
  constructor(comparator) {
    this.items = [];
    this.comparator = comparator;
  }

  push(item) {
    this.items.push(item);
    this.items.sort(this.comparator);
  }

  pop() {
    return this.items.shift();
  }

  size() {
    return this.items.length;
  }
}