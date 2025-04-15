import React, { useState } from 'react';
import './DebugPanel.css';

function DebugPanel({ hexes, units, selectedHex, currentPlayer, fogOfWar, toggleFogOfWar, updateGameState, paintMode, setPaintMode, paintTerrainType, setPaintTerrainType, paintHeightType, setPaintHeightType }) {
  const [editTerrain, setEditTerrain] = useState('');
  const [editFeature, setEditFeature] = useState('');
  const [editCityName, setEditCityName] = useState('');
  const [editUnitId, setEditUnitId] = useState('');
  const [editUnitStrength, setEditUnitStrength] = useState(1000);
  const [editRoad, setEditRoad] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editRivers, setEditRivers] = useState([false, false, false, false, false, false]); // 6 sides
  const [localPaintMode, setLocalPaintMode] = useState(paintMode);
  const terrainOptions = ['plains', 'woods', 'hills', 'crops', 'swamps'];
  const featureOptions = ['', 'city', 'village'];
  const heightOptions = ['0', '1', '2'];

  // Load selected hex’s rivers on selection
  React.useEffect(() => {
    if (selectedHex) {
      const [q, r] = selectedHex;
      const hex = hexes.find(h => h.q === q && h.r === r);
      setEditRivers(hex ?.rivers || [false, false, false, false, false, false]);
    }
  }, [selectedHex, hexes]);

  const handleApplyEdits = () => {
    if (!selectedHex) return;
    const [q, r] = selectedHex;

    console.log('Applying edits for hex:', [q, r], { editTerrain, editFeature, editCityName, editUnitId, editUnitStrength, editRoad, editHeight, editRivers });

    const updatedHexes = hexes.map(h => {
      if (h.q === q && h.r === r) {
        return {
          ...h,
          terrain: editTerrain || h.terrain,
          feature: editFeature || undefined,
          name: editFeature ? (editCityName || h.name || '') : undefined,
          road: editRoad !== '' ? editRoad : h.road,
          height: editHeight !== '' ? parseInt(editHeight) : h.height || 0,
          rivers: editRivers, // Store 6-side river array
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
    setEditFeature('');
    setEditCityName('');
    setEditUnitId('');
    setEditUnitStrength(1000);
    setEditRoad('');
    setEditHeight('');
    setEditRivers([false, false, false, false, false, false]);
  };

  const isBlue = currentPlayer === 'blue';
  const buttonClass = `end-turn-button ${isBlue ? '' : 'end-turn-button-red'}`;

  const handlePaintMode = (mode) => {
    const newMode = mode === localPaintMode ? null : mode;
    setLocalPaintMode(newMode);
    setPaintMode(newMode);
  };

  return (
    <div className="debug-panel">
      <button
        onClick={toggleFogOfWar}
        className={buttonClass}
      >
        {fogOfWar ? 'Disable Fog of War' : 'Enable Fog of War'}
      </button>
      {selectedHex && !localPaintMode && (
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
            Feature:
            <select
              value={editFeature || hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.feature || ''}
              onChange={(e) => setEditFeature(e.target.value)}
            >
              {featureOptions.map(f => (
                <option key={f} value={f}>
                  {f === '' ? 'None' : f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </label>
          {(editFeature === 'city' || editFeature === 'village') && (
            <label>
              Name:
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
            Height:
            <select
              value={editHeight || hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.height || '0'}
              onChange={(e) => setEditHeight(e.target.value)}
            >
              {heightOptions.map(h => (
                <option key={h} value={h}>
                  {h === '0' ? 'Low' : h === '1' ? 'Mid' : 'High'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rivers (Sides):
            <div className="river-controls">
              {['Right', 'Top-Right', 'Top', 'Left', 'Bottom-Left', 'Bottom'].map((side, i) => (
                <label key={i}>
                  {side}:
                  <input
                    type="checkbox"
                    checked={editRivers[i]}
                    onChange={(e) => {
                      const newRivers = [...editRivers];
                      newRivers[i] = e.target.checked;
                      setEditRivers(newRivers);
                    }}
                  />
                </label>
              ))}
            </div>
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
            disabled={!selectedHex || (!editTerrain && !editFeature && !editUnitId && editRoad === '' && editHeight === '' && editRivers.every(r => !r))}
          >
            Apply Changes
          </button>
        </div>
      )}
      <div className="paint-controls">
        <button
          onClick={() => handlePaintMode('road_paint')}
          className={`${buttonClass} ${localPaintMode === 'road_paint' ? 'active' : ''}`}
        >
          Paint Road
        </button>
        <button
          onClick={() => handlePaintMode('road_erase')}
          className={`${buttonClass} ${localPaintMode === 'road_erase' ? 'active' : ''}`}
        >
          Erase Road
        </button>
        <button
          onClick={() => handlePaintMode('terrain')}
          className={`${buttonClass} ${localPaintMode === 'terrain' ? 'active' : ''}`}
        >
          Paint Terrain
        </button>
        <button
          onClick={() => handlePaintMode('height')}
          className={`${buttonClass} ${localPaintMode === 'height' ? 'active' : ''}`}
        >
          Paint Height
        </button>
        <button
          onClick={() => handlePaintMode(null)}
          className={`${buttonClass} ${localPaintMode === null ? 'active' : ''}`}
        >
          Disable Paint
        </button>
        {localPaintMode === 'terrain' && (
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
        {localPaintMode === 'height' && (
          <select
            value={paintHeightType}
            onChange={(e) => setPaintHeightType(e.target.value)}
          >
            {heightOptions.map(h => (
              <option key={h} value={h}>
                {h === '0' ? 'Low' : h === '1' ? 'Mid' : 'High'}
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
                height: h.height || 0,
                rivers: h.rivers || [false, false, false, false, false, false],
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