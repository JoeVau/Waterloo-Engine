import React, { useState } from 'react';
import './Frame.css';

function Frame({ hexes, units, turn, currentPlayer, orders, selectedHex, selectedUnitId, notifications, onEndTurn, onUnitSelect, onConfirmAttack, toggleFogOfWar, fogOfWar, children }) {
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const selectedHexUnits = selectedHex
    ? units.filter(u => hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.units.includes(u.id))
    : [];

  const isBlue = currentPlayer === 'blue';
  const sidebarClass = `sidebar ${isBlue ? 'sidebar-blue' : 'sidebar-red'}`;
  const buttonClass = `end-turn-button ${isBlue ? '' : 'end-turn-button-red'}`;

  const getOrderText = () => {
    if (!selectedUnitId || !orders[currentPlayer][selectedUnitId]) return 'Stand';
    const order = orders[currentPlayer][selectedUnitId];
    if (order.type === 'move') return 'Move to [' + order.dest + ']';
    const targetUnit = units.find(u => u.id === order.targetId);
    return 'Attack ' + (targetUnit ? targetUnit.name : 'Unknown');
  };

  const pendingAttack = selectedUnitId && selectedHex && !orders[currentPlayer][selectedUnitId];
  const targetUnit = pendingAttack
    ? selectedHexUnits.find(u => u.team !== currentPlayer)
    : null;

  const getFlagImage = (faction) => {
    switch (faction) {
      case 'blue': return '/assets/french.jpg';
      case 'red': return '/assets/brit.jpg';
      case 'french': return '/assets/french.png';
      case 'british': return '/assets/british.png';
      case 'austrian': return '/assets/austrian.png';
      case 'russian': return '/assets/russian.png';
      case 'prussian': return '/assets/prussian.png';
      case 'bavarian': return '/assets/bavarian.png';
      default: return '/assets/grass.png';
    }
  };

  const getNatoSymbol = (type) => {
    switch (type) {
      case 'infantry': return 'X';
      case 'cavalry': return '/';
      default: return '';
    }
  };

  return (
    <div className="frame-container">
      <div className={sidebarClass}>
        <h3 className="sidebar-title">{isBlue ? 'Blue Player' : 'Red Player'}</h3>
        <p className="sidebar-text">Turn: {turn}</p>
        {selectedHex ? (
          <React.Fragment>
            <p className="sidebar-text">Selected Hex: [{selectedHex[0]}, {selectedHex[1]}]</p>
            <p className="sidebar-text">Units:</p>
            <ul className="unit-list">
              {selectedHexUnits.map(unit => {
                const currentStrength = unit.strength || 0;
                const fullStrength = unit.fullStrength || currentStrength || 1;
                const stragglers = fullStrength - currentStrength;
                const strengthPercentage = (currentStrength / fullStrength) * 100;
                const stragglerPercentage = (stragglers / fullStrength) * 100;

                return (
                  <li
                    key={unit.id}
                    onClick={() => onUnitSelect(unit.id)}
                    className={`unit-item ${unit.id === selectedUnitId ? (isBlue ? 'unit-item-selected-blue' : 'unit-item-selected-red') : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Flag Image */}
                      <img
                        src={getFlagImage(unit.team)}
                        alt={`${unit.team} flag`}
                        style={{ width: '16px', height: '16px', border: '1px solid #000' }}
                        onError={(e) => (e.target.src = '/assets/default.png')}
                      />
                      {/* Leader Portrait */}
                      <img
                        src={unit.leaderPortrait || '/assets/leader.jpg'}
                        alt={`${unit.leader || 'Leader'} portrait`}
                        style={{ width: '24px', height: '24px', border: '1px solid #000' }}
                        onError={(e) => (e.target.src = '/assets/leader.jpg')}
                      />
                      {/* Unit Info */}
                      <div style={{ flex: 1 }}>
                        <span>
                          {unit.name} {unit.id === selectedUnitId ? '(Selected)' : ''}
                          {' '}
                          <span style={{ fontSize: '0.8em', fontWeight: 'bold' }}>
                            {getNatoSymbol(unit.type)}
                          </span>
                        </span>
                        <br />
                        <small className="unit-details">
                          {unit.leader ? `Led by ${unit.leader}` : 'No Leader'} |
                          {unit.type === 'infantry' ? ' Infantry' : ' Cavalry'} |
                          Morale: {unit.stats ?.morale || 0}% |
                          Exp: {unit.stats ?.experience || 0}
                        </small>
                        {/* Strength Bar */}
                        <div style={{ marginTop: '5px', width: '100%', height: '8px', backgroundColor: '#ccc', borderRadius: '4px', position: 'relative' }}>
                          <div
                            style={{
                              width: `${strengthPercentage}%`,
                              height: '100%',
                              backgroundColor: unit.team === 'blue' ? '#007bff' : '#dc3545',
                              borderRadius: '4px',
                            }}
                          />
                          <div
                            style={{
                              width: `${stragglerPercentage}%`,
                              height: '100%',
                              backgroundColor: unit.team === 'blue' ? 'rgba(0, 123, 255, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                              position: 'absolute',
                              top: 0,
                              left: `${strengthPercentage}%`,
                              borderRadius: '4px',
                            }}
                          />
                        </div>
                        <small className="unit-details">
                          Strength: {currentStrength} / {fullStrength}
                        </small>
                      </div>
                    </div>
                    {unit.id === selectedUnitId && (
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => onUnitSelect(unit.id)}
                          className={buttonClass}
                          style={{ padding: '5px 10px', fontSize: '0.8em' }}
                        >
                          Move
                        </button>
                        {pendingAttack && targetUnit && (
                          <button
                            onClick={() => onConfirmAttack(selectedUnitId, targetUnit.id)}
                            className={buttonClass}
                            style={{ padding: '5px 10px', fontSize: '0.8em' }}
                          >
                            Attack
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </React.Fragment>
        ) : (
            <p className="sidebar-text">No hex selected</p>
          )}
        <p className="sidebar-text">Order: {getOrderText()}</p>
        {notifications.length > 0 && (
          <div className="notification-section">
            <p className="sidebar-text">Combat Results:</p>
            <ul className="notification-list">
              {notifications.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={() => onEndTurn(currentPlayer)}
          className={buttonClass}
        >
          End Turn
        </button>

        {/* Debug Section */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #fff', paddingTop: '10px' }}>
          <button
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            style={{
              backgroundColor: '#666',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              color: '#fff',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {isDebugOpen ? 'Hide Debug' : 'Show Debug'}
          </button>
          {isDebugOpen && (
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={toggleFogOfWar}
                className={buttonClass}
                style={{ width: '100%' }}
              >
                {fogOfWar ? 'Disable Fog of War' : 'Enable Fog of War'}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="map-area">
        {children}
      </div>
    </div>
  );
}

export default Frame;