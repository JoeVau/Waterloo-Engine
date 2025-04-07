// src/tools/generateUnits.js
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Output path
const OUTPUT_PATH = join(process.cwd(), 'src', 'data', 'units.js');

// Base units from your sample
const baseUnits = [
    { id: "blue_1", name: "Blue Unit 1", team: "blue", position: [18, 28], strength: 9422 },
    { id: "blue_2", name: "Blue Unit 2", team: "blue", position: [4, 10], strength: 4339 },
    { id: "blue_7", name: "Blue Unit 7", team: "blue", position: [4, 10], strength: 9000 },
    { id: "red_6", name: "Red Unit 6", team: "red", position: [4, 11], strength: 6339 },
    { id: "blue_3", name: "Blue Unit 3", team: "blue", position: [21, 17], strength: 9069 },
    { id: "blue_4", name: "Blue Unit 4", team: "blue", position: [19, 40], strength: 2281 },
    { id: "blue_5", name: "Blue Unit 5", team: "blue", position: [13, 9], strength: 6367 },
    { id: "red_1", name: "Red Unit 1", team: "red", position: [47, 37], strength: 3232 },
    { id: "red_2", name: "Red Unit 2", team: "red", position: [30, 44], strength: 9535 },
    { id: "red_3", name: "Red Unit 3", team: "red", position: [38, 12], strength: 3199 },
    { id: "red_4", name: "Red Unit 4", team: "red", position: [39, 39], strength: 2413 },
    { id: "red_5", name: "Red Unit 5", team: "red", position: [37, 7], strength: 6339 },
];

// Leader names (short list for simplicity)
const leaderNames = [
    "Napoleon", "Wellington", "Blücher", "Davout", "Ney",
    "Kutuzov", "Moore", "Masséna", "Soult", "Archduke Charles"
];

// Generate expanded units
function generateUnits() {
    const units = baseUnits.map(unit => ({
        ...unit,
        guns: Math.floor(Math.random() * 11), // 0-10
        horses: Math.floor(Math.random() * (unit.strength + 1)), // 0-strength
        leader: leaderNames[Math.floor(Math.random() * leaderNames.length)],
        skill: Math.floor(Math.random() * 5) + 1, // 1-5
    }));
    return units;
}

// Save units to file
function saveUnits() {
    const units = generateUnits();
    const outputDir = join(process.cwd(), 'src', 'data');
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }
    const fileContent = `export default ${JSON.stringify(units, null, 2)};`;
    writeFileSync(OUTPUT_PATH, fileContent);
    console.log(`Units generated and saved to ${OUTPUT_PATH}`);
}

// Run the tool
saveUnits();