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
      notifications: { red: [], blue: [] }, // Split by team
      config: defaultConfig,
    };
  }

  issueOrder(unitId, orderType, params, validateOrderCallback) {
    const unit = this.state.units.find(u => u.id === unitId);
    if (!unit || unit.team !== this.state.currentPlayer || this.state.orders[unit.team][unitId]) return false;

    const order = orderRegistry[orderType];
    if (!order || !validateOrderCallback(this.state, unitId, orderType, params)) return false;

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
      return true;
    }
  }

  resolveTurn(resolveCombatCallback) {
    let newHexes = this.state.hexes.map(h => ({ ...h, units: [...h.units] }));
    let updatedUnits = this.state.units.map(u => ({ ...u, position: [...u.position] }));
    let pendingCombats = [];
    let notifications = { red: [], blue: [] };

    // Run resolution phases
    resolutionPhases.forEach(phase => {
      const result = phase(this.state, this.state.config, resolveCombatCallback, pendingCombats);
      if (result.updatedUnits) updatedUnits = result.updatedUnits;
      if (result.notifications) {
        notifications.red = [...notifications.red, ...(result.notifications.red || [])];
        notifications.blue = [...notifications.blue, ...(result.notifications.blue || [])];
      }
      if (result.updatedHexes) newHexes = result.updatedHexes;
      if (result.pendingCombats) pendingCombats = result.pendingCombats;
      // Update state for next phase
      this.state.units = updatedUnits;
      this.state.hexes = newHexes;
    });

    this.state.units = updatedUnits;
    this.state.notifications = notifications;
    this.state.hexes = newHexes;
    this.state.orders = { blue: {}, red: {} }; // Flush orders
  }

  getState() {
    return { ...this.state };
  }
}

export default WaterlooEngine;