import { useEffect } from 'react';
import { drawHexBase, drawHexName, drawUnits, drawFeatures } from '../utils/renderUtils';
import { hexDistance } from '../utils/hexGrid';

const hexSize = 8;
const hexWidth = hexSize * 2; // 16
const hexHeight = hexSize * Math.sqrt(3); // ~13.856

const terrainColors = {
  plains: '#d9e8d9',
  woods: '#008000',
  hills: '#d2b48c',
  crops: '#e6b800',
  swamps: '#b3cce6',
};

export default function Map({ canvasRef, hexes, units, orders, features, zoom, offset, selectedUnitId, onClick, onWheel, onMouseDown }) {
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

    // Pass 1: Draw terrain, features, roads, and units (keep visibility check here)
    hexes.forEach(hex => {
      const x = hex.q * hexWidth;
      const y = hex.r * hexHeight;
      const offsetX = hex.r % 2 === 0 ? 0 : hexWidth * 0.5;
      const finalX = x + offsetX;
      const finalY = y;

      if (
        finalX > -offset.x / zoom - hexWidth &&
        finalX < -offset.x / zoom + visibleWidth + hexWidth &&
        finalY > -offset.y / zoom - hexHeight &&
        finalY < -offset.y / zoom + visibleHeight + hexHeight
      ) {
        drawHexBase(ctx, finalX, finalY, hexSize, terrainColors[hex.terrain] || '#ffffff', false, hex, zoom, false);

        if (hex.units.length) {
          const hexUnits = units.filter(unit => hex.units.includes(unit.id));
          drawUnits(ctx, hexUnits, hexSize, hexWidth, hexHeight, zoom, { x: finalX, y: finalY }, null);

          const topUnit = hexUnits[0];
          const order = orders.blue[topUnit.id] || orders.red[topUnit.id];
          if (order && order.type === 'move') {
            const destHex = hexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
            const destX = destHex.q * hexWidth + (destHex.r % 2 === 0 ? 0 : hexWidth * 0.5);
            const destY = destHex.r * hexHeight;
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2 / zoom;
            ctx.setLineDash([5 / zoom, 5 / zoom]);
            ctx.beginPath();
            ctx.moveTo(finalX, finalY);
            ctx.lineTo(destX, destY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
    });

    // Highlighting (moved outside visibility check)
    if (selectedUnitId) {
      const unitHex = hexes.find(hex => hex.units.includes(selectedUnitId));
      if (unitHex) {
        hexes.forEach(h => {
          const distance = hexDistance(unitHex.q, unitHex.r, h.q, h.r);
          if (distance <= 2) {
            const hx = h.q * hexWidth + (h.r % 2 === 0 ? 0 : hexWidth * 0.5);
            const hy = h.r * hexHeight;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i + Math.PI / 6;
              const px = hx + hexSize * Math.cos(angle);
              const py = hy + hexSize * Math.sin(angle);
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          }
        });
      }
    }

    if (features) {
      drawFeatures(ctx, { roads: features.roads }, hexSize, hexWidth, hexHeight, zoom, offset);
    }

    // Pass 2: Draw names (keep visibility check)
    hexes.forEach(hex => {
      const x = hex.q * hexWidth;
      const y = hex.r * hexHeight;
      const offsetX = hex.r % 2 === 0 ? 0 : hexWidth * 0.5;
      const finalX = x + offsetX;
      const finalY = y;

      if (
        finalX > -offset.x / zoom - hexWidth &&
        finalX < -offset.x / zoom + visibleWidth + hexWidth &&
        finalY > -offset.y / zoom - hexHeight &&
        finalY < -offset.y / zoom + visibleHeight + hexHeight
      ) {
        drawHexName(ctx, finalX, finalY, hexSize, hex, zoom);
      }
    });

    ctx.restore();
  }, [hexes, units, orders, features, zoom, offset, selectedUnitId]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={800}
      onClick={onClick}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      style={{ display: 'block', cursor: 'grab' }}
    />
  );
}

Map.hexWidth = hexWidth;
Map.hexHeight = hexHeight;