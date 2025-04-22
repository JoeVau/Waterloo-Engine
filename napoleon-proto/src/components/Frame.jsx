import React, { useState } from 'react';
import PlayerInfoSection from './PlayerInfoSection';
import UnitManagementSection from './UnitManagementSection';
import DebugPanel from './DebugPanel';
import './Frame.css';

function Frame({ hexes, units, turn, currentPlayer, orders, selectedHex, selectedUnitId, notifications, onEndTurn, onUnitSelect, onDeselect, toggleFogOfWar, fogOfWar, clearNotifications, handleScoutOrder, zoom, offset, updateGameState, paintMode, setPaintMode, paintTerrainType, setPaintTerrainType, paintHeightType, setPaintHeightType, children }) {
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  const isBlue = currentPlayer === 'blue';
  const sidebarClass = `sidebar ${isBlue ? 'sidebar-blue' : 'sidebar-red'}`;
  const buttonClass = `end-turn-button ${isBlue ? '' : 'end-turn-button-red'}`;

  // Select player-specific notifications based on currentPlayer
  const playerNotifications = currentPlayer === 'blue' ? notifications.blue : notifications.red;

  const handleClearNotificationsWrapper = () => {
    if (clearNotifications) clearNotifications();
  };

  return (
    <div className="frame-container">
      <div className={sidebarClass}>
        <PlayerInfoSection
          currentPlayer={currentPlayer}
          turn={turn}
          selectedHex={selectedHex}
          isBlue={isBlue}
        />
        {selectedHex && (
          <UnitManagementSection
            hexes={hexes}
            units={units}
            currentPlayer={currentPlayer}
            orders={orders}
            selectedHex={selectedHex}
            selectedUnitId={selectedUnitId}
            onUnitSelect={onUnitSelect}
            handleScoutOrder={handleScoutOrder}
            onDeselect={onDeselect}
            turn={turn}
            isBlue={isBlue}
            buttonClass={buttonClass}
          />
        )}
        <div className="notification-section">
          <h3 className="notification-section-title">Notifications</h3>
          {playerNotifications && playerNotifications.length > 0 ? (
            <React.Fragment>
              <ul className="notification-list">
                {playerNotifications.map((note, index) => (
                  <li key={index} className="notification-item">
                    {note.includes('retreated') || note.includes('eliminated') ? (
                      <span className="notification-item-icon">⚔️</span>
                    ) : note.includes('scouting detachment returned') ? (
                      <span className="notification-item-icon">🔭</span>
                    ) : null}
                    Turn {turn}: {note}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleClearNotificationsWrapper}
                className="notification-clear-button"
              >
                Clear Notifications
              </button>
            </React.Fragment>
          ) : (
              <p className="sidebar-text">No new notifications</p>
            )}
        </div>
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
            <DebugPanel
              hexes={hexes}
              units={units}
              selectedHex={selectedHex}
              currentPlayer={currentPlayer}
              fogOfWar={fogOfWar}
              toggleFogOfWar={toggleFogOfWar}
              updateGameState={updateGameState}
              paintMode={paintMode}
              setPaintMode={setPaintMode}
              paintTerrainType={paintTerrainType}
              setPaintTerrainType={setPaintTerrainType}
              paintHeightType={paintHeightType}
              setPaintHeightType={setPaintHeightType}
            />
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