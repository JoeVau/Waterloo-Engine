import { useEffect, useState, useMemo } from 'react';
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

export default function Map({ canvasRef, hexes, units, orders, features, zoom, offset, selectedUnitId, onClick, onMouseDown, fogOfWar, currentPlayer }) {
  const [shouldRedraw, setShouldRedraw] = useState(true);

  // Precompute visibility map for fog of war
  const visibilityMap = useMemo(() => {
    const map = new Set();
    if (!fogOfWar) {
      hexes.forEach(hex => map.add(`${hex.q},${hex.r}`));
    } else {
      const friendlyUnits = units.filter(u => u.team === currentPlayer);
      friendlyUnits.forEach(unit => {
        const unitHex = hexes.find(h => h.units.includes(unit.id));
        if (!unitHex) return;
        hexes.forEach(hex => {
          if (hexDistance(unitHex.q, unitHex.r, hex.q, hex.r) <= 2) {
            map.add(`${hex.q},${hex.r}`);
          }
        });
      });
    }
    return map;
  }, [hexes, units, fogOfWar, currentPlayer]);

  useEffect(() => {
    setShouldRedraw(true); // Trigger redraw when dependencies change
  }, [hexes, units, orders, features, zoom, offset, selectedUnitId, fogOfWar, currentPlayer]);

  useEffect(() => {
    if (!shouldRedraw) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const visibleWidth = canvas.width / zoom;
    const visibleHeight = canvas.height / zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Pass 1: Draw terrain (all hexes, with fog overlay for hidden ones)
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
        const isVisible = visibilityMap.has(`${hex.q},${hex.r}`);

        // Draw the hex with terrain color
        drawHexBase(ctx, finalX, finalY, hexSize, terrainColors[hex.terrain] || '#ffffff', false, hex, zoom, false);

        // Apply fog overlay if not visible
        if (fogOfWar && !isVisible) {
          ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i + Math.PI / 6;
            const px = finalX + hexSize * Math.cos(angle);
            const py = finalY + hexSize * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    });

    // Pass 2: Highlight hexes with enemy units within attack range (distance 1) of the selected unit
    if (selectedUnitId) {
      const unitHex = hexes.find(hex => hex.units.includes(selectedUnitId));
      if (unitHex) {
        const unit = units.find(u => u.id === selectedUnitId);
        const visibleHexes = hexes.filter(h => {
          const hx = h.q * hexWidth + (h.r % 2 === 0 ? 0 : hexWidth * 0.5);
          const hy = h.r * hexHeight;
          return (
            hx > -offset.x / zoom - hexWidth &&
            hx < -offset.x / zoom + visibleWidth + hexWidth &&
            hy > -offset.y / zoom - hexHeight &&
            hy < -offset.y / zoom + visibleHeight + hexHeight
          );
        });

        visibleHexes.forEach(h => {
          const distance = hexDistance(unitHex.q, unitHex.r, h.q, h.r);
          const hasEnemy = h.units.some(unitId => {
            const targetUnit = units.find(u => u.id === unitId);
            return targetUnit && targetUnit.team !== unit.team;
          });
          if (distance === 1 && hasEnemy) {
            const hx = h.q * hexWidth + (h.r % 2 === 0 ? 0 : hexWidth * 0.5);
            const hy = h.r * hexHeight;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
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

    // Pass 3: Draw features (roads, etc.) only for visible hexes
    if (features) {
      const filteredFeatures = { roads: {} };
      Object.entries(features.roads || {}).forEach(([key, neighbors]) => {
        const [q, r] = key.split(',').map(Number);
        const isVisible = visibilityMap.has(`${q},${r}`);
        if (isVisible) {
          filteredFeatures.roads[key] = neighbors;
        }
      });
      drawFeatures(ctx, filteredFeatures, hexSize, hexWidth, hexHeight, zoom, offset);
    }

    // Pass 4: Draw units only for visible hexes
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
        const isVisible = visibilityMap.has(`${hex.q},${hex.r}`);

        if (isVisible && hex.units.length) {
          const hexUnits = units.filter(unit => hex.units.includes(unit.id));
          drawUnits(ctx, hexUnits, hexSize, hexWidth, hexHeight, zoom, { x: finalX, y: finalY }, selectedUnitId);

          const topUnit = hexUnits[0];
          const order = topUnit ? (orders.blue[topUnit.id] || orders.red[topUnit.id]) : null;
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

    // Pass 5: Draw hex names only for visible hexes
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
        const isVisible = visibilityMap.has(`${hex.q},${hex.r}`);

        if (isVisible) {
          drawHexName(ctx, finalX, finalY, hexSize, hex, zoom);
        }
      }
    });

    ctx.restore();
    setShouldRedraw(false); // Reset redraw flag
  }, [shouldRedraw, hexes, units, orders, features, zoom, offset, selectedUnitId, fogOfWar, currentPlayer, visibilityMap]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={800}
      onClick={onClick}
      onMouseDown={onMouseDown}
      style={{ display: 'block', cursor: 'grab' }}
    />
  );
}

Map.hexWidth = hexWidth;
Map.hexHeight = hexHeight;