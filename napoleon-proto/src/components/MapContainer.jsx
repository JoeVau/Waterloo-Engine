import { useRef, useState, useEffect } from 'react';
import Map from './Map';
import Frame from './Frame';
import { loadMap, getHexAtPosition, hexDistance } from '../utils/hexGrid';
import campaign2 from '../data/maps/italianCampaign.json';

function MapContainer() {
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState({
    turn: 1,
    currentPlayer: 'blue', // Tracks whose turn it is
    hexes: [],
    units: [],
    features: null,
    orders: { blue: {}, red: {} },
    selectedUnitId: null,
    selectedHex: null,
    zoom: 1,
    offset: { x: 0, y: 0 },
  });

  // Load map once
  useEffect(() => {
    const { hexes: loadedHexes, units: loadedUnits, features: loadedFeatures } = loadMap(campaign2);
    console.log('Loaded roadGraph:', loadedFeatures.roads);
    setGameState(prev => ({
      ...prev,
      hexes: loadedHexes,
      units: loadedUnits,
      features: loadedFeatures,
    }));
  }, []);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedHex = getHexAtPosition(x, y, gameState.hexes, Map.hexWidth, Map.hexHeight, gameState.zoom, gameState.offset);
    if (!clickedHex) return;

    setGameState(prev => {
      // Deselect if clicking the same hex
      if (prev.selectedHex && clickedHex.q === prev.selectedHex[0] && clickedHex.r === prev.selectedHex[1]) {
        return { ...prev, selectedHex: null, selectedUnitId: null, orders: { ...prev.orders, [prev.currentPlayer]: {} } };
      }

      // Set selected hex if no unit is selected
      if (!prev.selectedUnitId) {
        return { ...prev, selectedHex: [clickedHex.q, clickedHex.r] };
      }

      // Issue move order if unit is selected
      const unit = prev.units.find(u => u.id === prev.selectedUnitId);
      const unitHex = prev.hexes.find(h => h.units.includes(prev.selectedUnitId));
      if (unit && unit.team === prev.currentPlayer && hexDistance(unitHex.q, unitHex.r, clickedHex.q, clickedHex.r) <= 2) {
        return {
          ...prev,
          orders: {
            ...prev.orders,
            [unit.team]: {
              ...prev.orders[unit.team],
              [prev.selectedUnitId]: { type: 'move', dest: [clickedHex.q, clickedHex.r] },
            },
          },
          selectedUnitId: null,
          selectedHex: null,
        };
      }
      return prev;
    });
  };

  const handleUnitSelect = (unitId) => {
    setGameState(prev => {
      const unit = prev.units.find(u => u.id === unitId);
      if (unit && unit.team === prev.currentPlayer && !prev.orders[unit.team][unit.id]) {
        return {
          ...prev,
          selectedUnitId: unitId,
          orders: { ...prev.orders, [unit.team]: { ...prev.orders[unit.team], [unitId]: null } },
        };
      }
      return prev;
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(5, gameState.zoom * zoomDelta));
    const zoomRatio = newZoom / gameState.zoom;

    setGameState(prev => ({
      ...prev,
      offset: {
        x: mouseX - zoomRatio * (mouseX - prev.offset.x),
        y: mouseY - zoomRatio * (mouseY - prev.offset.y),
      },
      zoom: newZoom,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [gameState.zoom, gameState.offset]);

  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...gameState.offset };

    const handleMouseMove = (e2) => {
      const dx = e2.clientX - startX;
      const dy = e2.clientY - startY;
      setGameState(prev => ({ ...prev, offset: { x: startOffset.x + dx, y: startOffset.y + dy } }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleEndTurn = (player) => {
    if (player !== gameState.currentPlayer) return;
    setGameState(prev => {
      if (prev.currentPlayer === 'blue') {
        // Blue ends turn, pass to Red
        return { ...prev, currentPlayer: 'red', selectedUnitId: null, selectedHex: null };
      } else {
        // Red ends turn, resolve all orders
        const newHexes = [...prev.hexes];
        ['blue', 'red'].forEach(team => {
          Object.entries(prev.orders[team]).forEach(([unitId, order]) => {
            if (order && order.type === 'move') {
              const oldHex = newHexes.find(h => h.units.includes(unitId));
              const newHex = newHexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
              if (oldHex && newHex) {
                oldHex.units = oldHex.units.filter(id => id !== unitId);
                newHex.units.push(unitId);
                const unit = prev.units.find(u => u.id === unitId);
                unit.position = order.dest;
              }
            }
          });
        });
        return {
          ...prev,
          hexes: newHexes,
          orders: { blue: {}, red: {} },
          turn: prev.turn + 1,
          currentPlayer: 'blue',
          selectedUnitId: null,
          selectedHex: null,
        };
      }
    });
  };

  return (
    <Frame
      hexes={gameState.hexes}
      units={gameState.units}
      turn={gameState.turn}
      currentPlayer={gameState.currentPlayer}
      orders={gameState.orders}
      selectedHex={gameState.selectedHex}
      selectedUnitId={gameState.selectedUnitId}
      onEndTurn={handleEndTurn}
      onUnitSelect={handleUnitSelect}
    >
      <Map
        canvasRef={canvasRef}
        hexes={gameState.hexes}
        units={gameState.units}
        orders={gameState.orders}
        features={gameState.features}
        zoom={gameState.zoom}
        offset={gameState.offset}
        selectedUnitId={gameState.selectedUnitId}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      />
    </Frame>
  );
}

export default MapContainer;