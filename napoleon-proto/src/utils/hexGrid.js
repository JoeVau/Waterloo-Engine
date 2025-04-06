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
        ...hexData, // Spread all properties (terrain, feature, name, etc.)
        units: hexData.units || [], // Default units if not present
        road: hexData.road || false, // Default road if not present
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
  const aq1 = q1 - Math.floor(r1 / 2); // Axial q
  const ar1 = r1;                      // Axial r
  const aq2 = q2 - Math.floor(r2 / 2);
  const ar2 = r2;
  return Math.max(
    Math.abs(aq1 - aq2),
    Math.abs(ar1 - ar2),
    Math.abs((aq1 + ar1) - (aq2 + ar2))
  );
}