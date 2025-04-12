import { useEffect, useState, useMemo } from 'react';
import { drawHexBase, drawHexName, drawFeatures, drawUnits, drawRoads } from '../utils/renderUtils';
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

export default function Map({ canvasRef, hexes, units, orders, features = { roads: {} }, zoom, offset, selectedUnitId, onClick, onMouseDown, fogOfWar, currentPlayer }) {
  const [shouldRedraw, setShouldRedraw] = useState(true);

  const roadHexes = useMemo(() => hexes.filter(h => h.road), [hexes]);

  const visibilityMap = useMemo(() => {
    const map = new Set();
    if (!fogOfWar) {
      hexes.forEach(hex => map.add(`${hex.q},${hex.r}`));
    } else {
      const friendlyUnits = units.filter(u => u.team === currentPlayer && !u.divisionId);
      friendlyUnits.forEach(unit => {
        const unitHex = hexes.find(h => h.units.includes(unit.id));
        if (!unitHex) return;
        const losRange = unit.losBoost || 2;
        hexes.forEach(hex => {
          if (hexDistance(unitHex.q, unitHex.r, hex.q, hex.r) <= losRange) {
            map.add(`${hex.q},${hex.r}`);
          }
        });
      });
    }
    return map;
  }, [hexes, units, fogOfWar, currentPlayer]);

  useEffect(() => {
    setShouldRedraw(true);
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

    // Pass 1: Draw terrain
    hexes.forEach(hex => {
      const x = hex.q * hexWidth;
      const y = hex.r * hexHeight;
      const offsetX = hex.r % 2 === 0 ? 0 : hexWidth * 0.5;
      const finalX = x + offsetX;
      const finalY = y;

      // Expanded culling to include hexes near borders
      if (
        finalX > -offset.x / zoom - hexWidth * 2 &&
        finalX < -offset.x / zoom + visibleWidth + hexWidth * 2 &&
        finalY > -offset.y / zoom - hexHeight * 2 &&
        finalY < -offset.y / zoom + visibleHeight + hexHeight * 2
      ) {
        const isVisible = visibilityMap.has(`${hex.q},${hex.r}`);

        drawHexBase(ctx, finalX, finalY, hexSize, terrainColors[hex.terrain] || '#ffffff', false, hex, zoom, false);

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

    // Pass 2: Draw roads
    drawRoads(ctx, roadHexes, hexSize, hexWidth, hexHeight, zoom, offset);

    // Pass 3: Highlight attackable hexes
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

    // Pass 4: Draw features (roads, etc.) only for visible hexes
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

    // Pass 5: Draw units only for visible hexes (exclude detachments)
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
          const hexUnits = units.filter(unit => hex.units.includes(unit.id) && !unit.divisionId);
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

    // Pass 6: Draw hex names only for visible hexes
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
    setShouldRedraw(false);
  }, [shouldRedraw, hexes, units, orders, features, zoom, offset, selectedUnitId, fogOfWar, currentPlayer, visibilityMap, roadHexes]);

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