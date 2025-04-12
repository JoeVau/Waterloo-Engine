import React, { useState, useRef } from 'react';
import Map from './Map';
import { getHexAtPosition } from '../utils/hexGrid';
import './MapEditor.css';

function MapEditor({ hexes, features, units, zoom, offset, fogOfWar, currentPlayer, onSaveMap }) {
  const [editedHexes, setEditedHexes] = useState([...hexes]);
  const [selectedHex, setSelectedHex] = useState(null);
  const canvasRef = useRef(null);

  const terrainOptions = ['plains', 'woods', 'hills', 'crops', 'swamps'];

  const handleHexSelect = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedHex = getHexAtPosition(x, y, editedHexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (clickedHex) {
      setSelectedHex([clickedHex.q, clickedHex.r]);
    }
  };

  const updateHex = (field, value) => {
    if (!selectedHex) return;
    setEditedHexes((prev) =>
      prev.map((h) =>
        h.q === selectedHex[0] && h.r === selectedHex[1] ? { ...h, [field]: value } : h
      )
    );
  };

  const toggleCity = (e) => {
    const isCity = e.target.checked;
    if (!selectedHex) return;
    setEditedHexes((prev) =>
      prev.map((h) =>
        h.q === selectedHex[0] && h.r === selectedHex[1]
          ? { ...h, feature: isCity ? 'city' : undefined, name: isCity ? h.name || '' : undefined }
          : h
      )
    );
  };

  const saveMap = () => {
    const mapData = {
      name: 'Edited Campaign',
      gridSize: Math.sqrt(editedHexes.length),
      hexes: editedHexes.reduce((acc, h) => ({
        ...acc,
        [`${h.q},${h.r}`]: {
          terrain: h.terrain,
          feature: h.feature,
          name: h.name,
          units: h.units || [],
        },
      }), {}),
      units,
      features: { roads: [] },
    };
    onSaveMap(mapData);
  };

  return (
    <div className="map-editor">
      <h3>Map Editor</h3>
      <div className="map-preview">
        <Map
          canvasRef={canvasRef}
          hexes={editedHexes}
          units={units}
          orders={{ blue: {}, red: {} }}
          features={{ roads: {} }}
          zoom={zoom}
          offset={offset}
          selectedUnitId={null}
          onClick={handleHexSelect}
          fogOfWar={fogOfWar}
          currentPlayer={currentPlayer}
        />
      </div>
      {selectedHex && (
        <div className="hex-editor">
          <h4>Editing Hex [{selectedHex[0]}, {selectedHex[1]}]</h4>
          <label>
            Terrain:
            <select
              value={editedHexes.find((h) => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.terrain || 'plains'}
              onChange={(e) => updateHex('terrain', e.target.value)}
            >
              {terrainOptions.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            City:
            <input
              type="checkbox"
              checked={editedHexes.find((h) => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.feature === 'city'}
              onChange={toggleCity}
            />
          </label>
          {editedHexes.find((h) => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.feature === 'city' && (
            <label>
              City Name:
              <input
                type="text"
                value={editedHexes.find((h) => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.name || ''}
                onChange={(e) => updateHex('name', e.target.value)}
              />
            </label>
          )}
        </div>
      )}
      <div className="editor-controls">
        <button onClick={saveMap}>Save Map</button>
      </div>
    </div>
  );
}

export default MapEditor;