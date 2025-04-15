import { hexDistance } from '../../utils/hexGrid';
import { getCombatResult } from './combatResults';
import { applyEffects, getCombatModifiers } from './effects';

export function resolveMovement(state, config, resolveCombatCallback, pendingCombats = []) {
    let newHexes = state.hexes.map(h => ({ ...h, units: [...h.units] }));
    let updatedUnits = state.units.map(u => ({ ...u, position: [...u.position] }));
    const combats = [...pendingCombats];
    const notifications = { red: [], blue: [] };

    ['blue', 'red'].forEach(team => {
        Object.entries(state.orders[team] || {}).forEach(([unitId, order]) => {
            if (order && order.type === 'move') {
                const unit = updatedUnits.find(u => u.id === unitId);
                const oldHex = newHexes.find(h => h.units.includes(unitId));
                const newHex = newHexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
                if (oldHex && newHex && unit) {
                    if (newHex.units.length > 0) {
                        const defenderId = newHex.units[0];
                        combats.push({ attackerId: unitId, defenderId });
                    } else {
                        oldHex.units = oldHexes.filter(id => id !== unitId);
                        new wicht.units.push(unitId);
                        unit.position = [order.dest[0], order.dest[1]];
                        if (order.forceMarch) {
                            unit.exhaustion = (unit.exhaustion || 0) + config.effects.exhaustion.forceMarch;
                            notifications[team].push(`${unit.name} force marched to [${order.dest[0]}, ${order.dest[1]}]`);
                        } else {
                            notifications[team].push(`${unit.name} moved to [${order.dest[0]}, ${order.dest[1]}]`);
                        }
                    }
                }
            } else if (order && order.type === 'attack') {
                combats.push({ attackerId: unitId, defenderId: order.targetId });
            }
        });
    });

    return { updatedUnits, notifications, updatedHexes: newHexes, pendingCombats: combats };
}

export function resolveDetachments(state, config) {
    const notifications = { red: [], blue: [] };
    let updatedUnits = [...state.units];
    const activeDetachments = updatedUnits.filter(u => u.order === 'scout' && u.returnTurn <= state.turn);

    activeDetachments.forEach(detachment => {
        console.log("detachment fired");
        const division = updatedUnits.find(u => u.id === detachment.divisionId);
        if (division) {
            const brigade = division.brigades.find(b => b.detachmentId === detachment.id);
            if (brigade) {
                division.detachedStrength = (division.detachedStrength || 0) - detachment.strength;
                division.losBoost = config.orders.scout.boost;
                brigade.order = null;
                brigade.detachmentId = null;
                console.log(`${brigade.name} scouting detachment returned to ${division.name}: ${detachment.strength} strength, LOS boost set to ${division.losBoost}`);
                notifications[division.team].push(`${brigade.name} scouting detachment returned to ${division.name}—LOS boosted to ${config.orders.scout.boost} hexes this turn`);
                const detachmentHex = state.hexes.find(h => h.units.includes(detachment.id));
                if (detachmentHex) {
                    detachmentHex.units = detachmentHex.units.filter(id => id !== detachment.id);
                }
                updatedUnits = updatedUnits.filter(u => u.id !== detachment.id);
            }
        }
    });

    return { updatedUnits, notifications, updatedHexes: state.hexes };
}

export function resolveEffects(state, config) {
    const notifications = { red: [], blue: [] };
    let updatedUnits = [...state.units];

    updatedUnits.forEach(unit => {
        const result = applyEffects(unit, state, config);
        if (result.updated) {
            notifications[unit.team].push(result.notification);
        }
    });

    return { updatedUnits, notifications, updatedHexes: state.hexes };
}

export function resolveCombat(state, config, resolveCombatCallback, pendingCombats = []) {
    const notifications = { red: [], blue: [] };
    if (!pendingCombats || pendingCombats.length === 0) {
        return { updatedUnits: state.units, notifications, updatedHexes: state.hexes, pendingCombats: [] };
    }

    console.log('Resolving combat with combats:', pendingCombats);
    let updatedUnits = [...state.units];

    pendingCombats.forEach(({ attackerId, defenderId }) => {
        const attacker = updatedUnits.find(u => u.id === attackerId);
        const defender = updatedUnits.find(u => u.id === defenderId);
        if (attacker && defender) {
            const attackerHex = state.hexes.find(h => h.units.includes(attacker.id));
            const defenderHex = state.hexes.find(h => h.units.includes(defender.id));
            const stillAdjacent = attackerHex && defenderHex && hexDistance(attackerHex.q, attackerHex.r, defenderHex.q, defenderHex.r) === 1;

            if (stillAdjacent) {
                const effectiveAttackerStrength = attacker.strength - (attacker.detachedStrength || 0);
                const effectiveDefenderStrength = defender.strength - (defender.detachedStrength || 0);
                const attackerModifiers = getCombatModifiers(attacker, config);
                const defenderModifiers = getCombatModifiers(defender, config);
                const result = getCombatResult(
                    { ...attacker, strength: effectiveAttackerStrength },
                    { ...defender, strength: effectiveDefenderStrength },
                    config,
                    attackerModifiers,
                    defenderModifiers
                );
                switch (result) {
                    case "AE":
                        attacker.strength = 0;
                        notifications[attacker.team].push(`Your unit ${attacker.name} was eliminated by ${defender.name}`);
                        notifications[defender.team].push(`${defender.name} destroyed ${attacker.name}`);
                        break;
                    case "AR":
                        attacker.strength = Math.floor(attacker.strength * 0.5);
                        notifications[attacker.team].push(`${attacker.name} retreated from ${defender.name} with ${attacker.strength} strength remaining`);
                        notifications[defender.team].push(`${defender.name} drove back ${attacker.name}`);
                        retreatUnit(attacker, defenderHex, state.hexes, notifications[attacker.team]);
                        break;
                    case "DR":
                        defender.strength = Math.floor(defender.strength * 0.5);
                        notifications[defender.team].push(`${defender.name} retreated from ${attacker.name} with ${defender.strength} strength remaining`);
                        notifications[attacker.team].push(`${attacker.name} drove back ${defender.name}`);
                        retreatUnit(defender, attackerHex, state.hexes, notifications[defender.team]);
                        break;
                    case "DE":
                        defender.strength = 0;
                        notifications[defender.team].push(`Your unit ${defender.name} was eliminated by ${attacker.name}`);
                        notifications[attacker.team].push(`${attacker.name} destroyed ${defender.name}`);
                        break;
                    case "NE":
                        notifications.red.push(`Combat between ${attacker.name} and ${defender.name} had no effect`);
                        notifications.blue.push(`Combat between ${attacker.name} and ${defender.name} had no effect`);
                        break;
                    default:
                        console.warn(`Unknown combat result: ${result}`);
                        notifications.red.push(`Combat between ${attacker.name} and ${defender.name} unresolved`);
                        notifications.blue.push(`Combat between ${attacker.name} and ${defender.name} unresolved`);
                }
            } else {
                notifications.red.push(`Combat between ${attacker.name} and ${defender.name} avoided—units no longer adjacent`);
                notifications.blue.push(`Combat between ${attacker.name} and ${defender.name} avoided—units no longer adjacent`);
            }
        }
    });

    updatedUnits = updatedUnits.filter(u => u.strength > 0);
    const newHexes = state.hexes.map(h => ({
        ...h,
        units: updatedUnits.filter(u => u.position[0] === h.q && u.position[1] === h.r).map(u => u.id),
    }));

    return { updatedUnits, notifications, updatedHexes: newHexes, pendingCombats: [] };
}

function retreatUnit(unit, enemyHex, hexes, teamNotifications) {
    const currentHex = hexes.find(h => h.units.includes(unit.id));
    console.log(`Retreating ${unit.name} from [${currentHex.q}, ${currentHex.r}] away from enemy at [${enemyHex.q}, ${enemyHex.r}]`);

    const possibleRetreats = hexes.filter(h => {
        const distFromCurrent = hexDistance(currentHex.q, currentHex.r, h.q, h.r);
        const distFromEnemy = hexDistance(enemyHex.q, enemyHex.r, h.q, h.r);
        const isFarther = distFromEnemy > hexDistance(currentHex.q, currentHex.r, enemyHex.q, enemyHex.r);
        return distFromCurrent === 2 && isFarther && h.units.length === 0;
    });

    console.log(`Possible retreat hexes:`, possibleRetreats.map(h => `[${h.q}, ${h.r}]`));

    if (possibleRetreats.length > 0) {
        const retreatHex = possibleRetreats[Math.floor(Math.random() * possibleRetreats.length)];
        currentHex.units = currentHex.units.filter(id => id !== unit.id);
        retreatHex.units.push(unit.id);
        unit.position = [retreatHex.q, retreatHex.r];
        console.log(`${unit.name} retreated to [${retreatHex.q}, ${retreatHex.r}]`);
        teamNotifications.push(`${unit.name} retreated to [${retreatHex.q}, ${retreatHex.r}]`);
    } else {
        console.log(`${unit.name} had nowhere to retreat—holding position`);
        teamNotifications.push(`${unit.name} had nowhere to retreat—holding position`);
    }
}

export const resolutionPhases = [
    resolveMovement,
    resolveDetachments,
    resolveEffects,
    resolveCombat
];