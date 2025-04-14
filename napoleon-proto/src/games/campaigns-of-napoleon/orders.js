import { hexDistance } from '../../utils/hexGrid';

export const orderRegistry = {
    move: {
        validate: (state, unitId, params, config) => {
            const unit = state.units.find(u => u.id === unitId);
            const unitHex = state.hexes.find(h => h.units.includes(unitId));
            const { dest } = params;
            const destHex = state.hexes.find(h => h.q === dest[0] && h.r === dest[1]);
            return destHex && hexDistance(unitHex.q, unitHex.r, dest[0], dest[1]) <= config.orders.move.range;
        },
        apply: (state, unitId, params) => {
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
    }
};