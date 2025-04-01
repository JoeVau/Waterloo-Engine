import { useEffect } from 'react';
import { getHexAtPosition } from '../utils/hexGrid';
import { drawHex, drawUnits } from '../utils/renderUtils';
import { hexDistance } from '../utils/hexGrid';

const hexSize = 8;
const hexWidth = hexSize * 2;
const hexHeight = hexSize * Math.sqrt(3);

const terrainColors = {
  plains: '#ffffff',
  woods: '#008000',
  hills: '#8b4513',
};

export default function Map({ canvasRef, hexes, units, orders, zoom, offset, selectedUnitId, onClick, onWheel, onMouseDown }) {
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

    hexes.forEach(hex => {
      const x = hex.q * hexWidth * 0.75;
      const y = hex.r * hexHeight;
      const offsetX = hex.r % 2 === 0 ? 0 : hexWidth * 0.375;
      const finalX = x + offsetX;
      const finalY = y;

      if (
        finalX > -offset.x / zoom - hexWidth &&
        finalX < -offset.x / zoom + visibleWidth + hexWidth &&
        finalY > -offset.y / zoom - hexHeight &&
        finalY < -offset.y / zoom + visibleHeight + hexHeight
      ) {
        drawHex(ctx, finalX, finalY, hexSize, terrainColors[hex.terrain], false, hex, zoom, false);

        if (selectedUnitId && hex.units.includes(selectedUnitId)) {
          const unitHex = hex;
          hexes.forEach(h => {
            if (hexDistance(unitHex.q, unitHex.r, h.q, h.r) <= 2) {
              const hx = h.q * hexWidth * 0.75 + (h.r % 2 === 0 ? 0 : hexWidth * 0.375);
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

        if (hex.units.length) {
          const hexUnits = units.filter(unit => hex.units.includes(unit.id));
          drawUnits(ctx, hexUnits, hexSize, hexWidth, hexHeight, zoom, { x: finalX, y: finalY }, null);

          const topUnit = hexUnits[0];
          const order = orders.blue[topUnit.id] || orders.red[topUnit.id];
          if (order && order.type === 'move') {
            const destHex = hexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
            const destX = destHex.q * hexWidth * 0.75 + (destHex.r % 2 === 0 ? 0 : hexWidth * 0.375);
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

    ctx.restore();
  }, [hexes, units, orders, zoom, offset, selectedUnitId]);

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
Map.getHexAtPosition = getHexAtPosition;