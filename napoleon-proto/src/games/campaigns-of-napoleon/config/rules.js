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
            recallDelay: 0,
            strengthFraction: 0.5
        },
        rest: {
            strength: -0.1,
            duration: 1
        }
    },
    effects: {
        exhaustion: {
            skill: -1,
            forceMarch: 1
        },
        rest: {
            strength: -0.1,
            duration: 1
        },
        corpsBonus: { roll: 1, los: 1 },
        hqBonus: { roll: 2, los: 2 }
    },
    division: {
        brigades: 2
    }
};

export { defaultConfig };