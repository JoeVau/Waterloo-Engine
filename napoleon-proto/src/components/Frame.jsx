// src/components/Frame.jsx
import React, { useState, useEffect } from 'react';
import './Frame.css';

function Frame({ hexes, units, turn, currentPlayer, orders, selectedHex, selectedUnitId, notifications, onEndTurn, onUnitSelect, onDeselect, toggleFogOfWar, fogOfWar, onScoutOrder, children }) {
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isNotificationWindowOpen, setIsNotificationWindowOpen] = useState(false);
  const [lastTurn, setLastTurn] = useState(turn);

  const selectedHexUnits = selectedHex
    ? units.filter(u => hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.units.includes(u.id))
    : [];

  const isBlue = currentPlayer === 'blue';
  const sidebarClass = `sidebar ${isBlue ? 'sidebar-blue' : 'sidebar-red'}`;
  const buttonClass = `end-turn-button ${isBlue ? '' : 'end-turn-button-red'}`;

  useEffect(() => {
    console.log(`Turn: ${turn}, Last Turn: ${lastTurn}, Notifications:`, notifications);
    if (turn !== lastTurn && notifications.length > 0) {
      console.log('Opening notification window');
      setIsNotificationWindowOpen(true);
      setLastTurn(turn);
    }
  }, [turn, notifications, lastTurn]);

  const getOrderText = (unitId) => {
    if (!unitId || !orders[currentPlayer][unitId]) return 'Stand';
    const order = orders[currentPlayer][unitId];
    if (order.type === 'move') return `Move to [${order.dest[0]}, ${order.dest[1]}]`;
    if (order.type === 'scout') return `Scouting (Returns Turn ${turn + 1})`;
    return 'Unknown Order';
  };

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

  const getSkillStars = (skill) => {
    const stars = '⭐'.repeat(skill || 0);
    return stars || 'No Skill';
  };

  const closeNotificationWindow = () => {
    setIsNotificationWindowOpen(false);
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
                const currentStrength = unit.strength - (unit.detachedStrength || 0);
                const fullStrength = unit.strength || 1;
                const stragglers = fullStrength - currentStrength;
                const strengthPercentage = (currentStrength / fullStrength) * 100;
                const stragglerPercentage = (stragglers / fullStrength) * 100;
                const hasOrder = orders[currentPlayer] && orders[currentPlayer][unit.id];

                return (
                  <li
                    key={unit.id}
                    onClick={() => onUnitSelect(unit.id)}
                    className={`unit-item ${unit.id === selectedUnitId ? (isBlue ? 'unit-item-selected-blue' : 'unit-item-selected-red') : ''}`}
                  >
                    <div className="unit-top-row">
                      <img
                        src={getFlagImage(unit.team)}
                        alt={`${unit.team} flag`}
                        className="unit-flag"
                        onError={(e) => (e.target.src = '/assets/grass.png')}
                      />
                      <span>
                        {unit.name} {unit.id === selectedUnitId ? '(Selected)' : ''}
                        {hasOrder && <span className="order-indicator">📜</span>}
                      </span>
                    </div>
                    {unit.leader ? (
                      <div className="unit-leader-section">
                        <img
                          src={unit.leaderPortrait || '/assets/leader.jpg'}
                          alt={`${unit.leader || 'Leader'} portrait`}
                          className="unit-leader-portrait"
                          onError={(e) => (e.target.src = '/assets/leader.jpg')}
                        />
                        <small className="unit-details">Led by {unit.leader}</small>
                      </div>
                    ) : (
                        <small className="unit-details">No Leader</small>
                      )}
                    <div className="unit-type-section">
                      <small className="unit-details">
                        {unit.type === 'cavalry' && (unit.horses || 0) >= (unit.strength - (unit.detachedStrength || 0)) ? 'Cavalry Division' : 'Infantry'}
                      </small>
                      <div className={`nato-symbol nato-infantry`}>
                        <div className="nato-diagonal nato-diagonal-1"></div>
                        {unit.type === 'infantry' && <div className="nato-diagonal nato-diagonal-2"></div>}
                      </div>
                    </div>
                    <div className="unit-strength-section">
                      <div className="unit-strength-bar">
                        <div
                          className="unit-strength-fill"
                          style={{
                            width: `${strengthPercentage}%`,
                            backgroundColor: unit.team === 'blue' ? '#007bff' : '#dc3545',
                          }}
                        />
                        <div
                          className="unit-straggler-fill"
                          style={{
                            width: `${stragglerPercentage}%`,
                            backgroundColor: unit.team === 'blue' ? 'rgba(0, 123, 255, 0.3)' : 'rgba(220, 53, 69, 0.3)',
                          }}
                        />
                      </div>
                      <small className="unit-details">
                        Strength: {currentStrength} / {fullStrength} (Detached: {unit.detachedStrength || 0})
                      </small>
                    </div>
                    {unit.id === selectedUnitId && (
                      <div className="unit-expanded-view">
                        <small className="unit-details">
                          {unit.type === 'cavalry' && (unit.horses || 0) >= (unit.strength || 0) ? 'Cavalry Division' : 'Infantry'} |
                          Horses: {unit.horses || 0} |
                          Guns: {unit.guns || 0} |
                          Fatigue: {unit.fatigue || 0}% |
                          Supplies: {unit.supplies || 0}% |
                          Skill: {getSkillStars(unit.skill)}
                        </small>
                      </div>
                    )}
                    {unit.id === selectedUnitId && (
                      <div className="unit-orders-section">
                        <p className="sidebar-text">Orders for Selected Unit:</p>
                        <p className="sidebar-text">{getOrderText(unit.id)}</p>
                        <div className="unit-orders-buttons">
                          <button
                            onClick={() => onUnitSelect(selectedUnitId)}
                            className={buttonClass}
                          >
                            Move
                          </button>
                          <button className={buttonClass} disabled>Forced March</button>
                          <button className={buttonClass} disabled>Fortify</button>
                          <button className={buttonClass} disabled>Forage</button>
                          <button
                            onClick={() => onScoutOrder(selectedUnitId)}
                            className={buttonClass}
                          >
                            Scout
                          </button>
                          <button className={buttonClass} disabled>Screening</button>
                          <button className={buttonClass} disabled>Pickets</button>
                          <button
                            onClick={onDeselect}
                            className={buttonClass}
                          >
                            Deselect
                          </button>
                        </div>
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
        {isNotificationWindowOpen && notifications.length > 0 && (
          <div className="notification-window">
            <div className="notification-window-content">
              <h3 className="notification-window-title">Turn {turn} Notifications</h3>
              <ul className="notification-list">
                {notifications.map((note, index) => (
                  <li key={index} className="notification-item">{note}</li>
                ))}
              </ul>
              <button
                onClick={closeNotificationWindow}
                className="notification-close-button"
              >
                Close
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => onEndTurn(currentPlayer)}
          className={buttonClass}
        >
          End Turn
        </button>
        <div className="debug-section">
          <button
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            className="debug-toggle-button"
          >
            {isDebugOpen ? 'Hide Debug' : 'Show Debug'}
          </button>
          {isDebugOpen && (
            <div className="debug-content">
              <button
                onClick={toggleFogOfWar}
                className={buttonClass}
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