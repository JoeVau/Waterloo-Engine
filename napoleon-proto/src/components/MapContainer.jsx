// src/components/MapContainer.jsx
import { useRef, useState, useEffect } from 'react';
import Map from './Map';
import Frame from './Frame';
import { loadMap, getHexAtPosition } from '../utils/hexGrid';
import WaterlooEngine from '../engine/WaterlooEngine';
import { validateOrder, resolveCombat, resolveDetachments } from '../games/campaigns-of-napoleon/Rules';
import campaign2 from '../data/maps/italianCampaign.json';

function MapContainer() {
  const canvasRef = useRef(null);
  const [engine] = useState(() => new WaterlooEngine(loadMap(campaign2)));
  const [gameState, setGameState] = useState(engine.getState());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fogOfWar, setFogOfWar] = useState(true);

  const handleClick = (e) => {
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

        if (targetUnit) {
          return { ...prev, selectedHex: [clickedHex.q, clickedHex.r] };
        } else {
          const success = engine.issueOrder(prev.selectedUnitId, 'move', { dest: [clickedHex.q, clickedHex.r] }, validateOrder);
          if (success) {
            console.log(`Move order issued for ${prev.selectedUnitId} to [${clickedHex.q}, ${clickedHex.r}]`);
            return { ...engine.getState(), selectedUnitId: null, selectedHex: null };
          }
        }
      }
      return prev;
    });
  };

  const handleUnitSelect = (unitId) => {
    setGameState(prev => {
      const unit = prev.units.find(u => u.id === unitId);
      if (unit && unit.team === prev.currentPlayer && !prev.orders[unit.team][unitId]) {
        engine.state.orders[unit.team][unitId] = null;
        return { ...prev, selectedUnitId: unitId };
      }
      return prev;
    });
  };

  const handleConfirmAttack = (unitId, targetId) => {
    console.log(`Confirming attack: ${unitId} -> ${targetId}`);
    const success = engine.issueOrder(unitId, 'attack', { targetId }, validateOrder);
    console.log(`Attack order success: ${success}`);
    if (success) {
      setGameState(prev => ({
        ...prev,
        ...engine.getState(),
        selectedUnitId: null,
        selectedHex: null,
      }));
    }
  };

  const handleScoutOrder = (unitId) => {
    console.log(`Issuing scout order for ${unitId}`);
    const success = engine.issueOrder(unitId, 'scout', {}, validateOrder);
    console.log(`Scout order success: ${success}`);
    if (success) {
      setGameState(prev => ({
        ...prev,
        ...engine.getState(),
        selectedUnitId: null,
        selectedHex: null,
      }));
    }
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

  const handleEndTurn = (player) => {
    if (player !== gameState.currentPlayer) return;
    console.log(`Ending turn for ${player}`);
    engine.endTurn(player, resolveCombat);
    setGameState(prev => ({
      ...prev,
      ...engine.getState(), // Deep merge to preserve losBoost
    }));
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
      onDeselect={() => setGameState(prev => ({ ...prev, selectedUnitId: null }))}
      toggleFogOfWar={toggleFogOfWar}
      fogOfWar={fogOfWar}
      onScoutOrder={handleScoutOrder}
    >
      <Map
        canvasRef={canvasRef}
        hexes={gameState.hexes}
        units={gameState.units}
        orders={gameState.orders}
        features={gameState.features}
        zoom={zoom}
        offset={offset}
        selectedUnitId={gameState.selectedUnitId}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        fogOfWar={fogOfWar}
        currentPlayer={gameState.currentPlayer}
        losBoost={gameState.losBoost}
      />
    </Frame>
  );
}

export default MapContainer;