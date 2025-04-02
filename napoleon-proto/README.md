#Waterloo Engine Prototype v0.1

A lightweight, canvas-based strategy game engine inspired by Napoleonic campaigns. Built with React and Vite, this prototype delivers fast hex-grid rendering, unit management, and turn-based mechanics with a retro, anti-graphics aesthetic.

##Features
-Hex Grid: 50x50 flat-top, odd-r hex map—renders terrain (plains, woods, hills, crops, swamps) with simple vector shapes and colors.
-Units: 5–10 units per side—circles with strength counters (1000–10,000). Move range (2 hexes), extensible stats (speed, scout range).
-Roads: Hex-owned (hex.road) with adjacency graph (roadGraph)—wavy grey lines boost movement.
-UI: Player sidebars—turn state, unit selection, orders. Zoom (0.5–5x) and pan via mouse.
-Map Generation: generateMap.js—random terrain splotches, 3 winding roads, 10 cities, 5v5 units with spacing.
-Performance: Canvas-driven—handles 2500 hexes, 250 road segments, 10 units smoothly.

##Tech Stack
React: Component structure—MapContainer, Map, Frame.
Canvas: 2D rendering—hexes, units, roads, features.
Vite: Fast dev server and build tool.
Node.js: Map generation script (generateMap.js).

#3File Structure
├── /components/
│   ├── DebugPanel.jsx
│   ├── Frame.jsx
│   ├── Map.jsx
│   └── MapContainer.jsx
├── /data/
│   └── /maps/
│       └── x.json
├── /utils/
│   ├── hexGrid
│   └── renderUtils
└── app.jsx
App.jsx: Root component—entry point.

**How to Run
Install: npm install
Generate Map: node src/data/maps/generateMap.js (outputs campaign2.json)
Start: npm run dev
Open: http://localhost:5173 (or your Vite port)