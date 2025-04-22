import React from 'react';
import './Frame.css';

function UnitManagementSection({ hexes, units, currentPlayer, orders, selectedHex, selectedUnitId, onUnitSelect, handleScoutOrder, onDeselect, turn, isBlue, buttonClass }) {
    const selectedHexUnits = selectedHex
        ? units.filter(u => hexes.find(h => h.q === selectedHex[0] && h.r === selectedHex[1]) ?.units.includes(u.id) && !u.divisionId)
        : [];

    const getOrderText = (unitId) => {
        const unit = units.find(u => u.id === unitId);
        if (!unitId || !orders[currentPlayer][unitId]) {
            return 'Stand';
        }
        const order = orders[currentPlayer][unitId];
        if (order.type === 'move') return `Move to [${order.dest[0]}, ${order.dest[1]}]`;
        if (order.type === 'scout') return `Scouting until turn ${turn + 1}`;
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

    return (
        <React.Fragment>
            <p className="sidebar-text">Units:</p>
            <ul className="unit-list">
                {selectedHexUnits.map(unit => {
                    const totalStrength = unit.strength || 0;
                    const detachedStrength = unit.detachedStrength || 0;
                    const currentStrength = totalStrength - detachedStrength;
                    const fullStrength = unit.fullStrength || totalStrength || 1;
                    const stragglers = fullStrength - totalStrength;
                    const strengthPercentage = (currentStrength / fullStrength) * 100;
                    const stragglerPercentage = (stragglers / fullStrength) * 100;
                    const hasOrder = orders[currentPlayer] && orders[currentPlayer][unit.id];
                    const activeDetachments = units.filter(u => u.divisionId === unit.id && u.returnTurn > turn);
                    const hasDetachment = activeDetachments.length > 0;

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
                                    {hasDetachment && <span className="detachment-indicator">🔭</span>}
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
                                    {unit.type === 'cavalry' && (unit.horses || 0) >= (unit.strength || 0) ? 'Cavalry Division' : 'Infantry'}
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
                                    Effective Strength: {currentStrength} / {fullStrength} (Total: {totalStrength})
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
                    Skill: {getSkillStars(unit.skill)} |
                    LOS Boost: {unit.losBoost || 0}
                                    </small>
                                    {activeDetachments.length > 0 && (
                                        <div className="detachment-details">
                                            <p className="detachment-details-title">Active Detachments:</p>
                                            <ul className="detachment-list">
                                                {activeDetachments.map(detachment => (
                                                    <li key={detachment.id} className="detachment-item">
                                                        {detachment.name} | Strength: {detachment.strength} | Returns on Turn: {detachment.returnTurn}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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
                                        <button className={buttonClass} disabled>
                                            Forced March
                                        </button>
                                        <button className={buttonClass} disabled>
                                            Fortify
                                        </button>
                                        <button className={buttonClass} disabled>
                                            Forage
                                        </button>
                                        <button
                                            onClick={() => handleScoutOrder(selectedUnitId)}
                                            className={buttonClass}
                                            disabled={unit.horses <= 0}
                                        >
                                            Scouting
                                        </button>
                                        <button className={buttonClass} disabled>
                                            Screening
                                        </button>
                                        <button className={buttonClass} disabled>
                                            Pickets
                                        </button>
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
    );
}

export default UnitManagementSection;