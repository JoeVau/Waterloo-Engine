import React, { useState } from 'react';
import './DebugPanel.css';

function DebugPanel({ hexes, units, selectedHex, currentPlayer, fogOfWar, toggleFogOfWar, updateGameState }) {
  const [editTerrain, setEditTerrain] = useState('');
  const [editCity, setEditCity] = useState(false);
  const [editCityName, setEditCityName] = useState('');
  const [editUnitId, setEditUnitId] = useState('');
  const [editUnitStrength, setEditUnitStrength] = useState(1000);

  const terrainOptions = ['plains', 'woods', 'hills', 'crops', 'swamps'];

  const handleApplyEdits = () => {
    if (!selectedHex) return;
    const [q, r] = selectedHex;

    // Create immutable updatedHexes
    const updatedHexes = hexes.map(h => {
      if (h.q === q && h.r === r) {
        return {
          ...h,
          terrain: editTerrain || h.terrain,
          feature: editCity ? 'city' : undefined,
          name: editCity ? (editCityName || h.name || '') : undefined,
          units: [...h.units], // Ensure units array is copied
        };
      }
      return { ...h, units: [...h.units] }; // Copy all hexes and units arrays
    });

    // Create immutable updatedUnits
    let updatedUnits = [...units];
    if (editUnitId) {
      const existingUnitIndex = units.findIndex(u => u.id === editUnitId);
      if (existingUnitIndex >= 0) {
        // Update existing unit
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
        // Add new unit
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

      // Update hex units to include new unit
      updatedHexes.forEach(h => {
        if (h.q === q && h.r === r) {
          if (!h.units.includes(editUnitId)) {
            h.units = [...h.units, editUnitId];
          }
        } else if (existingUnitIndex >= 0) {
          // Remove unit from other hexes if it was moved
          h.units = h.units.filter(id => id !== editUnitId);
        }
      });
    }

    // Call updateGameState with new state
    updateGameState({ hexes: updatedHexes, units: updatedUnits });

    // Reset inputs after applying
    setEditTerrain('');
    setEditCity(false);
    setEditCityName('');
    setEditUnitId('');
    setEditUnitStrength(1000);
  };

  const isBlue = currentPlayer === 'blue';
  const buttonClass = `end-turn-button ${isBlue ? '' : 'end-turn-button-red'}`;

  return (
    <div className="debug-panel">
      <button
        onClick={toggleFogOfWar}
        className={buttonClass}
      >
        {fogOfWar ? 'Disable Fog of War' : 'Enable Fog of War'}
      </button>
      {selectedHex && (
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
            disabled={!selectedHex || (!editTerrain && !editCity && !editUnitId)}
          >
            Apply Changes
          </button>
        </div>
      )}
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