// src/components/Map.jsx
import { useEffect } from 'react';
import { drawHexBase, drawHexName, drawFeatures, drawUnits } from '../utils/renderUtils';
import { hexDistance } from '../utils/hexGrid';

const hexSize = 8;
const hexWidth = hexSize * 2;
const hexHeight = hexSize * Math.sqrt(3);

const terrainColors = {
  plains: '#d9e8d9',
  woods: '#008000',
  hills: '#d2b48c',
  crops: '#e6b800',
  swamps: '#b3cce6',
};

function pixelToHex(x, y, size) {
  const q = (x * Math.sqrt(3)) / 3 / size;
  const r = (y - x / Math.sqrt(3)) / size;
  return [Math.round(q), Math.round(r)];
}

export default function Map({ canvasRef, hexes, units, orders, features, zoom, offset, selectedUnitId, onClick, onMouseDown }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const visibleWidth = canvas.width / zoom;
    const visibleHeight = canvas.height / zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw terrain
    hexes.forEach(hex => {
      const x = hex.q * hexWidth + (hex.r % 2 === 0 ? 0 : hexWidth * 0.5);
      const y = hex.r * hexHeight;
      if (
        x > -offset.x / zoom - hexWidth &&
        x < -offset.x / zoom + visibleWidth + hexWidth &&
        y > -offset.y / zoom - hexHeight &&
        y < -offset.y / zoom + visibleHeight + hexHeight
      ) {
        drawHexBase(ctx, x, y, hexSize, terrainColors[hex.terrain] || '#ffffff', false, hex, zoom, false);
      }
    });

    // Highlight attacked hexes
    ['blue', 'red'].forEach(team => {
      Object.entries(orders[team] || {}).forEach(([unitId, order]) => {
        if (order && order.type === 'attack') { // Add null check
          const targetUnit = units.find(u => u.id === order.targetId);
          if (targetUnit) {
            const targetHex = hexes.find(h => h.units.includes(targetUnit.id));
            const x = targetHex.q * hexWidth + (targetHex.r % 2 === 0 ? 0 : hexWidth * 0.5);
            const y = targetHex.r * hexHeight;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2 / zoom;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i + Math.PI / 6;
              const px = x + hexSize * Math.cos(angle);
              const py = y + hexSize * Math.sin(angle);
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }
      });
    });

    // Draw units
    hexes.forEach(hex => {
      const x = hex.q * hexWidth + (hex.r % 2 === 0 ? 0 : hexWidth * 0.5);
      const y = hex.r * hexHeight;
      if (
        x > -offset.x / zoom - hexWidth &&
        x < -offset.x / zoom + visibleWidth + hexWidth &&
        y > -offset.y / zoom - hexHeight &&
        y < -offset.y / zoom + visibleHeight + hexHeight
      ) {
        if (hex.units.length) {
          const hexUnits = units.filter(unit => hex.units.includes(unit.id));
          drawUnits(ctx, hexUnits, hexSize, hexWidth, hexHeight, zoom, { x, y }, selectedUnitId);
        }
      }
    });

    ctx.restore();
  }, [hexes, units, orders, features, zoom, offset, selectedUnitId]);

  const handleClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - offset.x) / zoom;
    const clickY = (e.clientY - rect.top - offset.y) / zoom;
    const [q, r] = pixelToHex(clickX, clickY, hexSize);
    onClick(e);
  };

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={800}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      style={{ display: 'block', cursor: 'grab' }}
    />
  );
}

Map.hexWidth = hexWidth;
Map.hexHeight = hexHeight;