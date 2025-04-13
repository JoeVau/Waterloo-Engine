import { hexDistance } from '../utils/hexGrid';

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

  // Adjust base color based on height (0-2)
  let baseColor = color;
  if (hex && hex.terrain && hex.height !== undefined) {
    const height = Math.min(Math.max(hex.height, 0), 2); // Clamp height to 0-2
    const darkenFactor = 1 - 0.15 * height; // 0: 100%, 1: 85%, 2: 70% brightness
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const newR = Math.round(r * darkenFactor);
      const newG = Math.round(g * darkenFactor);
      const newB = Math.round(b * darkenFactor);
      baseColor = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
  }

  ctx.fillStyle = baseColor;
  ctx.fill();

  // Terrain-specific features (unchanged, apply over darkened base)
  switch (hex.terrain) {
    case 'hills':
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

  if (hex.feature === 'city') {
    let seed = hex.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (max) => {
      const x = Math.sin(seed++) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };
    const buildings = [];
    const avenueAngles = [Math.PI / 3, -Math.PI / 3, 2 * Math.PI / 3];
    const avenueWidths = [size * 0.16, size * 0.14, size * 0.15];
    for (let i = 0; i < 30; i++) {
      let attempts = 0;
      let placed = false;
      while (!placed && attempts < 22) {
        const tileWidth = size * (0.10 + rand(14) / 100);
        const tileHeight = size * (0.05 + rand(14) / 100);
        const tileSize = Math.max(tileWidth, tileHeight);
        seed += hex.q * hex.r + i;
        const cluster = rand(3);
        const dist = size * (cluster === 0 ? 0.3 : cluster === 1 ? 0.55 : 0.8) * Math.sqrt(rand(100) / 100);
        const angle = (rand(180) + (cluster * 120)) * Math.PI / 180;
        const offsetX = Math.cos(angle) * dist;
        const offsetY = Math.sin(angle) * dist;
        const tx = x + offsetX;
        const ty = y + offsetY;
        const rotation = rand(100) < 65 ? 0 : (rand(2) - 0.5) * Math.PI / 10;
        const minGap = tileSize * 0.25;
        const overlaps = buildings.some(b => {
          const dx = b.x - tx;
          const dy = b.y - ty;
          return Math.sqrt(dx * dx + dy * dy) < (tileSize + b.size) * 0.5 + minGap;
        });
        const inAvenue = avenueAngles.some((angle, idx) => {
          const width = avenueWidths[idx] / 1.5;
          const dx = tx - x;
          const dy = ty - y;
          const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
          const perp = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
          return perp < width && proj > -size * 0.5 && proj < size * 0.5;
        });
        if (!overlaps && !inAvenue) {
          const tier = dist < size * 0.35 ? 0 : dist < size * 0.65 ? 1 : 2;
          buildings.push({ x: tx, y: ty, rotation, width: tileWidth, height: tileHeight, size: tileSize, tier });
          placed = true;
        }
        attempts++;
      }
    }
    buildings.forEach(b => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      ctx.fillStyle = b.tier === 0 ? '#8b4513' : b.tier === 1 ? '#a0522d' : '#cd853f';
      ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.strokeStyle = '#1c2526';
      ctx.lineWidth = 0.15;
      ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.restore();
    });

    // Add old city walls: semi-random polygon around inner tier (dist < size * 0.35)
    ctx.save();
    seed += hex.q + hex.r;
    const numSides = 5 + rand(4); // 5-8 sides
    const wallRadius = size * 0.4; // Slightly beyond inner tier (dist < 0.35)
    const wallPoints = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (2 * Math.PI * i) / numSides + (rand(20) - 10) * Math.PI / 180; // Random angle offset ±10°
      const radiusVariation = wallRadius * (0.9 + rand(20) / 100); // ±10% radius variation
      const px = x + radiusVariation * Math.cos(angle);
      const py = y + radiusVariation * Math.sin(angle);
      wallPoints.push({ x: px, y: py });
    }
    ctx.beginPath();
    wallPoints.forEach((p, i) => {
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.2 / zoom; // Thin line, scales with zoom
    ctx.stroke();
    ctx.restore();

    // Golden cross
    ctx.save();
    seed += hex.q + hex.r;
    const crossDist = size * (0.1 + rand(50) / 100);
    const crossAngle = rand(360) * Math.PI / 180;
    const crossX = x + Math.cos(crossAngle) * crossDist;
    const crossY = y + Math.sin(crossAngle) * crossDist;
    ctx.translate(crossX, crossY);
    ctx.fillStyle = '#ffd700';
    ctx.font = '4px serif';
    ctx.fillText('✝', 0, 0);
    ctx.restore();
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
    const counterWidth = hexSize * 1.2; // Wider rectangle
    const counterHeight = hexSize * 0.8; // Keep height proportional

    // NATO Infantry Symbol: Wider rectangle with lighter team color background
    ctx.fillStyle = unit.team === 'blue' ? '#6666ff' : '#ff6666';
    ctx.fillRect(x - counterWidth / 2, y - counterHeight / 2, counterWidth, counterHeight);

    // Thin black border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(x - counterWidth / 2, y - counterHeight / 2, counterWidth, counterHeight);

    // Draw the "X" with thin black lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(x - counterWidth / 2, y - counterHeight / 2);
    ctx.lineTo(x + counterWidth / 2, y + counterHeight / 2);
    ctx.moveTo(x + counterWidth / 2, y - counterHeight / 2);
    ctx.lineTo(x - counterWidth / 2, y + counterHeight / 2);
    ctx.stroke();

    // Text shadow background for rank symbol (XX)
    const rankText = 'XX'; // Division
    ctx.font = `${8 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const rankTextWidth = ctx.measureText(rankText).width;
    const rankTextHeight = 8 / zoom; // Approximate height of text
    const rankX = x;
    const rankY = y - counterHeight / 2 - 2 / zoom;
    // Shadow background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      rankX - rankTextWidth / 2 - 2 / zoom,
      rankY - rankTextHeight - 2 / zoom,
      rankTextWidth + 4 / zoom,
      rankTextHeight + 4 / zoom
    );
    // Rank symbol
    ctx.fillStyle = '#fff'; // White text for contrast
    ctx.fillText(rankText, rankX, rankY);

    // Text shadow background for unit name
    const nameText = unit.name;
    ctx.textBaseline = 'top';
    const nameTextWidth = ctx.measureText(nameText).width;
    const nameTextHeight = 8 / zoom;
    const nameX = x;
    const nameY = y + counterHeight / 2 + 2 / zoom;
    // Shadow background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      nameX - nameTextWidth / 2 - 2 / zoom,
      nameY - 2 / zoom,
      nameTextWidth + 4 / zoom,
      nameTextHeight + 4 / zoom
    );
    // Unit name
    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, nameX, nameY);

    // Highlight if selected
    if (selectedUnitId === unit.id) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(x - counterWidth / 2, y - counterHeight / 2, counterWidth, counterHeight);
    }
  });
}

export function drawRoads(ctx, hexes, hexSize, hexWidth, hexHeight, zoom, offset) {
  ctx.beginPath();
  ctx.strokeStyle = '#996633'; // Brown
  ctx.lineWidth = 2 / zoom; // Thin, scales with zoom

  hexes.forEach(hex => {
    if (!hex.road) return;
    const x = hex.q * hexWidth + (hex.r % 2 === 0 ? 0 : hexWidth * 0.5);
    const y = hex.r * hexHeight;

    // Check all hexes for adjacency (distance = 1)
    hexes.forEach(neighbor => {
      if (!neighbor.road || (hex.q === neighbor.q && hex.r === neighbor.r)) return;
      if (hexDistance(hex.q, hex.r, neighbor.q, neighbor.r) === 1) {
        // Dedupe lines: draw only if q < nq || (q === nq && r < nr)
        if (hex.q < neighbor.q || (hex.q === neighbor.q && hex.r < neighbor.r)) {
          const nx = neighbor.q * hexWidth + (neighbor.r % 2 === 0 ? 0 : hexWidth * 0.5);
          const ny = neighbor.r * hexHeight;
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
        }
      }
    });
  });

  ctx.stroke();
}