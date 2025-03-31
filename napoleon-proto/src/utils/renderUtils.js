export function drawHex(ctx, x, y, size, color, isHighlighted, hex, zoom, isUnitHighlighted) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = isHighlighted || isUnitHighlighted ? 'yellow' : '#000000';
  ctx.lineWidth = 1 / zoom;
  ctx.stroke();

  if (hex.feature) {
    if (hex.feature === 'city') {
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (hex.feature === 'river') {
      ctx.fillStyle = '#00f';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (hex.name) {
    ctx.fillStyle = '#000';
    ctx.font = `${10 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hex.name, x, y);
  }
}

export function drawFeatures(ctx, features, hexSize, hexWidth, hexHeight, zoom, offset) {
  const hexToPixel = (q, r) => {
    const x = q * hexWidth * 0.75;
    const y = r * hexHeight;
    const offsetX = r % 2 === 0 ? 0 : hexWidth * 0.375;
    return { x: x + offsetX, y };
  };

  if (features.roads) {
    features.roads.forEach(road => {
      const path = road.path;
      if (path.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2 / zoom;
      for (let i = 0; i < path.length; i++) {
        const [q, r] = path[i];
        const { x, y } = hexToPixel(q, r);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });
  }
}

export function drawUnits(ctx, units, hexSize, hexWidth, hexHeight, zoom, position, selectedUnitId) {
  units.forEach(unit => {
    const { x, y } = position; // Use the hex’s pre-calculated coords

    // Draw unit as a colored circle
    ctx.fillStyle = unit.team === 'blue' ? '#0000ff' : '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, hexSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw the first letter of the unit name
    ctx.fillStyle = '#fff';
    ctx.font = `${10 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.name.charAt(0), x, y);
  });
}