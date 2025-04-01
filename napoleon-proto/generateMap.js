import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Map settings
const GRID_SIZE = 50;
const OUTPUT_PATH = join(process.cwd(), 'src', 'data', 'maps', 'campaign2.json');

// Terrain distribution
const TERRAIN_WEIGHTS = {
  plains: 0.5,
  woods: 0.2,
  hills: 0.15,
  crops: 0.1,
  swamps: 0.05,
};

// Utility to pick a random element based on weights
function weightedRandom(weights) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of Object.entries(weights)) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return Object.keys(weights)[0];
}

// Utility to generate a random winding path
function generatePath(start, length) {
  const path = [[start.q, start.r]];
  let current = { q: start.q, r: start.r };
  for (let i = 0; i < length - 1; i++) {
    const directions = [
      [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1] // Flat-top hex neighbors
    ];
    const [dq, dr] = directions[Math.floor(Math.random() * directions.length)];
    current = { q: current.q + dq, r: current.r + dr };
    if (current.q >= 0 && current.q < GRID_SIZE && current.r >= 0 && current.r < GRID_SIZE) {
      path.push([current.q, current.r]);
    } else {
      break;
    }
  }
  return path;
}

// Distance between hexes (simplified Euclidean for now)
function hexDistance(q1, r1, q2, r2) {
  return Math.sqrt((q1 - q2) ** 2 + (r1 - r2) ** 2);
}

// Generate the map
function generateRandomMap() {
  const map = {
    name: "Campaign 2",
    gridSize: GRID_SIZE,
    hexes: {},
    units: [],
    features: {
      roads: [],
    },
  };

  // Step 1: Initialize hexes with random terrain
  for (let q = 0; q < GRID_SIZE; q++) {
    for (let r = 0; r < GRID_SIZE; r++) {
      const terrain = weightedRandom(TERRAIN_WEIGHTS);
      map.hexes[`${q},${r}`] = { terrain };
    }
  }

  // Step 2: Terrain splotches (5 clusters each)
  const terrainTypes = ['woods', 'hills', 'crops', 'swamps'];
  terrainTypes.forEach(type => {
    for (let i = 0; i < 5; i++) {
      const centerQ = Math.floor(Math.random() * GRID_SIZE);
      const centerR = Math.floor(Math.random() * GRID_SIZE);
      for (let dq = -2; dq <= 2; dq++) {
        for (let dr = -2; dr <= 2; dr++) {
          const q = centerQ + dq;
          const r = centerR + dr;
          if (q >= 0 && q < GRID_SIZE && r >= 0 && r < GRID_SIZE) {
            map.hexes[`${q},${r}`].terrain = type;
          }
        }
      }
    }
  });

  // Step 3: Add 10 cities
  const numCities = 10;
  const cityPositions = [];
  while (cityPositions.length < numCities) {
    const q = Math.floor(Math.random() * GRID_SIZE);
    const r = Math.floor(Math.random() * GRID_SIZE);
    const pos = `${q},${r}`;
    const tooClose = cityPositions.some(city => {
      const [cq, cr] = city.split(',').map(Number);
      const dist = hexDistance(cq, cr, q, r);
      return dist < 8; // Min distance between cities
    });
    if (!tooClose) {
      cityPositions.push(pos);
      map.hexes[pos] = {
        ...map.hexes[pos],
        feature: 'city',
        name: `City ${String.fromCharCode(65 + cityPositions.length - 1)}`, // A–J
      };
    }
  }

  // Step 4: Add 3 winding roads
  const numRoads = 3;
  for (let i = 0; i < numRoads; i++) {
    const start = {
      q: Math.floor(Math.random() * GRID_SIZE),
      r: Math.floor(Math.random() * GRID_SIZE),
    };
    const path = generatePath(start, 15); // 15-hex winding roads
    map.features.roads.push({ path });
  }

  // Step 5: Add 5 units per side with distance
  const blueUnits = [];
  const redUnits = [];
  const minDistance = 10; // Between teams

  // Blue side (left half)
  while (blueUnits.length < 5) {
    const q = Math.floor(Math.random() * (GRID_SIZE / 2));
    const r = Math.floor(Math.random() * GRID_SIZE);
    const pos = [q, r];
    const tooClose = blueUnits.some(u => hexDistance(u.position[0], u.position[1], q, r) < 5);
    if (!tooClose) {
      blueUnits.push({
        id: `blue_${blueUnits.length + 1}`,
        name: `Blue Unit ${blueUnits.length + 1}`,
        team: 'blue',
        position: pos,
        strength: Math.floor(Math.random() * 9000) + 1000, // 1000–10,000
      });
    }
  }

  // Red side (right half)
  while (redUnits.length < 5) {
    const q = Math.floor(Math.random() * (GRID_SIZE / 2)) + (GRID_SIZE / 2);
    const r = Math.floor(Math.random() * GRID_SIZE);
    const pos = [q, r];
    const tooCloseBlue = blueUnits.some(u => hexDistance(u.position[0], u.position[1], q, r) < minDistance);
    const tooCloseRed = redUnits.some(u => hexDistance(u.position[0], u.position[1], q, r) < 5);
    if (!tooCloseBlue && !tooCloseRed) {
      redUnits.push({
        id: `red_${redUnits.length + 1}`,
        name: `Red Unit ${redUnits.length + 1}`,
        team: 'red',
        position: pos,
        strength: Math.floor(Math.random() * 9000) + 1000,
      });
    }
  }

  map.units = [...blueUnits, ...redUnits];
  return map;
}

// Save the map
function saveMap() {
  const map = generateRandomMap();
  const outputDir = join(process.cwd(), 'src', 'data', 'maps');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(map, null, 2));
  console.log(`Campaign 2 generated and saved to ${OUTPUT_PATH}`);
}

saveMap();