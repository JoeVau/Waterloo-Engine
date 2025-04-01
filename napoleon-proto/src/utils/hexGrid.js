export function loadMap(mapData) {
  const { gridSize, hexes: mapHexes, units } = mapData;
  const hexes = [];
  for (let q = 0; q < gridSize; q++) {
    for (let r = 0; r < gridSize; r++) {
      const key = `${q},${r}`;
      const hexData = mapHexes[key] || { terrain: 'plains' };
      hexes.push({
        q,
        r,
        terrain: hexData.terrain,
        units: [],
        // visible: { blue: 'hidden', red: 'hidden' }, // Commented out - no fog
      });
    }
  }

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
  const x1 = q1 - Math.floor(r1 / 2);
  const x2 = q2 - Math.floor(r2 / 2);
  const z1 = r1;
  const z2 = r2;
  const y1 = -x1 - z1;
  const y2 = -x2 - z2;
  return Math.max(
    Math.abs(x1 - x2),
    Math.abs(y1 - y2),
    Math.abs(z1 - z2)
  );
}