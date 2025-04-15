import { hexDistance } from '../utils/hexGrid';
import { drawBaseHex } from './renderBaseHex';
import { drawHills } from './renderHills';
import { drawWoods } from './renderWoods';
import { drawCrops } from './renderCrops';
import { drawSwamps } from './renderSwamps';
import { drawCity } from './renderCity';
import { drawVillage } from './renderVillage';

// Draws terrain and features
export function drawHexBase(ctx, x, y, size, color, isHighlighted, hex, zoom, isUnitHighlighted) {
  drawBaseHex(ctx, x, y, size, hex, zoom, isHighlighted);

  let seed = (hex.q + hex.r) * 100; // Seed for terrain
  if (hex.terrain) {
    switch (hex.terrain) {
      case 'hills':
        seed = drawHills(ctx, x, y, size, hex, zoom, seed);
        break;
      case 'woods':
        seed = drawWoods(ctx, x, y, size, hex, zoom, seed);
        break;
      case 'crops':
        seed = drawCrops(ctx, x, y, size, hex, zoom, seed);
        break;
      case 'swamps':
        seed = drawSwamps(ctx, x, y, size, hex, zoom, seed);
        break;
    }
  }

  if (hex.feature === 'city') {
    seed = drawCity(ctx, x, y, size, hex, zoom, seed);
  } else if (hex.feature === 'village') {
    seed = drawVillage(ctx, x, y, size, hex, zoom, seed);
  }

  // Draw rivers
  if (hex.rivers && hex.rivers.some(r => r)) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      if (hex.rivers[i]) {
        const angle1 = (Math.PI / 3) * i + Math.PI / 6;
        const angle2 = (Math.PI / 3) * ((i + 1) % 6) + Math.PI / 6;
        const p1x = x + size * Math.cos(angle1);
        const p1y = y + size * Math.sin(angle1);
        const p2x = x + size * Math.cos(angle2);
        const p2y = y + size * Math.sin(angle2);
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
      }
    }
    ctx.strokeStyle = '#4682b4';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.restore();
  }
}

// Draws names for cities and villages
export function drawHexName(ctx, x, y, size, hex, zoom) {
  if ((hex.feature === 'city' || hex.feature === 'village') && hex.name) {
    const fontSize = hex.feature === 'village' ? 14 / zoom : 18 / zoom;
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