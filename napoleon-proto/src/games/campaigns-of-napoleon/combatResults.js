const combatResultsTable = {
    "1:3": {
        "2-5": "AE",
        "6-8": "AE",
        "9-11": "AR",
        "12-14": "NE",
        "15+": "DR"
    },
    "1:2": {
        "2-5": "AE",
        "6-8": "AR",
        "9-11": "NE",
        "12-14": "DR",
        "15+": "DE"
    },
    "1:1": {
        "2-5": "AR",
        "6-8": "NE",
        "9-11": "DR",
        "12-14": "DE",
        "15+": "DE"
    },
    "2:1": {
        "2-5": "NE",
        "6-8": "DR",
        "9-11": "DE",
        "12-14": "DE",
        "15+": "DE"
    },
    "3:1": {
        "2-5": "DR",
        "6-8": "DE",
        "9-11": "DE",
        "12-14": "DE",
        "15+": "DE"
    },
    "4:1+": {
        "2-5": "DE",
        "6-8": "DE",
        "9-11": "DE",
        "12-14": "DE",
        "15+": "DE"
    }
};

function roll2d6() {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
}

function getStrengthRatio(attackerStrength, defenderStrength) {
    const ratio = attackerStrength / defenderStrength;
    if (ratio <= 0.33) return "1:3";
    if (ratio <= 0.5) return "1:2";
    if (ratio <= 1.5) return "1:1";
    if (ratio <= 2.5) return "2:1";
    if (ratio <= 3.5) return "3:1";
    return "4:1+";
}

function getRollRange(roll) {
    if (roll <= 5) return "2-5";
    if (roll <= 8) return "6-8";
    if (roll <= 11) return "9-11";
    if (roll <= 14) return "12-14";
    return "15+";
}

export function getCombatResult(attacker, defender, config, attackerModifiers = {}, defenderModifiers = {}) {
    const surpriseRoll = roll2d6() + (attacker.skill - defender.skill);
    console.log(`Surprise roll: ${surpriseRoll} (2d6 + ${attacker.skill} - ${defender.skill})`);
    const surpriseMod = surpriseRoll > 7 ? 3 : (surpriseRoll <= 7 ? -3 : 0);
    console.log(`Surprise modifier: ${surpriseMod}`);

    const skillMod = (attackerModifiers.skill || 0) - (defenderModifiers.skill || 0);
    console.log(`Skill modifier: ${skillMod} (attacker ${attackerModifiers.skill || 0} vs defender ${defenderModifiers.skill || 0})`);

    const combatRoll = roll2d6() + surpriseMod + skillMod;
    console.log(`Combat roll: ${combatRoll} (2d6 + ${surpriseMod} + ${skillMod})`);

    const ratio = getStrengthRatio(attacker.strength, defender.strength);
    console.log(`Strength ratio: ${ratio} (${attacker.strength} vs ${defender.strength})`);

    const rollRange = getRollRange(combatRoll);
    const result = combatResultsTable[ratio][rollRange];
    console.log(`Combat result: ${result} (Roll ${combatRoll} in range ${rollRange})`);

    return result;
}