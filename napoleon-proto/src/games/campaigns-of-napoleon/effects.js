export function getCombatModifiers(unit, config) {
    const exhaustion = unit.exhaustion || 0;
    return {
        skill: exhaustion * config.effects.exhaustion.skill // -1 per exhaustion point
    };
}

export function getLosModifiers(unit, config) {
    // Apply scout LOS if applicable
    if (unit.order === 'scout') {
        return config.orders.scout.los;
    }
    // Placeholder: Corps, HQ, picket bonuses later
    return 0;
}

export function applyEffects(unit, state, config) {
    if (unit.rest && unit.rest.expires <= state.turn) {
        unit.strength = Math.round(unit.strength / (1 + config.effects.rest.strength));
        unit.rest = null;
        return { updated: true, notification: `${unit.name} recovered strength after resting` };
    }
    return { updated: false };
}