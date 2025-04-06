// /games/campaigns-of-napoleon/Rules.js
import { hexDistance } from '../../utils/hexGrid';

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

export function resolveCombat(state, combats) {
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
      const defenderStands = !defenderOrder || defenderOrder.type === 'stand';
      const defenderAttacksBack = defenderOrder ?.type === 'attack' && defenderOrder.targetId === attackerId;

      if (stillAdjacent && (defenderStands || defenderAttacksBack)) {
        const coinFlip = Math.random() < 0.5;
        if (coinFlip) {
          defender.men = 0;
          notifications.push(`Your unit ${defender.name} was destroyed by ${attacker.name}`);
          notifications.push(`${attacker.name} defeated ${defender.name}`);
        } else {
          attacker.men = 0;
          notifications.push(`Your unit ${attacker.name} was destroyed by ${defender.name}`);
          notifications.push(`${defender.name} defeated ${attacker.name}`);
        }
      } else if (attacker.pendingAttack) {
        notifications.push(`Attack by ${attacker.name} missed—${defender.name} moved away`);
      }
    }
  });

  updatedUnits = updatedUnits.filter(u => u.men > 0);
  return { updatedUnits, notifications };
}