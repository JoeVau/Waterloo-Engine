import { resolveDetachments } from '../games/campaigns-of-napoleon/Rules';

class WaterlooEngine {
  constructor(mapData) {
    const { hexes, units, features } = mapData;
    this.state = {
      turn: 1,
      currentPlayer: 'blue',
      hexes,
      units,
      features,
      orders: { blue: {}, red: {} },
      detachments: [],
      notifications: [],
    };
  }

  issueOrder(unitId, orderType, params, validateOrder) {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.team !== this.state.currentPlayer || this.state.orders[unit.team][unitId]) return false;

    const isValid = validateOrder(this.state, unitId, orderType, params);
    if (!isValid) return false;

    this.state.orders[unit.team][unitId] = { type: orderType, ...params };

    if (orderType === 'scout' && unit.horses > 0) {
      const detachmentStrength = unit.horses;
      const detachment = {
        id: `${unitId}_scout_${this.state.turn}`,
        name: `${unit.name} Scouts`,
        team: unit.team,
        position: [...unit.position],
        strength: detachmentStrength,
        horses: unit.horses,
        divisionId: unitId,
        order: 'scout',
        returnTurn: this.state.turn + 1,
      };
      this.state.detachments.push(detachment);
      this.state.units.push(detachment);
      this.state.hexes.find(h => h.q === unit.position[0] && h.r === unit.position[1]).units.push(detachment.id);
      unit.detachedStrength = (unit.detachedStrength || 0) + detachmentStrength;
      unit.horses = 0;
      console.log(`Detached scouting unit from ${unit.name}: ${detachmentStrength} strength, ${detachment.horses} horses at [${unit.position}]`);
    }

    return true;
  }

  endTurn(player, resolveCombatCallback) {
    if (player !== this.state.currentPlayer) return false;
    if (this.state.currentPlayer === 'blue') {
      this.state.currentPlayer = 'red';
      return true;
    } else {
      this.resolveTurn(resolveCombatCallback);
      this.state.currentPlayer = 'blue';
      this.state.turn += 1;
      this.state.orders = { blue: {}, red: {} };
      // Move notification clearing to after resolveTurn
      return true;
    }
  }

  resolveTurn(resolveCombatCallback) {
    let newHexes = this.state.hexes.map(h => ({ ...h, units: [...h.units] }));
    const pendingCombats = [];

    ['blue', 'red'].forEach(team => {
      Object.entries(this.state.orders[team] || {}).forEach(([unitId, order]) => {
        if (order && order.type === 'move') {
          const oldHex = newHexes.find(h => h.units.includes(unitId));
          const newHex = newHexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
          if (oldHex && newHex) {
            if (newHex.units.length > 0) {
              const defenderId = newHex.units[0];
              pendingCombats.push({ attackerId: unitId, defenderId });
            } else {
              oldHex.units = oldHex.units.filter(id => id !== unitId);
              newHex.units.push(unitId);
              const unit = this.state.units.find(u => u.id === unitId);
              unit.position = order.dest;
            }
          }
        } else if (order && order.type === 'attack') {
          pendingCombats.push({ attackerId: unitId, defenderId: order.targetId });
        } else if (order && order.type === 'scout') {
          // Handled by detachments
        }
      });
    });

    if (typeof resolveDetachments === 'function') {
      const { updatedUnits: detachmentUnits, notifications: detachmentNotes } = resolveDetachments(this.state);
      this.state.units = detachmentUnits;
      this.state.notifications.push(...detachmentNotes);
      newHexes = newHexes.map(h => ({
        ...h,
        units: detachmentUnits.filter(u => u.position[0] === h.q && u.position[1] === h.r).map(u => u.id),
      }));
    }

    if (resolveCombatCallback && pendingCombats.length > 0) {
      console.log('Pending combats:', pendingCombats);
      const { updatedUnits, notifications } = resolveCombatCallback(this.state, pendingCombats);
      this.state.units = updatedUnits;
      this.state.notifications.push(...notifications);
      newHexes = newHexes.map(h => ({
        ...h,
        units: updatedUnits.filter(u => u.position[0] === h.q && u.position[1] === h.r).map(u => u.id),
      }));
    }

    this.state.hexes = newHexes;
    // Reset losBoost for all divisions
    /*
    this.state.units.forEach(unit => {
      if (!unit.order) unit.losBoost = null; // Only reset for divisions, not detachments
    });*/
  }

  getState() {
    return { ...this.state };
  }
}

export default WaterlooEngine;