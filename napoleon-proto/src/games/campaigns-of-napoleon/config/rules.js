const defaultConfig = {
    orders: {
        move: {
            infantry: 5,
            cavalry: 15,
            forceMarch: 10
        },
        attack: {
            range: 1
        },
        scout: {
            los: 3,
            boost: 10,
            returnTurns: 1,
            strengthFraction: 0.5
        },
        rest: {
            strength: -0.1, // 10% strength reduction
            duration: 1 // Recovers next turn
        }
    },
    terrain: {
        plains: { moveCost: 1 },
        woods: { moveCost: 2 },
        hills: { moveCost: 3 },
        road: { moveCost: 0 }
    },
    effects: {
        exhaustion: {
            skill: -1, // -1 skill per point
            forceMarch: 1 // +1 per force march
        },
        rest: {
            strength: -0.1, // 10% reduction
            duration: 1 // 1-turn recovery
        },
        corpsBonus: { roll: 1, los: 1 },
        hqBonus: { roll: 2, los: 2 }
    },
    division: {
        brigades: 2
    },
    combat: {
        crtTable: {
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
        }
    }
};

export { defaultConfig };