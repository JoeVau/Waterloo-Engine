// Draws terrain and features
export function drawHexBase(ctx, x, y, size, color, isHighlighted, hex, zoom, isUnitHighlighted) {
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

  switch (hex.terrain) {
    case 'hills':
      ctx.fillStyle = '#d2b48c';
      ctx.fill();
      ctx.fillStyle = '#6b4e31';
      const hillPositions = [
        { x: x - size * 0.4, y: y - size * 0.1, w: size * 0.4, h: size * 0.3 },
        { x: x + size * 0.1, y: y - size * 0.2, w: size * 0.5, h: size * 0.4 }
      ];
      hillPositions.forEach(hill => {
        ctx.beginPath();
        ctx.moveTo(hill.x, hill.y);
        ctx.quadraticCurveTo(hill.x + hill.w * 0.5, hill.y - hill.h, hill.x + hill.w, hill.y);
        ctx.fill();
      });
      break;

    case 'woods':
      ctx.fillStyle = '#759456';
      ctx.fill();
      ctx.fillStyle = '#006400';
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
      break;

    case 'crops':
      ctx.fillStyle = '#d9e8d9';
      ctx.fill();
      ctx.strokeStyle = '#2f4f2f';
      ctx.lineWidth = 0.5 / zoom;
      const wheatShades = ['#e6d8a8', '#d2c68a', '#bfa86b'];
      const splotchPositions = [
        { x: x - size * 0.5, y: y - size * 0.4, s: size * 0.25 },
        { x: x + size * 0.35, y: y - size * 0.35, s: size * 0.38 },
        { x: x - size * 0.45, y: y + size * 0.3, s: size * 0.25 },
        { x: x + size * 0.4, y: y + size * 0.25, s: size * 0.22 },
        { x: x - size * 0.2, y: y - size * 0.15, s: size * 0.28 },
        { x: x + size * 0.15, y: y + size * 0.1, s: size * 0.31 },
      ];
      splotchPositions.forEach((pos, i) => {
        ctx.fillStyle = wheatShades[i % wheatShades.length];
        ctx.fillRect(pos.x, pos.y, pos.s, pos.s);
        ctx.strokeRect(pos.x, pos.y, pos.s, pos.s);
      });
      break;

    case 'swamps':
      ctx.fillStyle = '#b8d8b8';
      ctx.fill();
      ctx.fillStyle = '#4682b4';
      ctx.font = `${size * 0.8 / zoom}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const dashPositions = [
        { x: x - size * 0.3, y: y - size * 0.2 },
        { x: x + size * 0.2, y: y - size * 0.1 },
        { x: x - size * 0.1, y: y + size * 0.3 },
        { x: x + size * 0.3, y: y + size * 0.2 },
        { x: x + size * 0.1, y: y + size * 0.4 },
        { x: x + size * 0.3, y: y + size * 0.55 },
      ];
      dashPositions.forEach(pos => {
        ctx.fillText('__', pos.x, pos.y);
      });
      ctx.strokeStyle = '#6b8e23';
      ctx.lineWidth = 0.5 / zoom;
      ctx.stroke();
      break;
  }

  ctx.strokeStyle = isHighlighted ? 'yellow' : '#000';
  ctx.lineWidth = 0.1 / zoom;
  ctx.stroke();

  if (zoom >= 2) {
    ctx.fillStyle = '#000';
    ctx.font = `${6 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${hex.q},${hex.r}`, x, y - size * 0.8);
  }

  if (hex.feature) {
    switch (hex.feature) {
      case 'city':
        let seed = hex.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const rand = (max) => {
          const x = Math.sin(seed++) * 10000;
          return Math.floor((x - Math.floor(x)) * max);
        };
        const brickColor = '#8B4513';
        const tileCount = 20;
        const tiles = [];
        for (let i = 0; i < tileCount; i++) {
          let attempts = 0;
          let placed = false;
          while (!placed && attempts < 50) {
            const tileSize = size * (0.15 + rand(11) / 100);
            const offsetX = (rand(100) / 100 - 0.5) * size * 0.9;
            const offsetY = (rand(100) / 100 - 0.5) * size * 0.9;
            const tx = x + offsetX;
            const ty = y + offsetY;
            const rotation = (rand(2) - 0.5) * Math.PI / 12;
            const minGap = tileSize * 0.5;
            const overlaps = tiles.some(tile => {
              const dx = tile.x - tx;
              const dy = tile.y - ty;
              return Math.sqrt(dx * dx + dy * dy) < (tileSize + tile.size) * 0.5 + minGap;
            });
            const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            const isRoadZone = (distFromCenter < size * 0.2 || distFromCenter > size * 0.4) && rand(100) < 30;
            if (!overlaps && !isRoadZone) {
              tiles.push({ x: tx, y: ty, rotation, size: tileSize });
              placed = true;
            }
            attempts++;
          }
        }
        tiles.forEach(tile => {
          ctx.save();
          ctx.translate(tile.x, tile.y);
          ctx.rotate(tile.rotation);
          ctx.fillStyle = brickColor;
          ctx.fillRect(-tile.size / 2, -tile.size / 2, tile.size, tile.size);
          ctx.restore();
        });
        break;

      case 'river':
        ctx.fillStyle = '#00f';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;

      default:
        console.warn(`Unknown feature type: ${hex.feature} at ${hex.q},${hex.r}`);
        break;
    }
  }

}

// Draws names only
export function drawHexName(ctx, x, y, size, hex, zoom) {
  if (hex.feature === 'city' && hex.name) {
    const fontSize = 18 / zoom;
    ctx.font = `${fontSize}px 'Times New Roman'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const textX = x;
    const textY = y - size * 0.4;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 / zoom;
    ctx.lineJoin = 'round';
    ctx.strokeText(hex.name, textX, textY);

    ctx.fillStyle = '#000';
    ctx.fillText(hex.name, textX, textY);
  }
}

// drawFeatures and drawUnits remain unchanged (omitted for brevity)
export function drawFeatures(ctx, features, hexSize, hexWidth, hexHeight, zoom, offset) {
  const hexToPixel = (q, r) => {
    const x = q * hexWidth;
    const y = r * hexHeight;
    const offsetX = r % 2 === 0 ? 0 : hexWidth * 0.5;
    return { x: x + offsetX, y };
  };

  if (features.roads) {
    Object.entries(features.roads).forEach(([key, neighbors]) => {
      const [q1, r1] = key.split(',').map(Number);
      const { x: x1, y: y1 } = hexToPixel(q1, r1);
      neighbors.forEach(neighbor => {
        const [q2, r2] = neighbor.split(',').map(Number);
        if (q1 < q2 || (q1 === q2 && r1 < r2)) {
          const { x: x2, y: y2 } = hexToPixel(q2, r2);
          ctx.beginPath();
          ctx.strokeStyle = '#996633';
          ctx.lineWidth = 2 / zoom;
          ctx.moveTo(x1, y1);
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const waveAmp = hexSize * 0.5 / zoom;
          const cp1X = midX - waveAmp;
          const cp1Y = midY + waveAmp * Math.sin((x1 - x2) * 0.1);
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
    const { x, y } = position;
    ctx.fillStyle = unit.team === 'blue' ? '#0000ff' : '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, hexSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `${10 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unit.name.charAt(0), x, y);
  });
}