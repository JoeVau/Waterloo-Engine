import React from 'react';

function Frame({ hexes, units, turn, currentPlayer, orders, selectedHex, selectedUnitId, onEndTurn, onUnitSelect, children }) {
  const selectedHexUnits = selectedHex
    ? units.filter(u => hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.units.includes(u.id))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', fontFamily: "'Roboto', sans-serif" }}>
      <div
        style={{
          width: '20%',
          minWidth: '200px',
          background: currentPlayer === 'blue' ? 'linear-gradient(to bottom, #bbf, #99f)' : 'linear-gradient(to bottom, #fbb, #f99)',
          padding: '15px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          height: '800px',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', color: '#fff' }}>
          {currentPlayer === 'blue' ? 'Blue Player' : 'Red Player'}
        </h3>
        <p style={{ margin: '5px 0', color: '#fff' }}>Turn: {turn}</p>
        {selectedHex ? (
          <>
          <p style={{ margin: '5px 0', color: '#fff' }}>
            Selected Hex: [{selectedHex[0]}, {selectedHex[1]}]
            </p>
          <p style={{ margin: '5px 0', color: '#fff' }}>Units:</p>
          <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0' }}>
            {selectedHexUnits.map(unit => (
              <li
                key={unit.id}
                onClick={() => onUnitSelect(unit.id)}
                style={{
                  cursor: 'pointer',
                  padding: '5px',
                  margin: '2px 0',
                  backgroundColor: unit.id === selectedUnitId ? (currentPlayer === 'blue' ? 'rgba(0, 0, 255, 0.1)' : 'rgba(255, 0, 0, 0.1)') : 'transparent',
                  borderRadius: '4px',
                  color: '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {unit.name} {unit.id === selectedUnitId ? '(Selected)' : ''}
                  <br />
                  <small>
                    {unit.type === 'infantry' ? 'Infantry' : 'Cavalry'} - {unit.men || 0} Men, {unit.cannons || 0} Cannons, {unit.horses || 0} Horses
                    </small>
                </span>
              </li>
            ))}
          </ul>
          </>
        ) : (
          <p style={{ margin: '5px 0', color: '#fff' }}>No hex selected</p>
        )}
        <p style={{ margin: '5px 0', color: '#fff' }}>
          Order: {selectedUnitId && orders[currentPlayer][selectedUnitId] ? `Move to [${orders[currentPlayer][selectedUnitId].dest}]` : 'None'}
        </p>
        <button
          onClick={() => onEndTurn(currentPlayer)}
          style={{
            backgroundColor: currentPlayer === 'blue' ? '#007bff' : '#dc3545',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            color: '#fff',
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={e => (e.target.style.backgroundColor = currentPlayer === 'blue' ? '#0056b3' : '#b02a37')}
          onMouseLeave={e => (e.target.style.backgroundColor = currentPlayer === 'blue' ? '#007bff' : '#dc3545')}
        >
          End Turn
        </button>
      </div>

      <div style={{ width: '1000px', height: '800px', background: '#ccc' }}>
        {children}
      </div>
    </div>
  );
}

export default Frame;