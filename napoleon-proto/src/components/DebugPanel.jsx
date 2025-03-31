function DebugPanel({ highlighted, hexes, selectedUnitId, units }) {
  const selectedUnit = selectedUnitId ? units.find(u => u.id === selectedUnitId) : null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '3px',
      }}
    >
      {highlighted ? (
        (() => {
          const hex = hexes.find(h => h.q === highlighted[0] && h.r === highlighted[1]);
          return (
            <>
            <div>Clicked Hex: [{highlighted[0]}, {highlighted[1]}] - Terrain: {hex ?.terrain || 'unknown'}{hex ?.feature ? `, Feature: ${hex.feature}` : ''}{hex ?.name ? `, Name: ${hex.name}` : ''}</div>
              { selectedUnit && <div>Selected Unit: {selectedUnit.name} ({selectedUnit.team})</div> }
            </>
          );
        })()
      ) : (
        'Click a hex to see details'
      )}
    </div>
  );
}

export default DebugPanel;