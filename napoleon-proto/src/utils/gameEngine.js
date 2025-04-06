export function executeOrders(orders, hexes, units) {
  let updatedHexes = hexes.map(h => ({ ...h, units: [...h.units] }));

  ['blue', 'red'].forEach(team => {
    Object.entries(orders[team]).forEach(([unitId, order]) => {
      if (order.type === 'move') {
        const currentHex = updatedHexes.find(h => h.units.includes(unitId));
        const destHex = updatedHexes.find(h => h.q === order.dest[0] && h.r === order.dest[1]);
        if (currentHex && destHex) {
          currentHex.units = currentHex.units.filter(id => id !== unitId);
          destHex.units.push(unitId);
        }
      }
    });
  });

  return updatedHexes;
}