import { useRef, useState, useEffect } from 'react';
import Map from './Map';
import Frame from './Frame';
import { loadMap, getHexAtPosition } from '../utils/hexGrid';
import WaterlooEngine from '../engine/WaterlooEngine';
import { validateOrder, resolveCombat } from '../games/campaigns-of-napoleon/Rules';
import campaign2 from '../data/maps/italianCampaign.json';

function MapContainer() {
  const canvasRef = useRef(null);
  const [engine] = useState(() => new WaterlooEngine(loadMap(campaign2)));
  const [gameState, setGameState] = useState(engine.getState());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fogOfWar, setFogOfWar] = useState(true);
  const [paintRoadMode, setPaintRoadMode] = useState(null); // null, 'paint', 'erase'
  const [paintingHexes, setPaintingHexes] = useState(null);

  const updateGameState = (newState) => {
    console.log('Updating game state:', newState);
    setGameState(prev => {
      const updatedHexes = newState.hexes ? newState.hexes.map(h => ({ ...h, units: [...h.units] })) : prev.hexes;
      const updatedUnits = newState.units ? [...newState.units] : prev.units;
      return {
        ...prev,
        hexes: updatedHexes,
        units: updatedUnits,
      };
    });
    if (newState.hexes) engine.state.hexes = newState.hexes.map(h => ({ ...h, units: [...h.units] }));
    if (newState.units) engine.state.units = [...newState.units];
  };

  const handleClick = (e) => {
    if (paintRoadMode) return; // Disable selection in paint/erase mode
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedHex = getHexAtPosition(x, y, gameState.hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (!clickedHex) return;

    setGameState(prev => {
      if (prev.selectedHex && clickedHex.q === prev.selectedHex[0] && clickedHex.r === prev.selectedHex[1]) {
        engine.state.orders[prev.currentPlayer] = {};
        return { ...prev, selectedHex: null, selectedUnitId: null };
      }

      if (!prev.selectedUnitId) {
        return { ...prev, selectedHex: [clickedHex.q, clickedHex.r] };
      }

      const unit = prev.units.find(u => u.id === prev.selectedUnitId);
      if (unit && unit.team === prev.currentPlayer) {
        const targetUnit = clickedHex.units
          .map(id => prev.units.find(u => u.id === id))
          .find(u => u.team !== unit.team);

        const success = engine.issueOrder(prev.selectedUnitId, 'move', { dest: [clickedHex.q, clickedHex.r] }, validateOrder);
        if (success) {
          if (targetUnit) {
            console.log(`Combat triggered: ${unit.id} moves to [${clickedHex.q}, ${clickedHex.r}] and engages ${targetUnit.id}`);
          } else {
            console.log(`Move order issued for ${prev.selectedUnitId} to [${clickedHex.q}, ${clickedHex.r}]`);
          }
          engine.state.orders[prev.currentPlayer] = engine.state.orders[prev.currentPlayer] || {};
          engine.state.orders[prev.currentPlayer][prev.selectedUnitId] = { type: 'move', dest: [clickedHex.q, clickedHex.r] };
          return { ...engine.getState(), selectedUnitId: null, selectedHex: null };
        } else {
          console.log(`Move order failed for ${prev.selectedUnitId} to [${clickedHex.q}, ${clickedHex.r}]`);
        }
      }
      return prev;
    });
  };

  const handleUnitSelect = (unitId) => {
    if (paintRoadMode) return; // Disable unit selection in paint/erase mode
    setGameState(prev => {
      const unit = prev.units.find(u => u.id === unitId);
      if (unit && unit.team === prev.currentPlayer && !prev.orders[unit.team][unitId]) {
        engine.state.orders[unit.team][unitId] = null;
        return { ...prev, selectedUnitId: unitId };
      }
      return prev;
    });
  };

  const handleScoutOrder = (unitId) => {
    if (paintRoadMode) return;
    const unit = gameState.units.find(u => u.id === unitId);
    if (!unit || unit.team !== gameState.currentPlayer || unit.horses <= 0) return;

    const success = engine.issueOrder(unitId, 'scout', {}, validateOrder);
    if (success) {
      console.log(`Scout order issued for ${unitId}`);
      setGameState(prev => ({
        ...engine.getState(),
        selectedUnitId: null,
        selectedHex: null,
      }));
    } else {
      console.log(`Scout order failed for ${unitId}`);
    }
  };

  const handleDeselect = () => {
    if (paintRoadMode) return;
    setGameState(prev => {
      if (prev.selectedUnitId) {
        engine.state.orders[prev.currentPlayer] = {};
        return { ...prev, selectedUnitId: null, selectedHex: null };
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
    const newZoom = Math.max(0.5, Math.min(5, zoom * zoomDelta));
    const zoomRatio = newZoom / zoom;

    setOffset({ x: mouseX - zoomRatio * (mouseX - offset.x), y: mouseY - zoomRatio * (mouseY - offset.y) });
    setZoom(newZoom);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [zoom, offset]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (paintRoadMode) {
      setPaintingHexes(new Set());
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hex = getHexAtPosition(x, y, gameState.hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
      if (hex) {
        setPaintingHexes(prev => {
          const newSet = new Set(prev);
          newSet.add(`${hex.q},${hex.r}`);
          return newSet;
        });
      }
      return;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...offset };

    const handleMouseMove = (e2) => {
      const dx = e2.clientX - startX;
      const dy = e2.clientY - startY;
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!paintRoadMode || !paintingHexes) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hex = getHexAtPosition(x, y, gameState.hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (hex) {
      setPaintingHexes(prev => {
        const newSet = new Set(prev);
        newSet.add(`${hex.q},${hex.r}`);
        return newSet;
      });
      // Batch update on move for smoother preview
      const updatedHexes = gameState.hexes.map(h => {
        const key = `${h.q},${h.r}`;
        if (paintingHexes.has(key)) {
          return { ...h, road: paintRoadMode === 'paint' ? true : false };
        }
        return h;
      });
      updateGameState({ hexes: updatedHexes });
    }
  };

  const handleMouseUp = () => {
    if (!paintRoadMode || !paintingHexes) return;
    const updatedHexes = gameState.hexes.map(h => {
      const key = `${h.q},${h.r}`;
      if (paintingHexes.has(key)) {
        return { ...h, road: paintRoadMode === 'paint' ? true : false };
      }
      return h;
    });
    updateGameState({ hexes: updatedHexes });
    setPaintingHexes(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [paintRoadMode, paintingHexes, gameState.hexes, zoom, offset]);

  const handleEndTurn = (player) => {
    if (player !== gameState.currentPlayer) return;
    console.log(`Ending turn for ${player}`);
    engine.endTurn(player, resolveCombat);
    const newState = engine.getState();
    console.log('New game state after endTurn:', newState);
    console.log('Notifications after endTurn:', newState.notifications);
    setGameState(newState);
  };

  const clearNotifications = () => {
    engine.state.notifications = [];
    setGameState(prev => ({ ...prev, notifications: [] }));
  };

  const toggleFogOfWar = () => {
    setFogOfWar(prev => !prev);
    console.log(`Fog of war toggled to: ${!fogOfWar}`);
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
      notifications={gameState.notifications}
      onEndTurn={handleEndTurn}
      onUnitSelect={handleUnitSelect}
      onDeselect={handleDeselect}
      handleScoutOrder={handleScoutOrder}
      clearNotifications={clearNotifications}
      toggleFogOfWar={toggleFogOfWar}
      fogOfWar={fogOfWar}
      zoom={zoom}
      offset={offset}
      updateGameState={updateGameState}
      paintRoadMode={paintRoadMode}
      setPaintRoadMode={setPaintRoadMode}
    >
      <Map
        canvasRef={canvasRef}
        hexes={gameState.hexes}
        units={gameState.units}
        orders={gameState.orders}
        features={{ roads: {} }}
        zoom={zoom}
        offset={offset}
        selectedUnitId={gameState.selectedUnitId}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        fogOfWar={fogOfWar}
        currentPlayer={gameState.currentPlayer}
      />
    </Frame>
  );
}

export default MapContainer;