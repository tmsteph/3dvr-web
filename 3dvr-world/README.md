# 3DVR 3D Homepage World

This route is a prototype for turning the 3DVR homepage into a full-screen 3D-feeling world that still works across phones, tablets, and desktop browsers.

## Direction

- The goal is a homepage that feels spatial without becoming a fragile WebGL demo.
- The route now stands as its own full-screen page instead of a prototype explainer wrapped around the scene.
- The frame is the 3D stage. The rest of the page stays normal HTML.
- The graphics now lean on the portal game's HUD language: glow panels, telemetry cards, orbit rings, and ambient orbs.
- The zones can later map to work, experiments, portal paths, and support.

## Files

- `index.html` renders the prototype route.
- `styles.css` handles the framed 3D effect and responsive layout.
- `script.js` drives focus switching and pointer tilt.

## Route

- `/3dvr-world/`

## Why this matters

The goal is to prove that 3DVR can build immersive sites and worlds without shipping an experience that breaks on older phones or low-power browsers.
