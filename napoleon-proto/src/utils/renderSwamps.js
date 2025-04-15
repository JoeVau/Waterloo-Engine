export function drawSwamps(ctx, x, y, size, hex, zoom, seed) {
    const rand = (max) => {
        const x = Math.sin(seed++) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };

    // Water layer: Murky fill
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.restore();

    // Reeds/roots: Wavy lines
    const numReeds = 8 + rand(5); // 8-12
    const reeds = [];
    for (let i = 0; i < numReeds; i++) {
        const offsetX = (rand(100) - 50) * size / 100; // ±0.5 * size
        const offsetY = (rand(100) - 50) * size / 100; // ±0.5 * size
        const tx = x + offsetX;
        const ty = y + offsetY;
        const length = size * (0.15 + rand(15) / 100); // 0.15-0.3 * size
        const angle = rand(360) * Math.PI / 180; // 0-2π
        const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        if (distFromCenter < size * 0.75) {
            reeds.push({ x: tx, y: ty, length, angle });
        }
    }
    reeds.forEach(reed => {
        ctx.beginPath();
        const x1 = reed.x - (reed.length / 2) * Math.cos(reed.angle);
        const y1 = reed.y - (reed.length / 2) * Math.sin(reed.angle);
        const x2 = reed.x + (reed.length / 2) * Math.cos(reed.angle);
        const y2 = reed.y + (reed.length / 2) * Math.sin(reed.angle);
        const cx = reed.x + (rand(20) - 10) * size / 200; // Slight curve control
        const cy = reed.y + (rand(20) - 10) * size / 200;
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.strokeStyle = '#3c5b3c'; // Dark green
        ctx.lineWidth = 0.2 / zoom;
        ctx.stroke();
    });

    // Moss patches: Irregular blobs
    const numMoss = 4 + rand(4); // 4-7
    const mossPatches = [];
    for (let i = 0; i < numMoss; i++) {
        const offsetX = (rand(80) - 40) * size / 100; // ±0.4 * size
        const offsetY = (rand(80) - 40) * size / 100; // ±0.4 * size
        const tx = x + offsetX;
        const ty = y + offsetY;
        const mossSize = size * (0.1 + rand(10) / 100); // 0.1-0.2 * size
        const numSides = 5 + rand(4); // 5-8 sides
        const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        if (distFromCenter < size * 0.75) {
            mossPatches.push({ x: tx, y: ty, size: mossSize, sides: numSides });
        }
    }
    mossPatches.forEach(moss => {
        ctx.beginPath();
        for (let j = 0; j < moss.sides; j++) {
            const angle = (2 * Math.PI * j) / moss.sides + (rand(20) - 10) * Math.PI / 180;
            const radius = moss.size * (0.8 + rand(40) / 100); // ±20% variation
            const px = moss.x + radius * Math.cos(angle);
            const py = moss.y + radius * Math.sin(angle);
            j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#78cccc60'; // Olive, ~38% opacity
        ctx.fill();
    });

    // Bubbles/mud: Small circles
    const numBubbles = 5 + rand(6); // 5-10
    const bubbles = [];
    for (let i = 0; i < numBubbles; i++) {
        const offsetX = (rand(100) - 50) * size / 100; // ±0.5 * size
        const offsetY = (rand(100) - 50) * size / 100; // ±0.5 * size
        const tx = x + offsetX;
        const ty = y + offsetY;
        const radius = size * (0.02 + rand(3) / 100); // 0.02-0.05 * size
        const distFromCenter = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        if (distFromCenter < size * 0.75) {
            bubbles.push({ x: tx, y: ty, radius });
        }
    }
    bubbles.forEach(bubble => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#4a2f2f40'; // Murky brown, ~25% opacity
        ctx.fill();
    });

    // Fog: Faint radial gradient
    ctx.save();
    const fogX = x + (rand(60) - 30) * size / 100; // ±0.3 * size
    const fogY = y + (rand(60) - 30) * size / 100;
    const grad = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, size * 0.6);
    grad.addColorStop(0, '#b0c4de20'); // Pale blue, ~12% opacity
    grad.addColorStop(1, '#b0c4de00'); // Transparent
    ctx.fillStyle = grad;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    ctx.restore();

    return seed;
}