// src/components/Frame.jsx
import React from 'react';
import './Frame.css';

function Frame({ hexes, units, turn, currentPlayer, orders, selectedHex, selectedUnitId, notifications, onEndTurn, onUnitSelect, onConfirmAttack, children }) {
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
              {selectedHexUnits.map(unit => (
                <li
                  key={unit.id}
                  onClick={() => onUnitSelect(unit.id)}
                  className={`unit-item ${unit.id === selectedUnitId ? (isBlue ? 'unit-item-selected-blue' : 'unit-item-selected-red') : ''}`}
                >
                  <span>
                    {unit.name} {unit.id === selectedUnitId ? '(Selected)' : ''}
                    <br />
                    <small className="unit-details">
                      {unit.type === 'infantry' ? 'Infantry' : 'Cavalry'} - {unit.men || 0} Men, {unit.cannons || 0} Cannons, {unit.horses || 0} Horses
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </React.Fragment>
        ) : (
            <p className="sidebar-text">No hex selected</p>
          )}
        <p className="sidebar-text">Order: {getOrderText()}</p>
        {pendingAttack && targetUnit && (
          <div className="notification-section">
            <p className="sidebar-text">Confirm Attack on {targetUnit.name}?</p>
            <button
              onClick={() => onConfirmAttack(selectedUnitId, targetUnit.id)}
              className={buttonClass}
            >
              Confirm
            </button>
          </div>
        )}
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
      </div>
      <div className="map-area">
        {children}
      </div>
    </div>
  );
}

export default Frame;