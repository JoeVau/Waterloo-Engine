export function drawBaseHex(ctx, x, y, size, hex, zoom, isHighlighted) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();

    const heightColors = {
        0: '#e6f0e6', // Low: Light green, flat plains
        1: '#b3c9b3', // Mid: Mid green-gray, gentle rise
        2: '#809b80'  // High: Darker green-gray, rugged
    };
    const baseColor = hex && hex.height !== undefined ? heightColors[Math.min(Math.max(hex.height, 0), 2)] : '#e6f0e6';

    ctx.fillStyle = baseColor;
    ctx.fill();

    ctx.strokeStyle = isHighlighted ? 'yellow' : '#000';
    ctx.lineWidth = 0.1 / zoom;
    ctx.stroke();

    if (zoom >= 2) {
        ctx.fillStyle = '#000';
        ctx.font = `${6 / zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`${hex.q},${hex.r}`, x, y - size * 0.8);
    }
}