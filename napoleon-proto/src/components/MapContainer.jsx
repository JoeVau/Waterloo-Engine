import { useRef, useState, useEffect } from 'react';
import Map from './Map';
import Frame from './Frame';
import { loadMap, getHexAtPosition } from '../utils/hexGrid';
import WaterlooEngine from '../engine/WaterlooEngine';
import { validateOrder } from '../games/campaigns-of-napoleon/orders';
import { resolveCombat } from '../games/campaigns-of-napoleon/resolutions';
import campaign2 from '../data/maps/italianCampaign.json';
import { handleClick, handleUnitSelect, handleScoutOrder, handleDeselect, handleEndTurn, clearNotifications, toggleFogOfWar } from './uiHandlers';

function MapContainer() {
  const canvasRef = useRef(null);
  const [engine] = useState(() => new WaterlooEngine(loadMap(campaign2)));
  const [gameState, setGameState] = useState(engine.getState());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fogOfWar, setFogOfWar] = useState(true);
  const [paintMode, setPaintMode] = useState(null);
  const [paintTerrainType, setPaintTerrainType] = useState('plains');
  const [paintHeightType, setPaintHeightType] = useState('0');
  const [paintingHexes, setPaintingHexes] = useState(null);

  const updateGameState = (newState) => {
    console.log('Updating game state:', newState);
    setGameState(prev => ({
      ...prev,
      hexes: newState.hexes ? newState.hexes.map(h => ({ ...h, units: [...h.units] })) : prev.hexes,
      units: newState.units ? newState.units.map(u => ({ ...u, position: [...u.position] })) : prev.units,
      turn: newState.turn ?? prev.turn,
      currentPlayer: newState.currentPlayer ?? prev.currentPlayer,
      orders: newState.orders ?? prev.orders,
      notifications: newState.notifications ?? prev.notifications,
      selectedHex: newState.selectedHex ?? prev.selectedHex,
      selectedUnitId: newState.selectedUnitId ?? prev.selectedUnitId
    }));
    if (newState.hexes) engine.state.hexes = newState.hexes.map(h => ({ ...h, units: [...h.units] }));
    if (newState.units) engine.state.units = newState.units.map(u => ({ ...u, position: [...u.position] }));
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

    // Only handle painting if paintMode is active
    if (paintMode) {
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
        const updatedHexes = gameState.hexes.map(h => {
          if (h.q === hex.q && h.r === hex.r) {
            if (paintMode === 'road_paint') return { ...h, road: true };
            if (paintMode === 'road_erase') return { ...h, road: false };
            if (paintMode === 'terrain') return { ...h, terrain: paintTerrainType };
            if (paintMode === 'height') return { ...h, height: parseInt(paintHeightType) };
          }
          return h;
        });
        console.log(`Painting ${paintMode}: ${paintMode === 'terrain' ? paintTerrainType : paintMode === 'height' ? `height=${paintHeightType}` : paintMode}`, [`${hex.q},${hex.r}`]);
        updateGameState({ hexes: updatedHexes });
      }
      return;
    }

    // Non-debug mode: Handle scroll/drag
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...offset };

    const handleMouseMoveDrag = (e2) => {
      const dx = e2.clientX - startX;
      const dy = e2.clientY - startY;
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };

    const handleMouseUpDrag = () => {
      window.removeEventListener('mousemove', handleMouseMoveDrag);
      window.removeEventListener('mouseup', handleMouseUpDrag);
    };

    window.addEventListener('mousemove', handleMouseMoveDrag);
    window.addEventListener('mouseup', handleMouseUpDrag);
  };

  const handleMouseMove = (e) => {
    // Exit early if not painting
    if (!paintMode || !paintingHexes) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hex = getHexAtPosition(x, y, gameState.hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (hex) {
      const key = `${hex.q},${hex.r}`;
      if (!paintingHexes.has(key)) {
        setPaintingHexes(prev => {
          const newSet = new Set(prev);
          newSet.add(key);
          return newSet;
        });
        const updatedHexes = gameState.hexes.map(h => {
          if (`${h.q},${h.r}` === key) {
            if (paintMode === 'road_paint') return { ...h, road: true };
            if (paintMode === 'road_erase') return { ...h, road: false };
            if (paintMode === 'terrain') return { ...h, terrain: paintTerrainType };
            if (paintMode === 'height') return { ...h, height: parseInt(paintHeightType) };
          }
          return h;
        });
        console.log(`Painting ${paintMode}: ${paintMode === 'terrain' ? paintTerrainType : paintMode === 'height' ? `height=${paintHeightType}` : paintMode}`, [key]);
        updateGameState({ hexes: updatedHexes });
      }
    }
  };

  const handleMouseUp = (e) => {
    // Exit early if not painting
    if (!paintMode || !paintingHexes) return;

    const updatedHexes = gameState.hexes.map(h => {
      const key = `${h.q},${h.r}`;
      if (paintingHexes.has(key)) {
        if (paintMode === 'road_paint') return { ...h, road: true };
        if (paintMode === 'road_erase') return { ...h, road: false };
        if (paintMode === 'terrain') return { ...h, terrain: paintTerrainType };
        if (paintMode === 'height') return { ...h, height: parseInt(paintHeightType) };
      }
      return h;
    });
    console.log(`Finalizing ${paintMode}: ${paintMode === 'terrain' ? paintTerrainType : paintMode === 'height' ? `height=${paintHeightType}` : paintMode}`, [...paintingHexes]);
    updateGameState({ hexes: updatedHexes });
    setPaintingHexes(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const handleMouseMoveEvent = (e) => {
        // Only handle mouse move if painting is active
        if (paintMode && paintingHexes) {
          handleMouseMove(e);
        }
      };
      const handleMouseUpEvent = (e) => {
        // Only handle mouse up if painting is active
        if (paintMode && paintingHexes) {
          handleMouseUp(e);
        }
      };
      canvas.addEventListener('mousemove', handleMouseMoveEvent);
      canvas.addEventListener('mouseup', handleMouseUpEvent);
      return () => {
        canvas.removeEventListener('mousemove', handleMouseMoveEvent);
        canvas.removeEventListener('mouseup', handleMouseUpEvent);
      };
    }
  }, [paintMode, paintingHexes, gameState.hexes, zoom, offset, paintTerrainType, paintHeightType]);

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
      onEndTurn={(player) => handleEndTurn(player, gameState, engine, setGameState, resolveCombat)}
      onUnitSelect={(unitId) => handleUnitSelect(unitId, gameState, engine, setGameState, paintMode)}
      onDeselect={() => handleDeselect(gameState, engine, setGameState, paintMode)}
      handleScoutOrder={(unitId) => handleScoutOrder(unitId, gameState, engine, setGameState, paintMode)}
      clearNotifications={() => clearNotifications(engine, setGameState)}
      toggleFogOfWar={() => toggleFogOfWar(setFogOfWar)}
      fogOfWar={fogOfWar}
      zoom={zoom}
      offset={offset}
      updateGameState={updateGameState}
      paintMode={paintMode}
      setPaintMode={setPaintMode}
      paintTerrainType={paintTerrainType}
      setPaintTerrainType={setPaintTerrainType}
      paintHeightType={paintHeightType}
      setPaintHeightType={setPaintHeightType}
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
        onClick={(e) => handleClick(e, gameState, engine, setGameState, getHexAtPosition, Map, zoom, offset)}
        onMouseDown={handleMouseDown}
        fogOfWar={fogOfWar}
        currentPlayer={gameState.currentPlayer}
      />
    </Frame>
  );
}

export default MapContainer;