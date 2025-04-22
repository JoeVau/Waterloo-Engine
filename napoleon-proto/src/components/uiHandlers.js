import { validateOrder } from '../games/campaigns-of-napoleon/orders';
import { resolveCombat } from '../games/campaigns-of-napoleon/resolutions';

export const handleClick = (e, gameState, engine, setGameState, getHexAtPosition, Map, zoom, offset) => {
    const canvas = e.currentTarget;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedHex = getHexAtPosition(x, y, gameState.hexes, Map.hexWidth, Map.hexHeight, zoom, offset);
    if (!clickedHex) return;

    setGameState(prev => {
        if (prev.selectedHex && clickedHex.q === prev.selectedHex[0] && clickedHex.r === prev.selectedHex[1]) {
            engine.state.orders[prev.currentPlayer] = {};
            return { ...prev, selectedHex: null, selectedUnitId: null };
        }

        if (!prev.selectedUnitId) {
            return { ...prev, selectedHex: [clickedHex.q, clickedHex.r] };
        }

        const unit = prev.units.find(u => u.id === prev.selectedUnitId);
        if (unit && unit.team === prev.currentPlayer) {
            const targetUnit = clickedHex.units
                .map(id => prev.units.find(u => u.id === id))
                .find(u => u.team !== unit.team);

            const success = engine.issueOrder(prev.selectedUnitId, 'move', { dest: [clickedHex.q, clickedHex.r] }, validateOrder);
            if (success) {
                if (targetUnit) {
                    console.log(`Combat triggered: ${unit.id} moves to [${clickedHex.q}, ${clickedHex.r}] and engages ${targetUnit.id}`);
                } else {
                    console.log(`Move order issued for ${prev.selectedUnitId} to [${clickedHex.q}, ${clickedHex.r}]`);
                }
                engine.state.orders[prev.currentPlayer] = engine.state.orders[prev.currentPlayer] || {};
                engine.state.orders[prev.currentPlayer][prev.selectedUnitId] = { type: 'move', dest: [clickedHex.q, clickedHex.r] };
                return { ...engine.getState(), selectedUnitId: null, selectedHex: null };
            } else {
                console.log(`Move order failed for ${prev.selectedUnitId} to [${clickedHex.q}, ${clickedHex.r}]`);
            }
        }
        return prev;
    });
};

export const handleUnitSelect = (unitId, gameState, engine, setGameState, paintMode) => {
    if (paintMode) return;
    setGameState(prev => {
        const unit = prev.units.find(u => u.id === unitId);
        if (unit && unit.team === prev.currentPlayer && !prev.orders[unit.team][unitId]) {
            engine.state.orders[unit.team][unitId] = null;
            return { ...prev, selectedUnitId: unitId };
        }
        return prev;
    });
};

export const handleScoutOrder = (unitId, gameState, engine, setGameState, paintMode) => {
    if (paintMode) return;
    const unit = gameState.units.find(u => u.id === unitId);
    if (!unit || unit.team !== gameState.currentPlayer) return;

    const success = engine.issueOrder(unitId, 'scout', {}, validateOrder);
    if (success) {
        console.log(`Scout order issued for ${unitId}`);
        setGameState(prev => ({
            ...engine.getState(),
            selectedUnitId: null,
            selectedHex: null,
        }));
    } else {
        console.log(`Scout order failed for ${unitId}`);
    }
};

export const handleDeselect = (gameState, engine, setGameState, paintMode) => {
    if (paintMode) return;
    setGameState(prev => {
        if (prev.selectedUnitId) {
            engine.state.orders[prev.currentPlayer] = {};
            return { ...prev, selectedUnitId: null, selectedHex: null };
        }
        return prev;
    });
};

export const handleEndTurn = (player, gameState, engine, setGameState, resolveCombat) => {
    if (player !== gameState.currentPlayer) return;
    console.log(`Ending turn for ${player}`);
    engine.endTurn(player, resolveCombat);
    const newState = engine.getState();
    console.log('New game state after endTurn:', newState);
    console.log('Notifications after endTurn:', newState.notifications);
    setGameState(newState);
};

export const clearNotifications = (engine, setGameState) => {
    engine.state.notifications = { red: [], blue: [] };
    setGameState(prev => ({ ...prev, notifications: { red: [], blue: [] } }));
};

export const toggleFogOfWar = (setFogOfWar) => {
    setFogOfWar(prev => {
        const newFogOfWar = !prev;
        console.log(`Fog of war toggled to: ${newFogOfWar}`);
        return newFogOfWar;
    });
};