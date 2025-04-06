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

  endTurn(player) {
    if (player !== this.state.currentPlayer) return false;
    if (this.state.currentPlayer === 'blue') {
      this.state.currentPlayer = 'red';
      return true;
    } else {
      this.resolveTurn();
      this.state.currentPlayer = 'blue';
      this.state.turn += 1;
      this.state.orders = { blue: {}, red: {} };
      this.state.notifications = [];
      return true;
    }
  }

  resolveTurn(resolveCombatCallback) {
    let newHexes = this.state.hexes.map(h => ({ ...h, units: [...h.units] }));

    // Resolve movement first
    ['blue', 'red'].forEach(team => {
      Object.entries(this.state.orders[team]).forEach(([unitId, order]) => {
        if (order.type === 'move') {
          const oldHex = newHexes.find(h => h.units.includes(unitId));
          const newHex = newHexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
          if (oldHex && newHex) {
            oldHex.units = oldHex.units.filter(id => id !== unitId);
            newHex.units.push(unitId);
            const unit = this.state.units.find(u => u.id === unitId);
            unit.position = order.dest;
          }
        } else if (order.type === 'attack') {
          const unit = this.state.units.find(u => u.id === unitId);
          unit.pendingAttack = order.targetId;
        }
      });
    });
    this.state.hexes = newHexes;

    // Resolve combat after movement
    if (resolveCombatCallback) {
      const { updatedUnits, notifications } = resolveCombatCallback(this.state);
      this.state.units = updatedUnits;
      this.state.notifications = notifications;
      this.state.hexes = this.state.hexes.map(h => ({
        ...h,
        units: h.units.filter(id => this.state.units.some(u => u.id === id)),
      }));
    }

    this.state.units.forEach(u => delete u.pendingAttack);
  }

  getState() {
    return { ...this.state };
  }
}

export default WaterlooEngine;