// /engine/WaterlooEngine.js
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
      notifications: [],
    };
  }

  issueOrder(unitId, orderType, params, validateOrder) {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.team !== this.state.currentPlayer || this.state.orders[unit.team][unitId]) return false;

    const isValid = validateOrder(this.state, unitId, orderType, params);
    if (!isValid) return false;

    this.state.orders[unit.team][unitId] = { type: orderType, ...params };
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
      this.state.notifications = [];
      return true;
    }
  }

  resolveTurn(resolveCombatCallback) {
    let newHexes = this.state.hexes.map(h => ({ ...h, units: [...h.units] }));
    const pendingCombats = [];

    // Resolve movement first
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
        }
      });
    });

    // Resolve all combats
    if (resolveCombatCallback && pendingCombats.length > 0) {
      console.log('Pending combats:', pendingCombats);
      const { updatedUnits, notifications } = resolveCombatCallback(this.state, pendingCombats);
      this.state.units = updatedUnits;
      this.state.notifications = notifications;
      // Update hexes to reflect retreat changes
      this.state.hexes = newHexes.map(h => ({
        ...h,
        units: updatedUnits.filter(u => u.position[0] === h.q && u.position[1] === h.r).map(u => u.id),
      }));
    } else {
      this.state.hexes = newHexes; // Apply movement updates even if no combat
    }
  }

  getState() {
    return { ...this.state };
  }
}

export default WaterlooEngine;