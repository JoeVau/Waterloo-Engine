export function drawCrops(ctx, x, y, size, hex, zoom, seed) {
    const rand = (max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };

    // Crop splotches
    const numSplotches = 5 + rand(4); // 5-8 rectangles
    const wheatShades = ['#e6d8a8', '#d2c68a', '#bfa86b'];
    const splotches = [];
    for (let i = 0; i < numSplotches; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 10) {
            const offsetX = (rand(100) - 50) * size / 100; // ±0.5 * size
            const offsetY = (rand(100) - 50) * size / 100; // ±0.5 * size
            const tx = x + offsetX;
            const ty = y + offsetY;
            const splotchSize = size * (0.2 + rand(15) / 100); // 0.2-0.35 * size
            const rotation = rand(360) * Math.PI / 180; // 0-2π radians
            const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            // Minimal overlap for patchy fields
            const overlaps = splotches.some(s => {
                const dx = s.x - tx;
                const dy = s.y - ty;
                return Math.sqrt(dx * dx + dy * dy) < (splotchSize + s.size) * 0.3;
            });
            if (!overlaps && distFromCenter < size * 0.75) {
                splotches.push({ x: tx, y: ty, size: splotchSize, rotation });
                placed = true;
            }
            attempts++;
        }
    }
    splotches.forEach((splotch, i) => {
        ctx.save();
        ctx.translate(splotch.x, splotch.y);
        ctx.rotate(splotch.rotation);
        ctx.fillStyle = wheatShades[i % wheatShades.length];
        ctx.strokeStyle = '#2f4f2f';
        ctx.lineWidth = 0.5 / zoom;
        ctx.fillRect(-splotch.size / 2, -splotch.size / 2, splotch.size, splotch.size);
        ctx.strokeRect(-splotch.size / 2, -splotch.size / 2, splotch.size, splotch.size);
        ctx.restore();
    });

    // Farmhouses
    const numFarmhouses = rand(4); // 0-3 buildings
    const farmhouses = [];
    for (let i = 0; i < numFarmhouses; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 10) {
            const offsetX = (rand(80) - 40) * size / 100; // ±0.4 * size
            const offsetY = (rand(80) - 40) * size / 100; // ±0.4 * size
            const tx = x + offsetX;
            const ty = y + offsetY;
            const width = size * (0.06 + rand(2) / 100); // 0.06-0.08 * size
            const height = size * (0.03 + rand(2) / 100); // 0.03-0.05 * size
            const rotation = rand(360) * Math.PI / 180; // 0-2π radians
            const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            // Check overlap with splotches and other farmhouses
            const overlapsSplotch = splotches.some(s => {
                const dx = s.x - tx;
                const dy = s.y - ty;
                return Math.sqrt(dx * dx + dy * dy) < (s.size + Math.max(width, height)) * 0.5;
            });
            const overlapsFarmhouse = farmhouses.some(f => {
                const dx = f.x - tx;
                const dy = f.y - ty;
                return Math.sqrt(dx * dx + dy * dy) < (Math.max(width, height) + Math.max(f.width, f.height)) * 0.5;
            });
            if (!overlapsSplotch && !overlapsFarmhouse && distFromCenter < size * 0.75) {
                farmhouses.push({ x: tx, y: ty, width, height, rotation });
                placed = true;
            }
            attempts++;
        }
    }
    farmhouses.forEach((farmhouse, i) => {
        ctx.save();
        ctx.translate(farmhouse.x, farmhouse.y);
        ctx.rotate(farmhouse.rotation);
        ctx.fillStyle = i % 3 === 0 ? '#8b4513' : i % 3 === 1 ? '#a0522d' : '#cd853f'; // Match village/city
        ctx.strokeStyle = '#1c2526';
        ctx.lineWidth = 0.15 / zoom;
        ctx.fillRect(-farmhouse.width / 2, -farmhouse.height / 2, farmhouse.width, farmhouse.height);
        ctx.strokeRect(-farmhouse.width / 2, -farmhouse.height / 2, farmhouse.width, farmhouse.height);
        ctx.restore();
    });

    return seed;
}