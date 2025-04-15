export function drawCity(ctx, x, y, size, hex, zoom, seed) {
    seed = hex.name ? hex.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : seed;
    const randSettlement = (max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };
    const numBuildings = 30;
    const maxDist = 0.8;
    const buildings = [];
    const avenueAngles = [Math.PI / 3, -Math.PI / 3, 2 * Math.PI / 3];
    const avenueWidths = [size * 0.16, size * 0.14, size * 0.15];
    for (let i = 0; i < numBuildings; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 22) {
            const tileWidth = size * (0.10 + randSettlement(14) / 100);
            const tileHeight = size * (0.05 + randSettlement(14) / 100);
            const tileSize = Math.max(tileWidth, tileHeight);
            seed += hex.q * hex.r + i;
            const cluster = randSettlement(3);
            const dist = size * (cluster === 0 ? 0.3 : cluster === 1 ? 0.55 : maxDist) * Math.sqrt(randSettlement(100) / 100);
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
            const inAvenue = avenueAngles.some((angle, idx) => {
                const width = avenueWidths[idx] / 1.5;
                const dx = tx - x;
                const dy = ty - y;
                const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
                const perp = Math.abs(dx * Math.sin(angle) - dy * Math.cos(angle));
                return perp < width && proj > -size * 0.5 && proj < size * 0.5;
            });
            if (!overlaps && !inAvenue) {
                const tier = dist < size * 0.35 ? 0 : dist < size * 0.65 ? 1 : 2;
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
        ctx.strokeStyle = '#1c2526';
        ctx.lineWidth = 0.15;
        ctx.strokeRect(-b.width / 2, -b.height / 2, b.width, b.height);
        ctx.restore();
    });

    ctx.save();
    seed += hex.q + hex.r;
    const numSides = 5 + randSettlement(4);
    const wallRadius = size * 0.7;
    const wallPoints = [];
    for (let i = 0; i < numSides; i++) {
        const angle = (2 * Math.PI * i) / numSides + (randSettlement(20) - 10) * Math.PI / 180;
        const radiusVariation = wallRadius * (0.9 + randSettlement(20) / 100);
        const px = x + radiusVariation * Math.cos(angle);
        const py = y + radiusVariation * Math.sin(angle);
        wallPoints.push({ x: px, y: py });
    }
    ctx.beginPath();
    wallPoints.forEach((p, i) => {
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5 / zoom;
    ctx.stroke();
    ctx.restore();

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