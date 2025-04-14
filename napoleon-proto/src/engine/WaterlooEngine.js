import { orderRegistry } from '../games/campaigns-of-napoleon/orders';
import { resolutionPhases } from '../games/campaigns-of-napoleon/resolutions';
import { defaultConfig } from '../games/campaigns-of-napoleon/config/rules';

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
      config: defaultConfig,
    };
  }

  issueOrder(unitId, orderType, params, validateOrderCallback) {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.team !== this.state.currentPlayer || this.state.orders[unit.team][unitId]) return false;

    const order = orderRegistry[orderType];
    if (!order || !order.validate(this.state, unitId, params, this.state.config)) return false;

    order.apply(this.state, unitId, params, this.state.config);
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
      // Clear notifications after UI sync
      //this.state.notifications = [];
      return true;
    }
  }

  resolveTurn(resolveCombatCallback) {
    let newHexes = this.state.hexes.map(h => ({ ...h, units: [...h.units] }));
    let pendingCombats = [];
    let notifications = [];

    // Run resolution phases
    resolutionPhases.forEach(phase => {
      const result = phase(this.state, this.state.config, resolveCombatCallback, pendingCombats);
      if (result.updatedUnits) this.state.units = result.updatedUnits;
      if (result.notifications) notifications = [...notifications, ...result.notifications];
      if (result.updatedHexes) newHexes = result.updatedHexes;
      if (result.pendingCombats) pendingCombats = result.pendingCombats;
    });

    this.state.notifications = notifications;
    this.state.hexes = newHexes;
  }

  getState() {
    return { ...this.state };
  }
}

export default WaterlooEngine;