export function drawVillage(ctx, x, y, size, hex, zoom, seed) {
    seed = hex.name ? hex.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : seed;
    const randSettlement = (max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };
    const numBuildings = 5 + randSettlement(6); // 5-10
    const maxDist = 0.5;
    const buildings = [];
    for (let i = 0; i < numBuildings; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 22) {
            const tileWidth = size * (0.08 + randSettlement(10) / 100);
            const tileHeight = size * (0.04 + randSettlement(10) / 100);
            const tileSize = Math.max(tileWidth, tileHeight);
            seed += hex.q * hex.r + i;
            const cluster = randSettlement(3);
            const dist = size * (cluster === 0 ? 0.2 : cluster === 1 ? 0.35 : maxDist) * Math.sqrt(randSettlement(100) / 100);
            const angle = (randSettlement(180) + (cluster * 120)) * Math.PI / 180;
            const offsetX = Math.cos(angle) * dist;
            const offsetY = Math.sin(angle) * dist;
            const tx = x + offsetX;
            const ty = y + offsetY;
            const rotation = randSettlement(100) < 65 ? 0 : (randSettlement(2) - 0.5) * Math.PI / 10;
            const minGap = tileSize * 0.25;
            const overlaps = buildings.some(b => {
                const dx = b.x - tx;
                const dy = b.y - ty;
                return Math.sqrt(dx * dx + dy * dy) < (tileSize + b.size) * 0.5 + minGap;
            });
            if (!overlaps) {
                const tier = dist < size * 0.25 ? 0 : dist < size * 0.4 ? 1 : 2;
                buildings.push({ x: tx, y: ty, rotation, width: tileWidth, height: tileHeight, size: tileSize, tier });
                placed = true;
            }
            attempts++;
        }
    }
    buildings.forEach(b => {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        ctx.fillStyle = b.tier === 0 ? '#8b4513' : b.tier === 1 ? '#a0522d' : '#cd853f';
        ctx.fillRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.strokeStyle = '#996633';
        ctx.lineWidth = 0.35;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.restore();
    });

    ctx.save();
    seed += hex.q + hex.r;
    const crossDist = size * (0.1 + randSettlement(50) / 100);
    const crossAngle = randSettlement(360) * Math.PI / 180;
    const crossX = x + Math.cos(crossAngle) * crossDist;
    const crossY = y + Math.sin(crossAngle) * crossDist;
    ctx.translate(crossX, crossY);
    ctx.fillStyle = '#996633';
    ctx.font = '4px serif';
    ctx.fillText('✝', 0, 0);
    ctx.restore();

    return seed;
}