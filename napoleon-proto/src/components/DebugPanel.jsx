import React, { useState } from 'react';
import './DebugPanel.css';

function DebugPanel({ hexes, units, selectedHex, currentPlayer, fogOfWar, toggleFogOfWar, updateGameState, paintMode, setPaintMode, paintTerrainType, setPaintTerrainType }) {
  const [editTerrain, setEditTerrain] = useState('');
  const [editCity, setEditCity] = useState(false);
  const [editCityName, setEditCityName] = useState('');
  const [editUnitId, setEditUnitId] = useState('');
  const [editUnitStrength, setEditUnitStrength] = useState(1000);
  const [editRoad, setEditRoad] = useState('');

  const terrainOptions = ['plains', 'woods', 'hills', 'crops', 'swamps'];

  const handleApplyEdits = () => {
    if (!selectedHex) return;
    const [q, r] = selectedHex;

    console.log('Applying edits for hex:', [q, r], { editTerrain, editCity, editCityName, editUnitId, editUnitStrength, editRoad });

    const updatedHexes = hexes.map(h => {
      if (h.q === q && h.r === r) {
        return {
          ...h,
          terrain: editTerrain || h.terrain,
          feature: editCity ? 'city' : undefined,
          name: editCity ? (editCityName || h.name || '') : undefined,
          road: editRoad !== '' ? editRoad : h.road,
          units: [...h.units],
        };
      }
      return { ...h, units: [...h.units] };
    });

    let updatedUnits = [...units];
    if (editUnitId) {
      const existingUnitIndex = units.findIndex(u => u.id === editUnitId);
      if (existingUnitIndex >= 0) {
        updatedUnits = [
          ...units.slice(0, existingUnitIndex),
          {
            ...units[existingUnitIndex],
            strength: editUnitStrength,
            position: [q, r],
          },
          ...units.slice(existingUnitIndex + 1),
        ];
      } else {
        updatedUnits = [
          ...units,
          {
            id: editUnitId,
            name: `Unit ${editUnitId}`,
            team: currentPlayer,
            position: [q, r],
            strength: editUnitStrength,
            guns: 0,
            horses: 0,
            skill: 1,
          },
        ];
      }

      updatedHexes.forEach(h => {
        if (h.q === q && h.r === r) {
          if (!h.units.includes(editUnitId)) {
            h.units.push(editUnitId);
          }
        } else if (existingUnitIndex >= 0) {
          h.units = h.units.filter(id => id !== editUnitId);
        }
      });
    }

    console.log('Updated state:', { hexes: updatedHexes.find(h => h.q === q && h.r === r), units: updatedUnits });
    updateGameState({ hexes: updatedHexes, units: updatedUnits });

    setEditTerrain('');
    setEditCity(false);
    setEditCityName('');
    setEditUnitId('');
    setEditUnitStrength(1000);
    setEditRoad('');
  };

  const isBlue = currentPlayer === 'blue';
  const buttonClass = `end-turn-button ${isBlue ? '' : 'end-turn-button-red'}`;

  const handlePaintMode = (mode) => {
    setPaintMode(mode === paintMode ? null : mode); // Toggle mode
  };

  return (
    <div className="debug-panel">
      <button
        onClick={toggleFogOfWar}
        className={buttonClass}
      >
        {fogOfWar ? 'Disable Fog of War' : 'Enable Fog of War'}
      </button>
      {selectedHex && !paintMode && (
        <div className="god-mode-controls">
          <h4>God Mode: Edit Hex [{selectedHex[0]}, {selectedHex[1]}]</h4>
          <label>
            Terrain:
            <select
              value={editTerrain || hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.terrain || 'plains'}
              onChange={(e) => setEditTerrain(e.target.value)}
            >
              {terrainOptions.map(t => (
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
              checked={editCity || hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.feature === 'city'}
              onChange={(e) => setEditCity(e.target.checked)}
            />
          </label>
          {editCity && (
            <label>
              City Name:
              <input
                type="text"
                value={editCityName || hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.name || ''}
                onChange={(e) => setEditCityName(e.target.value)}
              />
            </label>
          )}
          <label>
            Road:
            <input
              type="checkbox"
              checked={editRoad !== '' ? editRoad : hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.road || false}
              onChange={(e) => setEditRoad(e.target.checked)}
            />
          </label>
          <label>
            Add/Edit Unit ID:
            <input
              type="text"
              value={editUnitId}
              onChange={(e) => setEditUnitId(e.target.value)}
              placeholder="e.g., blue_99"
            />
          </label>
          {editUnitId && (
            <label>
              Unit Strength:
              <input
                type="number"
                value={editUnitStrength}
                onChange={(e) => setEditUnitStrength(parseInt(e.target.value) || 1000)}
                min="100"
                max="10000"
              />
            </label>
          )}
          <button
            onClick={handleApplyEdits}
            className={buttonClass}
            disabled={!selectedHex || (!editTerrain && !editCity && !editUnitId && editRoad === '')}
          >
            Apply Changes
          </button>
        </div>
      )}
      <div className="paint-controls">
        <button
          onClick={() => handlePaintMode('road_paint')}
          className={`${buttonClass} ${paintMode === 'road_paint' ? 'active' : ''}`}
        >
          Paint Road
        </button>
        <button
          onClick={() => handlePaintMode('road_erase')}
          className={`${buttonClass} ${paintMode === 'road_erase' ? 'active' : ''}`}
        >
          Erase Road
        </button>
        <button
          onClick={() => handlePaintMode('terrain')}
          className={`${buttonClass} ${paintMode === 'terrain' ? 'active' : ''}`}
        >
          Paint Terrain
        </button>
        {paintMode === 'terrain' && (
          <select
            value={paintTerrainType}
            onChange={(e) => setPaintTerrainType(e.target.value)}
          >
            {terrainOptions.map(t => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        )}
      </div>
      <button
        onClick={() => {
          const mapData = {
            name: 'Edited Campaign',
            gridSize: Math.sqrt(hexes.length),
            hexes: hexes.reduce((acc, h) => ({
              ...acc,
              [`${h.q},${h.r}`]: {
                terrain: h.terrain,
                feature: h.feature,
                name: h.name,
                road: h.road || false,
                units: h.units || [],
              },
            }), {}),
            units,
            features: { roads: [] },
          };
          const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'editedCampaign.json';
          a.click();
          URL.revokeObjectURL(url);
        }}
        className={buttonClass}
      >
        Save Map
      </button>
    </div>
  );
}

export default DebugPanel;