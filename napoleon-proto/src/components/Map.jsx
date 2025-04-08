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

export default function Map({ canvasRef, hexes, units, orders, features, zoom, offset, selectedUnitId, onClick, onMouseDown, fogOfWar, currentPlayer, losBoost }) {
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

    // Calculate visibility—3 hexes for scouts, 2 for divisions
    const visibleHexes = fogOfWar
      ? hexes.filter(hex => {
        const friendlyHexes = hexes.filter(h => h.units.some(id => {
          const unit = units.find(u => u.id === id);
          return unit ?.team === currentPlayer;
        }));
        return friendlyHexes.some(fh => {
          const unit = units.find(u => u.position[0] === fh.q && u.position[1] === fh.r && u.team === currentPlayer);
          const range = unit && unit.order === 'scout' ? 3 : 2; // 3 for scouts, 2 for divisions
          return hexDistance(fh.q, fh.r, hex.q, hex.r) <= range;
        });
      })
      : hexes;

    const visibleUnits = fogOfWar
      ? units.filter(unit => {
        const unitHex = hexes.find(h => h.units.includes(unit.id));
        const friendlyHexes = hexes.filter(h => h.units.some(id => units.find(u => u.id === id) ?.team === currentPlayer));
        const range = unit.order === 'scout' ? 3 : 2; // Scouts extend LOS
        return unit.team === currentPlayer || friendlyHexes.some(fh => hexDistance(fh.q, fh.r, unitHex.q, unitHex.r) <= range);
      })
      : units;

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

    // Apply fog overlay
    if (fogOfWar) {
      hexes.forEach(hex => {
        const x = hex.q * hexWidth + (hex.r % 2 === 0 ? 0 : hexWidth * 0.5);
        const y = hex.r * hexHeight;
        if (
          x > -offset.x / zoom - hexWidth &&
          x < -offset.x / zoom + visibleWidth + hexWidth &&
          y > -offset.y / zoom - hexHeight &&
          y < -offset.y / zoom + visibleHeight + hexHeight
        ) {
          const isVisible = visibleHexes.includes(hex);
          if (!isVisible) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i + Math.PI / 6;
              const px = x + hexSize * Math.cos(angle);
              const py = y + hexSize * Math.sin(angle);
              i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          }
        }
      });
    }

    // Highlight range for selected unit
    if (selectedUnitId) {
      const unitHex = hexes.find(h => h.units.includes(selectedUnitId));
      if (unitHex) {
        const visibleHexesRange = hexes.filter(h => {
          const hx = h.q * hexWidth + (h.r % 2 === 0 ? 0 : hexWidth * 0.5);
          const hy = h.r * hexHeight;
          return (
            hx > -offset.x / zoom - hexWidth &&
            hx < -offset.x / zoom + visibleWidth + hexWidth &&
            hy > -offset.y / zoom - hexHeight &&
            hy < -offset.y / zoom + visibleHeight + hexHeight
          );
        });

        visibleHexesRange.forEach(h => {
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

    // Highlight attacked hexes
    ['blue', 'red'].forEach(team => {
      Object.entries(orders[team] || {}).forEach(([unitId, order]) => {
        if (order && order.type === 'attack') {
          const targetUnit = visibleUnits.find(u => u.id === order.targetId);
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
          const hexUnits = visibleUnits.filter(unit => hex.units.includes(unit.id));
          if (hexUnits.length) {
            drawUnits(ctx, hexUnits, hexSize, hexWidth, hexHeight, zoom, { x, y }, selectedUnitId);
          }
        }
      }
    });

    // Draw city names
    hexes.forEach(hex => {
      const x = hex.q * hexWidth + (hex.r % 2 === 0 ? 0 : hexWidth * 0.5);
      const y = hex.r * hexHeight;
      if (
        x > -offset.x / zoom - hexWidth &&
        x < -offset.x / zoom + visibleWidth + hexWidth &&
        y > -offset.y / zoom - hexHeight &&
        y < -offset.y / zoom + visibleHeight + hexHeight
      ) {
        if (hex.feature === 'city' && hex.name) {
          drawHexName(ctx, x, y, hexSize, hex, zoom);
        }
      }
    });

    // Draw roads
    if (features && features.roads) {
      drawFeatures(ctx, features, hexSize, hexWidth, hexHeight, zoom, offset);
    }

    ctx.restore();
  }, [hexes, units, orders, features, zoom, offset, selectedUnitId, fogOfWar, currentPlayer, losBoost]);

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