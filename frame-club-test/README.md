# 3DVR Frame Club Test

This route is a prototype for one of the earlier 3DVR ideas: a 3D-feeling website that still works across phones, tablets, and desktop browsers.

## Direction

- KODE Sports Club inspired the spatial club-map feeling.
- This version avoids a browser-fragile 3D stack by using a framed CSS scene instead of WebGL.
- The frame is the 3D stage. The rest of the page stays normal HTML.

## Files

- `index.html` renders the prototype route.
- `styles.css` handles the framed 3D effect and responsive layout.
- `script.js` drives focus switching and pointer tilt.

## Route

- `/frame-club-test/`

## Why this matters

The goal is to prove that 3DVR can build immersive sites without shipping an experience that breaks on older phones or low-power browsers.
