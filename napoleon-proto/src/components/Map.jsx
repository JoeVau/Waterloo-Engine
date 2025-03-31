import { useEffect } from 'react';
import { getHexAtPosition } from '../utils/hexGrid';
import { drawHex, drawFeatures, drawUnits } from '../utils/renderUtils';

const hexSize = 8;
const hexWidth = hexSize * 2;
const hexHeight = hexSize * Math.sqrt(3);

const terrainColors = {
  plains: '#ffffff',
  woods: '#008000',
  hills: '#8b4513',
};

export default function Map({ canvasRef, hexes, units, orders, zoom, offset }) {
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

    // Draw hexes
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
        // Fog: Full terrain if visible to either player, gray if hidden
        const isVisible = hex.visible.blue === 'full' || hex.visible.red === 'full';
        drawHex(
          ctx,
          finalX,
          finalY,
          hexSize,
          isVisible ? terrainColors[hex.terrain] : '#555',
          false, // No highlight for simplicity
          hex,
          zoom,
          false // No unit highlight for now
        );

        // Draw units using hex.units
        if (hex.units.length) {
          const hexUnits = units.filter(unit => hex.units.includes(unit.id));
          drawUnits(ctx, hexUnits, hexSize, hexWidth, hexHeight, zoom, { x: finalX, y: finalY }, null);

          // Draw move order if exists (for the first unit in stack)
          const topUnit = hexUnits[0];
          const order = orders.blue[topUnit.id] || orders.red[topUnit.id];
          if (order && order.type === 'move') {
            const destHex = hexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
            const destX = destHex.q * hexWidth * 0.75 + (destHex.r % 2 === 0 ? 0 : hexWidth * 0.375);
            const destY = destHex.r * hexHeight;
            ctx.strokeStyle = '#ff0'; // Yellow for orders
            ctx.lineWidth = 2 / zoom;
            ctx.setLineDash([5 / zoom, 5 / zoom]); // Dashed line
            ctx.beginPath();
            ctx.moveTo(finalX, finalY);
            ctx.lineTo(destX, destY);
            ctx.stroke();
            ctx.setLineDash([]); // Reset to solid
          }
        }
      }
    });

    // Draw rivers and roads (optional, uncomment if features added to props)
    // drawFeatures(ctx, features, hexSize, hexWidth, hexHeight, zoom, offset);

    ctx.restore();
  }, [hexes, units, orders, zoom, offset]);

  return null;
}

Map.hexWidth = hexWidth;
Map.hexHeight = hexHeight;
Map.getHexAtPosition = getHexAtPosition;