export function drawHex(ctx, x, y, size, color, isHighlighted, hex, zoom, isUnitHighlighted) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Base fill
  ctx.fillStyle = color;
  ctx.fill();

  if (hex.terrain === 'hills') {
    ctx.fillStyle = '#d2b48c'; // Light brown base
    ctx.fill();
    ctx.fillStyle = '#6b4e31'; // Dark brown hills
    const hillPositions = [
      { x: x - size * 0.4, y: y - size * 0.1, w: size * 0.4, h: size * 0.3 },
      { x: x + size * 0.1, y: y - size * 0.2, w: size * 0.5, h: size * 0.4 }
    ];
    hillPositions.forEach(hill => {
      ctx.beginPath();
      ctx.moveTo(hill.x, hill.y); // Left base
      ctx.quadraticCurveTo(hill.x + hill.w * 0.5, hill.y - hill.h, hill.x + hill.w, hill.y); // Curve to right base
      ctx.fill();
    });
  }

  // Woods: green shade + trees
  if (hex.terrain === 'woods') {
    ctx.fillStyle = '#759456'; // Dark green shade
    ctx.fill();
    ctx.fillStyle = '#006400'; // Tree green
    const treePositions = [
      { x: x - size * 0.4, y: y - size * 0.2 },
      { x: x + size * 0.3, y: y - size * 0.1 },
      { x: x, y: y + size * 0.3 },
    ];
    treePositions.forEach(pos => {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - size * 0.3);
      ctx.lineTo(pos.x - size * 0.2, pos.y + size * 0.2);
      ctx.lineTo(pos.x + size * 0.2, pos.y + size * 0.2);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Crops: yellow + brown rectangles
  if (hex.terrain === 'crops') {
    ctx.fillStyle = '#e6b800'; // Yellow base
    ctx.fill();
    ctx.fillStyle = '#8b5a2b'; // Brown patches
    const cropRects = [
      { x: x - size * 0.4, y: y - size * 0.2, w: size * 0.3, h: size * 0.1 },
      { x: x + size * 0.2, y: y, w: size * 0.2, h: size * 0.15 },
      { x: x - size * 0.1, y: y + size * 0.2, w: size * 0.25, h: size * 0.1 },
    ];
    cropRects.forEach(rect => {
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
  }

  // Swamps: light blue + blue lines
  if (hex.terrain === 'swamps') {
    ctx.fillStyle = '#89c7a0';
    ctx.fill();
    ctx.strokeStyle = '#0000ff'; // Blue lines
    ctx.lineWidth = 0.5 / zoom;
    const swampLines = [
      { x1: x - size * 0.5, y1: y - size * 0.2, x2: x + size * 0.5, y2: y - size * 0.2 },
      { x1: x - size * 0.4, y1: y, x2: x + size * 0.4, y2: y },
      { x1: x - size * 0.5, y1: y + size * 0.3, x2: x + size * 0.5, y2: y + size * 0.3 },
    ];
    swampLines.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    });
  }

  // Border
  ctx.strokeStyle = isHighlighted ? 'yellow' : '#000';
  ctx.lineWidth = 0.1 / zoom;
  ctx.stroke();

  // Coordinates—show only when zoomed in (e.g., zoom >= 2)
  if (zoom >= 2) {
    ctx.fillStyle = '#000';
    ctx.font = `${6 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${hex.q},${hex.r}`, x, y - size * 0.8);
  }

  // Features (city, river)
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

  // Named hexes
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
    const x = q * hexWidth;
    const y = r * hexHeight;
    const offsetX = r % 2 === 0 ? 0 : hexWidth * 0.5; // Odd-r shift
    return { x: x + offsetX, y };
  };

  if (features.roads) {
    Object.entries(features.roads).forEach(([key, neighbors]) => {
      const [q1, r1] = key.split(',').map(Number);
      const { x: x1, y: y1 } = hexToPixel(q1, r1);
      neighbors.forEach(neighbor => {
        const [q2, r2] = neighbor.split(',').map(Number);
        if (q1 < q2 || (q1 === q2 && r1 < r2)) { // Dedupe
          const { x: x2, y: y2 } = hexToPixel(q2, r2);
          ctx.beginPath();
          ctx.strokeStyle = '#996633';
          ctx.lineWidth = 2 / zoom;
          ctx.moveTo(x1, y1);

          // Add a sine-like curve with control points
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const waveAmp = hexSize * 0.5 / zoom; // Small wave, scales with zoom
          const cp1X = midX - waveAmp;
          const cp1Y = midY + waveAmp * Math.sin((x1 - x2) * 0.1); // Sine wiggle
          const cp2X = midX + waveAmp;
          const cp2Y = midY - waveAmp * Math.sin((x1 - x2) * 0.1);

          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x2, y2);
          ctx.stroke();
        }
      });
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