export function drawWoods(ctx, x, y, size, hex, zoom, seed) {
    const rand = (max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };
    const numTrees = 5 + rand(3); // 5-7 trees
    const trees = [];
    for (let i = 0; i < numTrees; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 10) {
            const offsetX = (rand(100) - 50) * size / 100; // ±0.5 * size
            const offsetY = (rand(100) - 50) * size / 100; // ±0.5 * size
            const tx = x + offsetX;
            const ty = y + offsetY;
            const treeSize = size * (0.15 + rand(10) / 100); // ±20%
            const overlaps = trees.some(t => {
                const dx = t.x - tx;
                const dy = t.y - ty;
                return Math.sqrt(dx * dx + dy * dy) < (treeSize + t.size) * 0.7;
            });
            const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            if (!overlaps && distFromCenter < size * 0.75) {
                trees.push({ x: tx, y: ty, size: treeSize });
                placed = true;
            }
            attempts++;
        }
    }
    trees.forEach(t => {
        ctx.beginPath();
        ctx.moveTo(t.x, t.y - t.size * 1.5);
        ctx.lineTo(t.x - t.size, t.y + t.size);
        ctx.lineTo(t.x + t.size, t.y + t.size);
        ctx.closePath();
        ctx.fillStyle = rand(100) < 30 ? '#228b22' : '#004d00';
        ctx.fill();
        ctx.strokeStyle = '#002200';
        ctx.lineWidth = 0.3 / zoom;
        ctx.stroke();
    });
    return seed;
}