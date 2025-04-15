export function drawHills(ctx, x, y, size, hex, zoom, seed) {
    const rand = (max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };
    const numHills = 3 + rand(3); // 3-5 hills
    const hills = [];
    for (let i = 0; i < numHills; i++) {
        let attempts = 0;
        let placed = false;
        while (!placed && attempts < 10) {
            const offsetX = (rand(120) - 60) * size / 200; // ±0.6 * size
            const offsetY = (rand(120) - 60) * size / 200; // ±0.6 * size
            const tx = x + offsetX;
            const ty = y + offsetY;
            const hillWidth = size * (0.4 + rand(20) / 100); // ±20%
            const hillHeight = size * (0.3 + rand(10) / 100); // ±10%
            const overlaps = hills.some(h => {
                const dx = h.x - tx;
                const dy = h.y - ty;
                return Math.sqrt(dx * dx + dy * dy) < (hillWidth + h.width) * 0.5;
            });
            const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
            if (!overlaps && distFromCenter < size * 0.75) {
                hills.push({ x: tx, y: ty, width: hillWidth, height: hillHeight });
                placed = true;
            }
            attempts++;
        }
    }
    hills.forEach(hill => {
        ctx.beginPath();
        ctx.moveTo(hill.x, hill.y);
        ctx.quadraticCurveTo(hill.x + hill.width * 0.5, hill.y - hill.height, hill.x + hill.width, hill.y);
        //ctx.fillStyle = '#c1c7bb';
        //ctx.fill();
        ctx.strokeStyle = '#95a386';
        ctx.lineWidth = 0.8 / zoom;
        ctx.stroke();
    });
    return seed;
}