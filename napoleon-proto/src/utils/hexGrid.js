export function loadMap(mapData) {
  const { gridSize, hexes: mapHexes, units } = mapData;
  const hexes = [];
  for (let q = 0; q < gridSize; q++) {
    for (let r = 0; r < gridSize; r++) {
      const key = `${q},${r}`;
      const hexData = mapHexes[key] || { terrain: 'plains' }; // Default to plains if not in JSON
      hexes.push({
        q,
        r,
        terrain: hexData.terrain,
        units: [],
        visible: { blue: 'hidden', red: 'hidden' }, // Fog per player
      });
    }
  }

  // Place units in hexes
  units.forEach(unit => {
    const hex = hexes.find(h => h.q === unit.position[0] && h.r === unit.position[1]);
    if (hex) hex.units.push(unit.id);
  });

  return { hexes, units };
}

export function getHexAtPosition(x, y, hexes, hexWidth, hexHeight, zoom, offset) {
  const adjustedX = (x - offset.x) / zoom;
  const adjustedY = (y - offset.y) / zoom;
  const r = Math.round(adjustedY / hexHeight);
  const offsetX = r % 2 === 0 ? 0 : hexWidth * 0.375;
  const q = Math.round((adjustedX - offsetX) / (hexWidth * 0.75));
  return hexes.find(h => h.q === q && h.r === r);
}

export function hexDistance(q1, r1, q2, r2) {
  return Math.max(
    Math.abs(q1 - q2),
    Math.abs(r1 - r2),
    Math.abs((q1 + r1) - (q2 + r2))
  );
}