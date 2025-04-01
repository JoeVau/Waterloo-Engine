import { useRef, useState, useEffect } from 'react';
import Map from './Map';
import Frame from './Frame';
import { loadMap, getHexAtPosition, hexDistance } from '../utils/hexGrid';
import italianCampaign from '../data/maps/italianCampaign.json';

function MapContainer() {
  const canvasRef = useRef(null);
  const [hexes, setHexes] = useState([]);
  const [units, setUnits] = useState([]);
  const [turn, setTurn] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState('blue');
  const [orders, setOrders] = useState({ blue: {}, red: {} });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedHex, setSelectedHex] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  useEffect(() => {
    const { hexes: loadedHexes, units: loadedUnits } = loadMap(italianCampaign);
    setHexes(loadedHexes);
    setUnits(loadedUnits);
  }, []);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedHex = getHexAtPosition(x, y, hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (!clickedHex) return;

    if (selectedHex && clickedHex.q === selectedHex[0] && clickedHex.r === selectedHex[1]) {
      setSelectedHex(null);
      setSelectedUnitId(null);
      setOrders(prev => ({
        ...prev,
        [currentPlayer]: {},
      }));
      return;
    }

    setSelectedHex([clickedHex.q, clickedHex.r]);
    setSelectedUnitId(null);
    setOrders(prev => ({
      ...prev,
      [currentPlayer]: {},
    }));

    if (clickedHex.units.length && !selectedUnitId) return;

    if (selectedUnitId && orders[currentPlayer][selectedUnitId] === null) {
      const unitHex = hexes.find(h => h.units.includes(selectedUnitId));
      if (hexDistance(unitHex.q, unitHex.r, clickedHex.q, clickedHex.r) <= 2) {
        setOrders(prev => ({
          ...prev,
          [currentPlayer]: { [selectedUnitId]: { type: 'move', dest: [clickedHex.q, clickedHex.r] } },
        }));
        setSelectedUnitId(null);
        setSelectedHex(null);
      }
    }
  };

  const handleUnitSelect = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    if (unit && unit.team === currentPlayer && !orders[unit.team][unit.id]) {
      setSelectedUnitId(unitId);
      setOrders(prev => ({
        ...prev,
        [unit.team]: { [unitId]: null },
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

    setOffset(prev => ({
      x: mouseX - zoomRatio * (mouseX - prev.x),
      y: mouseY - zoomRatio * (mouseY - prev.y),
    }));
    setZoom(newZoom);
  };

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

  const handleEndTurn = (team) => {
    if (team !== currentPlayer) return;
    if (currentPlayer === 'blue') {
      setCurrentPlayer('red');
    } else {
      resolveTurn();
      setCurrentPlayer('blue');
      setTurn(turn + 1);
    }
    setSelectedUnitId(null);
    setSelectedHex(null);
  };

  const resolveTurn = () => {
    const newHexes = [...hexes];
    Object.entries(orders).forEach(([team, teamOrders]) => {
      Object.entries(teamOrders).forEach(([unitId, order]) => {
        if (order && order.type === 'move') {
          const oldHex = newHexes.find(h => h.units.includes(unitId));
          const newHex = newHexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
          oldHex.units = oldHex.units.filter(id => id !== unitId);
          newHex.units.push(unitId);
          const unit = units.find(u => u.id === unitId);
          unit.position = order.dest;
        }
      });
    });
    setOrders({ blue: {}, red: {} });
    setHexes(newHexes);
  };

  return (
    <Frame
      hexes={hexes}
      units={units}
      turn={turn}
      currentPlayer={currentPlayer}
      orders={orders}
      selectedHex={selectedHex}
      selectedUnitId={selectedUnitId}
      onEndTurn={handleEndTurn}
      onUnitSelect={handleUnitSelect}
    >
      <Map
        canvasRef={canvasRef}
        hexes={hexes}
        units={units}
        orders={orders}
        zoom={zoom}
        offset={offset}
        selectedUnitId={selectedUnitId}
        onClick={handleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      />
    </Frame>
  );
}

export default MapContainer;