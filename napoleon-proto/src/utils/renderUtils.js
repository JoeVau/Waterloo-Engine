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

  // Elevation gradient for all hexes based on height
  const heightColors = {
    0: '#e6f0e6', // Low: Light green, flat plains
    1: '#b3c9b3', // Mid: Mid green-gray, gentle rise
    2: '#809b80'  // High: Darker green-gray, rugged
  };
  const baseColor = hex && hex.height !== undefined ? heightColors[Math.min(Math.max(hex.height, 0), 2)] : '#e6f0e6';

  ctx.fillStyle = baseColor;
  ctx.fill();

  // Initialize seed for randomness once
  let seed = (hex.q + hex.r) * 100; // Simple seed based on hex coords
  const rand = (max) => {
    const x = Math.sin(seed++) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };

  // Terrain-specific features (overlay on elevation background)
  switch (hex.terrain) {
    case 'hills':
      const numHills = 3 + rand(3); // 3-5 hills
      const hills = [];
      for (let i = 0; i < numHills; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 10) {
          const offsetX = (rand(120) - 60) * size / 180; // ±0.6 * size
          const offsetY = (rand(120) - 60) * size / 180; // ±0.6 * size
          const tx = x + offsetX;
          const ty = y + offsetY;
          const hillWidth = size * (0.4 + rand(15) / 100); // ±20%
          const hillHeight = size * (0.3 + rand(10) / 100); // ±10%
          const overlaps = hills.some(h => {
            const dx = h.x - tx;
            const dy = h.y - ty;
            return Math.sqrt(dx * dx + dy * dy) < (hillWidth + h.width) * 0.5;
          });
          const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
          if (!overlaps && distFromCenter < size * 0.75) { // Within hex
            hills.push({ x: tx, y: ty, width: hillWidth, height: hillHeight });
            placed = true;
          }
          attempts++;
        }
      }
      hills.forEach(hill => {
        ctx.beginPath();
        ctx.moveTo(hill.x, hill.y);
        ctx.quadraticCurveTo(hill.x + hill.width * 0.5, hill.y - hill.height, hill.x + hill.width, hill.y);
        ctx.fillStyle = '#5a3f2a'; // Richer brown
        ctx.fill();
        ctx.strokeStyle = '#3c2f2f';
        ctx.lineWidth = 0.1 / zoom;
        ctx.stroke();
      });
      break;

    case 'woods':
      const numTrees = 5 + rand(3); // 5-7 trees
      const trees = [];
      for (let i = 0; i < numTrees; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 10) {
          const offsetX = (rand(100) - 50) * size / 100; // ±0.5 * size
          const offsetY = (rand(100) - 50) * size / 100; // ±0.5 * size
          const tx = x + offsetX;
          const ty = y + offsetY;
          const treeSize = size * (0.15 + rand(10) / 100); // Base ±20%
          const overlaps = trees.some(t => {
            const dx = t.x - tx;
            const dy = t.y - ty;
            return Math.sqrt(dx * dx + dy * dy) < (treeSize + t.size) * 0.7; // Tighter spacing
          });
          const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
          if (!overlaps && distFromCenter < size * 0.75) { // Wider but within hex
            trees.push({ x: tx, y: ty, size: treeSize });
            placed = true;
          }
          attempts++;
        }
      }
      trees.forEach(t => {
        ctx.beginPath();
        ctx.moveTo(t.x, t.y - t.size * 1.5); // Height 1.5x base
        ctx.lineTo(t.x - t.size, t.y + t.size);
        ctx.lineTo(t.x + t.size, t.y + t.size);
        ctx.closePath();
        ctx.fillStyle = rand(100) < 30 ? '#228b22' : '#004d00'; // 30% lighter, 70% darker
        ctx.fill();
        ctx.strokeStyle = '#002200';
        ctx.lineWidth = 0.1 / zoom;
        ctx.stroke();
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

  if (hex.feature === 'city' || hex.feature === 'village') {
    const isVillage = hex.feature === 'village';
    seed = hex.name ? hex.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : seed;
    const randSettlement = (max) => {
      const x = Math.sin(seed++) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };
    const numBuildings = isVillage ? 5 + randSettlement(6) : 40; // 5-10 for village, 40 for city
    const maxDist = isVillage ? 0.5 : 0.8; // Village: tighter, city: wider
    const buildings = [];
    const avenueAngles = isVillage ? [] : [Math.PI / 3, -Math.PI / 3, 2 * Math.PI / 3]; // No avenues for village
    const avenueWidths = isVillage ? [] : [size * 0.16, size * 0.14, size * 0.15];
    for (let i = 0; i < numBuildings; i++) {
      let attempts = 0;
      let placed = false;
      while (!placed && attempts < 22) {
        const tileWidth = size * (0.08 + randSettlement(10) / 50); // Smaller for village
        const tileHeight = size * (0.04 + randSettlement(10) / 50);
        const tileSize = Math.max(tileWidth, tileHeight);
        seed += hex.q * hex.r + i;
        const cluster = randSettlement(3);
        const dist = size * (cluster === 0 ? 0.2 : cluster === 1 ? 0.35 : maxDist) * Math.sqrt(randSettlement(100) / 100);
        const angle = (randSettlement(180) + (cluster * 120)) * Math.PI / 180;
        const offsetX = Math.cos(angle) * dist;
        const offsetY = Math.sin(angle) * dist;
        const tx = x + offsetX;
        const ty = y + offsetY;
        const rotation = randSettlement(100) < 65 ? 0 : (randSettlement(2) - 0.5) * Math.PI / 10;
        const minGap = tileSize * 0.25;
        const overlaps = buildings.some(b => {
          const dx = b.x - tx;
          const dy = b.y - ty;
          return Math.sqrt(dx * dx + dy * dy) < (tileSize + b.size) * 0.5 + minGap;
        });
        const inAvenue = isVillage ? false : avenueAngles.some((angle, idx) => {
          const width = avenueWidths[idx] / 1.5;
          const dx = tx - x;
          const dy = ty - y;
          const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
          const perp = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
          return perp < width && proj > -size * 0.5 && proj < size * 0.5;
        });
        if (!overlaps && !inAvenue) {
          const tier = dist < size * 0.25 ? 0 : dist < size * 0.4 ? 1 : 2;
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
      //ctx.fillStyle = b.tier === 0 ? '#8b4513' : b.tier === 1 ? '#a0522d' : '#cd853f';
      ctx.fillStyle = b.tier === 0 ? '#000000' : b.tier === 1 ? '#262626' : '#262626';
      ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
      //ctx.strokeStyle = '#1c2526';
      //ctx.lineWidth = 0.15;
      //ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
      ctx.restore();
    });

    // City walls only for cities
    if (hex.feature === 'city') {
      ctx.save();
      seed += hex.q + hex.r;
      const numSides = 5 + randSettlement(4); // 5-8 sides
      const wallRadius = size * 0.7; // Slightly beyond inner tier
      const wallPoints = [];
      for (let i = 0; i < numSides; i++) {
        const angle = (2 * Math.PI * i) / numSides + (randSettlement(20) - 10) * Math.PI / 180;
        const radiusVariation = wallRadius * (0.9 + randSettlement(20) / 100);
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
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
      ctx.restore();
    }

    // Golden cross for both
    ctx.save();
    seed += hex.q + hex.r;
    const crossDist = size * (0.1 + randSettlement(50) / 100);
    const crossAngle = randSettlement(360) * Math.PI / 180;
    const crossX = x + Math.cos(crossAngle) * crossDist;
    const crossY = y + Math.sin(crossAngle) * crossDist;
    ctx.translate(crossX, crossY);
    ctx.fillStyle = '#262626';
    ctx.font = isVillage ? '3px serif' : '4px serif'; // Smaller for village
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

// Draws names for cities and villages
export function drawHexName(ctx, x, y, size, hex, zoom) {
  if ((hex.feature === 'city' || hex.feature === 'village') && hex.name) {
    const fontSize = hex.feature === 'village' ? 14 / zoom : 18 / zoom; // Smaller for village
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

// Unchanged functions
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
    const counterWidth = hexSize * 1.2;
    const counterHeight = hexSize * 0.8;

    ctx.fillStyle = unit.team === 'blue' ? '#6666ff' : '#ff6666';
    ctx.fillRect(x - counterWidth / 2, y - counterHeight / 2, counterWidth, counterHeight);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(x - counterWidth / 2, y - counterHeight / 2, counterWidth, counterHeight);

    if (!unit.hq) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.moveTo(x - counterWidth / 2, y - counterHeight / 2);
      ctx.lineTo(x + counterWidth / 2, y + counterHeight / 2);
      ctx.moveTo(x + counterWidth / 2, y - counterHeight / 2);
      ctx.lineTo(x - counterWidth / 2, y + counterHeight / 2);
      ctx.stroke();
    }

    const rankText = unit.hq ? 'XXXX' : 'XX';
    ctx.font = `${8 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const rankTextWidth = ctx.measureText(rankText).width;
    const rankTextHeight = 8 / zoom;
    const rankX = x;
    const rankY = y - counterHeight / 2 - 2 / zoom;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      rankX - rankTextWidth / 2 - 2 / zoom,
      rankY - rankTextHeight - 2 / zoom,
      rankTextWidth + 4 / zoom,
      rankTextHeight + 4 / zoom
    );
    ctx.fillStyle = '#fff';
    ctx.fillText(rankText, rankX, rankY);

    const nameText = unit.name;
    ctx.textBaseline = 'top';
    const nameTextWidth = ctx.measureText(nameText).width;
    const nameTextHeight = 8 / zoom;
    const nameX = x;
    const nameY = y + counterHeight / 2 + 2 / zoom;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(
      nameX - nameTextWidth / 2 - 2 / zoom,
      nameY - 2 / zoom,
      nameTextWidth + 4 / zoom,
      nameTextHeight + 4 / zoom
    );
    ctx.fillStyle = '#fff';
    ctx.fillText(nameText, nameX, nameY);

    if (selectedUnitId === unit.id) {
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(x - counterWidth / 2, y - counterHeight / 2, counterWidth, counterHeight);
    }
  });
}

export function drawRoads(ctx, hexes, hexSize, hexWidth, hexHeight, zoom, offset) {
  ctx.beginPath();
  ctx.strokeStyle = '#996633';
  ctx.lineWidth = 2 / zoom;

  hexes.forEach(hex => {
    if (!hex.road) return;
    const x = hex.q * hexWidth + (hex.r % 2 === 0 ? 0 : hexWidth * 0.5);
    const y = hex.r * hexHeight;

    hexes.forEach(neighbor => {
      if (!neighbor.road || (hex.q === neighbor.q && hex.r === neighbor.r)) return;
      if (hexDistance(hex.q, hex.r, neighbor.q, neighbor.r) === 1) {
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