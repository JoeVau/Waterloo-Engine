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
    case 'fortify':
      return true;
    default:
      return false;
  }
}

export function resolveCombat(state) {
  let updatedUnits = [...state.units];
  const results = [];

  updatedUnits.forEach(attacker => {
    if (attacker.pendingAttack) {
      const defender = updatedUnits.find(u => u.id === attacker.pendingAttack);
      if (defender && defender.men > 0) {
        const dieRoll = Math.floor(Math.random() * 6) + 1;
        const attackStrength = attacker.men + dieRoll * 100;
        const defendStrength = defender.men + dieRoll * 100;

        let attackerLoss, defenderLoss;
        if (attackStrength > defendStrength) {
          attackerLoss = Math.floor(attacker.men * 0.05); // 5%
          defenderLoss = Math.floor(defender.men * 0.10); // 10%
          results.push(`${attacker.name} defeated ${defender.name}: ${defenderLoss} vs ${attackerLoss} men lost`);
        } else {
          attackerLoss = Math.floor(attacker.men * 0.10);
          defenderLoss = Math.floor(defender.men * 0.05);
          results.push(`${defender.name} repelled ${attacker.name}: ${attackerLoss} vs ${defenderLoss} men lost`);
        }

        attacker.men = Math.max(0, attacker.men - attackerLoss);
        defender.men = Math.max(0, defender.men - defenderLoss);
      }
    }
  });

  updatedUnits = updatedUnits.filter(u => u.men > 0); // Remove destroyed units
  return { updatedUnits, results };
}