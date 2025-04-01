import React from 'react';

function Frame({ hexes, units, turn, currentPlayer, orders, selectedHex, selectedUnitId, onEndTurn, onUnitSelect, children }) {
  const selectedHexUnits = selectedHex
    ? units.filter(u => hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.units.includes(u.id))
    : [];

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '200px', background: '#bbf', padding: '10px' }}>
        <h3>Blue Player</h3>
        <p>Turn: {turn} {currentPlayer === 'blue' ? '(Active)' : ''}</p>
        {selectedHex ? (
          <>
          <p>Selected Hex: [{selectedHex[0]}, {selectedHex[1]}]</p>
          <p>Units:</p>
          <ul style={{ paddingLeft: '20px' }}>
            {selectedHexUnits.map(unit => (
              <li
                key={unit.id}
                onClick={() => onUnitSelect(unit.id)}
                style={{
                  cursor: 'pointer',
                  fontWeight: unit.id === selectedUnitId ? 'bold' : 'normal',
                  color: unit.id === selectedUnitId ? '#00f' : '#000',
                }}
              >
                {unit.name} {unit.id === selectedUnitId ? '(Selected)' : ''}
              </li>
            ))}
          </ul>
          </>
        ) : (
          <p>No hex selected</p>
        )}
        <p>Order: {selectedUnitId && orders.blue[selectedUnitId] ? `Move to [${orders.blue[selectedUnitId].dest}]` : 'None'}</p>
        <button onClick={() => onEndTurn('blue')} disabled={currentPlayer !== 'blue'}>
          End Turn
        </button>
      </div>

      <div style={{ width: '1000px', height: '800px', background: '#ccc' }}>
        {children} {/* Map goes here */}
      </div>

      <div style={{ width: '200px', background: '#fbb', padding: '10px' }}>
        <h3>Red Player</h3>
        <p>Turn: {turn} {currentPlayer === 'red' ? '(Active)' : ''}</p>
        {selectedHex ? (
          <>
          <p>Selected Hex: [{selectedHex[0]}, {selectedHex[1]}]</p>
          <p>Units:</p>
          <ul style={{ paddingLeft: '20px' }}>
            {selectedHexUnits.map(unit => (
              <li
                key={unit.id}
                onClick={() => onUnitSelect(unit.id)}
                style={{
                  cursor: 'pointer',
                  fontWeight: unit.id === selectedUnitId ? 'bold' : 'normal',
                  color: unit.id === selectedUnitId ? '#f00' : '#000',
                }}
              >
                {unit.name} {unit.id === selectedUnitId ? '(Selected)' : ''}
              </li>
            ))}
          </ul>
          </>
        ) : (
          <p>No hex selected</p>
        )}
        <p>Order: {selectedUnitId && orders.red[selectedUnitId] ? `Move to [${orders.red[selectedUnitId].dest}]` : 'None'}</p>
        <button onClick={() => onEndTurn('red')} disabled={currentPlayer !== 'red'}>
          End Turn
        </button>
      </div>
    </div>
  );
}

export default Frame;