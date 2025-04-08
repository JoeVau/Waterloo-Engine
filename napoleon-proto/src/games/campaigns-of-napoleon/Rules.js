// /games/campaigns-of-napoleon/Rules.js
import { hexDistance } from '../../utils/hexGrid';
import { getCombatResult } from './combatResults';

export function validateOrder(state, unitId, orderType, params) {
  const unit = state.units.find(u => u.id === unitId);
  const unitHex = state.hexes.find(h => h.units.includes(unitId));

  switch (orderType) {
    case 'move':
      const { dest } = params;
      const destHex = state.hexes.find(h => h.q === dest[0] && h.r === dest[1]);
      return destHex && hexDistance(unitHex.q, unitHex.r, dest[0], dest[1]) <= 2;
    case 'attack':
      const { targetId } = params;
      const target = state.units.find(u => u.id === targetId);
      const targetHex = state.hexes.find(h => h.units.includes(targetId));
      return (
        target &&
        target.team !== unit.team &&
        targetHex &&
        hexDistance(unitHex.q, unitHex.r, targetHex.q, targetHex.r) === 1
      );
    default:
      return false;
  }
}

function retreatUnit(unit, enemyHex, hexes, notifications) {
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
    notifications.push(`${unit.name} retreated to [${retreatHex.q}, ${retreatHex.r}]`);
  } else {
    console.log(`${unit.name} had nowhere to retreat—holding position`);
    notifications.push(`${unit.name} had nowhere to retreat—holding position`);
  }
}

export function resolveCombat(state, combats) {
  console.log('Resolving combat with combats:', combats);
  let updatedUnits = [...state.units];
  const notifications = [];

  combats.forEach(({ attackerId, defenderId }) => {
    const attacker = updatedUnits.find(u => u.id === attackerId);
    const defender = updatedUnits.find(u => u.id === defenderId);
    if (attacker && defender) {
      const attackerHex = state.hexes.find(h => h.units.includes(attacker.id));
      const defenderHex = state.hexes.find(h => h.units.includes(defender.id));
      const stillAdjacent = hexDistance(attackerHex.q, attackerHex.r, defenderHex.q, defenderHex.r) === 1;

      const defenderOrder = state.orders[defender.team] ?.[defender.id];
      const defenderStands = !defenderOrder || defenderOrder === null;
      const defenderAttacksBack = defenderOrder ?.type === 'attack' && defenderOrder.targetId === attackerId;

      if (stillAdjacent && (defenderStands || defenderAttacksBack)) {
        const result = getCombatResult(attacker, defender);
        switch (result) {
          case "AE":
            attacker.strength = 0;
            notifications.push(`Your unit ${attacker.name} was eliminated by ${defender.name}`);
            break;
          case "AR":
            attacker.strength = Math.floor(attacker.strength * 0.5);
            notifications.push(`${attacker.name} retreated from ${defender.name} with ${attacker.strength} strength remaining`);
            retreatUnit(attacker, defenderHex, state.hexes, notifications);
            break;
          case "DR":
            defender.strength = Math.floor(defender.strength * 0.5);
            notifications.push(`${defender.name} retreated from ${attacker.name} with ${defender.strength} strength remaining`);
            retreatUnit(defender, attackerHex, state.hexes, notifications);
            break;
          case "DE":
            defender.strength = 0;
            notifications.push(`Your unit ${defender.name} was eliminated by ${attacker.name}`);
            break;
          case "NE":
            notifications.push(`Combat between ${attacker.name} and ${defender.name} had no effect`);
            break;
          default:
            console.warn(`Unknown combat result: ${result}`);
            notifications.push(`Combat between ${attacker.name} and ${defender.name} unresolved`);
        }
      } else if (state.orders[state.currentPlayer] ?.[attackerId] ?.type === 'attack') {
        notifications.push(`Attack by ${attacker.name} missed—${defender.name} moved away`);
      }
    }
  });

  updatedUnits = updatedUnits.filter(u => u.strength > 0);
  return { updatedUnits, notifications };
}

export default resolveCombat;