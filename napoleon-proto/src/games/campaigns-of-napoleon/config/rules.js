const defaultConfig = {
    orders: {
        move: {
            range: 2
        },
        attack: {
            range: 1
        },
        scout: {
            los: 3,
            boost: 10,
            returnTurns: 1
        }
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
    },
    effects: {
        corpsBonus: { roll: 1, los: 1 }, // Placeholder
        hqBonus: { roll: 2, los: 2 }    // Placeholder
    }
};

export { defaultConfig };