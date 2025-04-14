export function getCombatModifiers(state, attacker, defender, config) {
    // Placeholder: No corps or HQ bonuses yet
    return { roll: 0 };
}

export function getLosModifiers(unit, config) {
    // Apply scout LOS if applicable
    if (unit.order === 'scout') {
        return config.orders.scout.los;
    }
    // Placeholder: Corps, HQ, picket bonuses later
    return 0;
}