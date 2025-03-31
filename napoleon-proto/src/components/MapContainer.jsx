import { useRef, useState, useEffect } from 'react';
import Map from './Map';
import { loadMap, getHexAtPosition, hexDistance } from '../utils/hexGrid';
import italianCampaign from '../data/maps/italianCampaign.json'; // Adjust path as needed

function MapContainer() {
  const canvasRef = useRef(null);
  const [hexes, setHexes] = useState([]);
  const [units, setUnits] = useState([]);
  const [turn, setTurn] = useState(1);
  const [currentPlayer, setCurrentPlayer] = useState('blue'); // Blue starts
  const [orders, setOrders] = useState({ blue: {}, red: {} });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Load initial state from italianCampaign.json
  useEffect(() => {
    const { hexes: loadedHexes, units: loadedUnits } = loadMap(italianCampaign);
    setHexes(loadedHexes);
    setUnits(loadedUnits);
    updateFog(loadedHexes, loadedUnits);
  }, []);

  // Update fog based on unit positions
  const updateFog = (currentHexes, currentUnits) => {
    const newHexes = currentHexes.map(hex => ({
      ...hex,
      visible: { blue: 'hidden', red: 'hidden' },
    }));
    currentUnits.forEach(unit => {
      const hex = newHexes.find(h => h.units.includes(unit.id));
      if (!hex) return;
      const team = unit.team;
      newHexes.forEach(h => {
        if (hexDistance(hex.q, hex.r, h.q, h.r) <= 2) {
          h.visible[team] = 'full';
          h.visible[team === 'blue' ? 'red' : 'blue'] = h.units.length ? 'partial' : 'hidden';
        }
      });
    });
    setHexes(newHexes);
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedHex = getHexAtPosition(x, y, hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (!clickedHex) return;

    const unit = units.find(u => hexes.find(h => h.q === u.position[0] && h.r === u.position[1] && h.units.includes(u.id)));
    if (unit && unit.team === currentPlayer && !orders[unit.team][unit.id]) {
      setOrders(prev => ({
        ...prev,
        [unit.team]: { ...prev[unit.team], [unit.id]: null },
      }));
    } else if (orders[currentPlayer][unit ?.id] === null) {
      const unitId = unit.id;
      const unitHex = hexes.find(h => h.units.includes(unitId));
      if (hexDistance(unitHex.q, unitHex.r, clickedHex.q, clickedHex.r) <= 2) {
        setOrders(prev => ({
          ...prev,
          [currentPlayer]: { [unitId]: { type: 'move', dest: [clickedHex.q, clickedHex.r] } },
        }));
      }
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
    const newZoom = Math.max(0.5, Math.min(3, zoom * zoomDelta));
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
    if (team !== currentPlayer) return; // Only active player can end turn
    if (currentPlayer === 'blue') {
      setCurrentPlayer('red'); // Blue ends, Red’s turn
    } else {
      // Red ends, resolve both turns
      resolveTurn();
      setCurrentPlayer('blue'); // Back to Blue for next turn
      setTurn(turn + 1);
    }
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
          unit.position = order.dest; // Keep unit position in sync
        }
      });
    });
    setOrders({ blue: {}, red: {} });
    updateFog(newHexes, units);
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Blue Sidebar */}
      <div style={{ width: '200px', background: '#bbf', padding: '10px' }}>
        <h3>Blue Player</h3>
        <p>Turn: {turn} {currentPlayer === 'blue' ? '(Active)' : ''}</p>
        <p>Unit: {units[0] ?.name}</p>
        <p>Position: [{units[0] ?.position[0]}, {units[0] ?.position[1]}]</p>
        <p>Order: {orders.blue.blue_1 ? `Move to [${orders.blue.blue_1.dest}]` : 'None'}</p>
        <button onClick={() => handleEndTurn('blue')} disabled={currentPlayer !== 'blue'}>
          End Turn
        </button>
      </div>

      {/* Canvas */}
      <div style={{ width: '1000px', height: '800px', background: '#ccc' }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={800}
          onClick={handleClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          style={{ display: 'block', cursor: 'grab' }}
        />
        <Map canvasRef={canvasRef} hexes={hexes} units={units} orders={orders} zoom={zoom} offset={offset} />
      </div>

      {/* Red Sidebar */}
      <div style={{ width: '200px', background: '#fbb', padding: '10px' }}>
        <h3>Red Player</h3>
        <p>Turn: {turn} {currentPlayer === 'red' ? '(Active)' : ''}</p>
        <p>Unit: {units[1] ?.name}</p>
        <p>Position: [{units[1] ?.position[0]}, {units[1] ?.position[1]}]</p>
        <p>Order: {orders.red.red_1 ? `Move to [${orders.red.red_1.dest}]` : 'None'}</p>
        <button onClick={() => handleEndTurn('red')} disabled={currentPlayer !== 'red'}>
          End Turn
        </button>
      </div>
    </div>
  );
}

export default MapContainer;