import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Map settings
const GRID_SIZE = 50;
const OUTPUT_PATH = join(process.cwd(), 'src', 'data', 'maps', 'randomCampaign.json');

// Terrain distribution
const TERRAIN_WEIGHTS = {
  plains: 0.5, // 50%
  woods: 0.25, // 25%
  hills: 0.25, // 25%
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

// Utility to generate a random path
function generatePath(start, length) {
  const path = [[start.q, start.r]];
  let current = { q: start.q, r: start.r };
  for (let i = 0; i < length - 1; i++) {
    // Pick a random adjacent hex
    const directions = [
      [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1] // Flat-top hex neighbors
    ];
    const [dq, dr] = directions[Math.floor(Math.random() * directions.length)];
    current = { q: current.q + dq, r: current.r + dr };
    // Ensure within bounds
    if (current.q >= 0 && current.q < GRID_SIZE && current.r >= 0 && current.r < GRID_SIZE) {
      path.push([current.q, current.r]);
    } else {
      break;
    }
  }
  return path;
}

// Generate the map
function generateRandomMap() {
  const map = {
    name: "Random Campaign Map",
    gridSize: GRID_SIZE,
    hexes: {},
    features: {
      rivers: [],
      roads: [],
    },
  };

  // Step 1: Initialize all hexes with random terrain
  for (let q = 0; q < GRID_SIZE; q++) {
    for (let r = 0; r < GRID_SIZE; r++) {
      const terrain = weightedRandom(TERRAIN_WEIGHTS);
      map.hexes[`${q},${r}`] = { terrain };
    }
  }

  // Step 2: Create terrain clusters
  const numClusters = 10; // 10 clusters each for woods and hills
  for (let i = 0; i < numClusters; i++) {
    // Woods cluster
    const woodsCenterQ = Math.floor(Math.random() * GRID_SIZE);
    const woodsCenterR = Math.floor(Math.random() * GRID_SIZE);
    for (let dq = -2; dq <= 2; dq++) {
      for (let dr = -2; dr <= 2; dr++) {
        const q = woodsCenterQ + dq;
        const r = woodsCenterR + dr;
        if (q >= 0 && q < GRID_SIZE && r >= 0 && r < GRID_SIZE) {
          map.hexes[`${q},${r}`].terrain = 'woods';
        }
      }
    }

    // Hills cluster
    const hillsCenterQ = Math.floor(Math.random() * GRID_SIZE);
    const hillsCenterR = Math.floor(Math.random() * GRID_SIZE);
    for (let dq = -2; dq <= 2; dq++) {
      for (let dr = -2; dr <= 2; dr++) {
        const q = hillsCenterQ + dq;
        const r = hillsCenterR + dr;
        if (q >= 0 && q < GRID_SIZE && r >= 0 && r < GRID_SIZE) {
          map.hexes[`${q},${r}`].terrain = 'hills';
        }
      }
    }
  }

  // Step 3: Add cities
  const numCities = 3;
  const cityPositions = [];
  while (cityPositions.length < numCities) {
    const q = Math.floor(Math.random() * GRID_SIZE);
    const r = Math.floor(Math.random() * GRID_SIZE);
    const pos = `${q},${r}`;
    // Ensure cities are at least 10 hexes apart
    const tooClose = cityPositions.some(city => {
      const [cq, cr] = city.split(',').map(Number);
      const dist = Math.sqrt((cq - q) ** 2 + (cr - r) ** 2);
      return dist < 10;
    });
    if (!tooClose) {
      cityPositions.push(pos);
      map.hexes[pos] = {
        ...map.hexes[pos],
        feature: 'city',
        name: `City ${String.fromCharCode(65 + cityPositions.length - 1)}`, // City A, B, C
      };
    }
  }

  // Step 4: Add rivers
  const numRivers = 2;
  for (let i = 0; i < numRivers; i++) {
    const startQ = Math.floor(Math.random() * GRID_SIZE);
    const startR = Math.floor(Math.random() * GRID_SIZE);
    const path = generatePath({ q: startQ, r: startR }, 5); // 5 hexes long
    map.features.rivers.push({ path });
  }

  // Step 5: Add roads (some connecting cities)
  const numRoads = 3;
  for (let i = 0; i < numRoads; i++) {
    let start;
    if (i < cityPositions.length) {
      // Start from a city
      const [q, r] = cityPositions[i].split(',').map(Number);
      start = { q, r };
    } else {
      // Random start
      start = {
        q: Math.floor(Math.random() * GRID_SIZE),
        r: Math.floor(Math.random() * GRID_SIZE),
      };
    }
    const path = generatePath(start, 7); // 7 hexes long
    map.features.roads.push({ path });
  }

  return map;
}

// Save the map to file
function saveMap() {
  const map = generateRandomMap();
  const outputDir = join(process.cwd(), 'src', 'data', 'maps');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  writeFileSync(OUTPUT_PATH, JSON.stringify(map, null, 2));
  console.log(`Random map generated and saved to ${OUTPUT_PATH}`);
}

// Run the script
saveMap();