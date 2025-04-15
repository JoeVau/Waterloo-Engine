import { hexDistance } from '../../utils/hexGrid';

export function validateOrder(state, unitId, orderType, params) {
    const unit = state.units.find(u => u.id === unitId);
    const unitHex = state.hexes.find(h => h.units.includes(unitId));

    switch (orderType) {
        case 'move':
            const { dest, forceMarch } = params;
            const destHex = state.hexes.find(h => h.q === dest[0] && h.r === dest[1]);
            if (!destHex) return false;
            const maxRange = unit.cavalry ? 15 : (forceMarch ? 10 : 5);
            const distance = hexDistance(unitHex.q, unitHex.r, destHex.q, destHex.r);
            return distance <= maxRange;
        case 'attack':
            const { targetId } = params;
            const target = state.units.find(u => u.id === targetId);
            const targetHex = state.hexes.find(h => h.units.includes(targetId));
            return (
                target &&
                target.team !== unit.team &&
                targetHex &&
                hexDistance(unitHex.q, unitHex.r, targetHex.q, targetHex.r) <= 1
            );
        case 'scout':
            if (unit.hq || !unit.brigades) return false;
            const availableBrigade = unit.brigades.find(b => !b.order);
            const availableStrength = unit.strength - (unit.detachedStrength || 0);
            const brigadeStrength = unit.strength / 2;
            return availableBrigade && availableStrength >= brigadeStrength;
        case 'rest':
            return !state.orders[state.currentPlayer][unitId];
        default:
            return false;
    }
}

export const orderRegistry = {
    move: {
        validate: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            const unitHex = state.hexes.find(h => h.units.includes(unitId));
            const { dest, forceMarch } = params;
            const destHex = state.hexes.find(h => h.q === dest[0] && h.r === dest[1]);
            if (!destHex) return false;
            const maxRange = unit.cavalry ? config.orders.move.cavalry : (forceMarch ? config.orders.move.forceMarch : config.orders.move.infantry);
            const distance = hexDistance(unitHex.q, unitHex.r, destHex.q, destHex.r);
            return distance <= maxRange;
        },
        apply: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            if (params.forceMarch) {
                unit.exhaustion = (unit.exhaustion || 0) + config.effects.exhaustion.forceMarch;
            }
            state.orders[state.currentPlayer][unitId] = { type: 'move', ...params };
        }
    },
    attack: {
        validate: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            const unitHex = state.hexes.find(h => h.units.includes(unitId));
            const { targetId } = params;
            const target = state.units.find(u => u.id === targetId);
            const targetHex = state.hexes.find(h => h.units.includes(targetId));
            return (
                target &&
                target.team !== unit.team &&
                targetHex &&
                hexDistance(unitHex.q, unitHex.r, targetHex.q, targetHex.r) <= config.orders.attack.range
            );
        },
        apply: (state, unitId, params) => {
            state.orders[state.currentPlayer][unitId] = { type: 'attack', ...params };
        }
    },
    scout: {
        validate: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            if (unit.hq || !unit.brigades) return false;
            const availableBrigade = unit.brigades.find(b => !b.order);
            const availableStrength = unit.strength - (unit.detachedStrength || 0);
            const brigadeStrength = unit.strength / config.division.brigades;
            return availableBrigade && availableStrength >= brigadeStrength;
        },
        apply: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            const brigade = unit.brigades.find(b => !b.order);
            const brigadeStrength = unit.strength / config.division.brigades;

            const detachment = {
                id: `${unitId}_scout_${state.turn}`,
                name: `${brigade.name} Scouts`,
                team: unit.team,
                position: [...unit.position],
                strength: brigadeStrength,
                divisionId: unitId,
                brigadeId: brigade.id,
                order: 'scout',
                returnTurn: state.turn + config.orders.scout.returnTurns
            };

            state.units.push(detachment);
            state.hexes.find(h => h.q === unit.position[0] && h.r === unit.position[1]).units.push(detachment.id);
            unit.detachedStrength = (unit.detachedStrength || 0) + brigadeStrength;
            brigade.order = 'scout';
            brigade.detachmentId = detachment.id;
            console.log(`Detached scouting brigade ${brigade.name} from ${unit.name}: ${brigadeStrength} strength at [${unit.position}]`);
            state.orders[state.currentPlayer][unitId] = { type: 'scout', ...params };
        }
    },
    rest: {
        validate: (state, unitId, params, config) => {
            return !state.orders[state.currentPlayer][unitId];
        },
        apply: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            unit.exhaustion = 0;
            unit.strength = Math.round(unit.strength * (1 + config.effects.rest.strength));
            unit.rest = { expires: state.turn + config.orders.rest.duration };
            state.orders[state.currentPlayer][unitId] = { type: 'rest', ...params };
        }
    }
};