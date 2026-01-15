# 3dvr.tech Marketing Site (Static)

This `/dist` folder contains a static marketing site for 3dvr.tech. It uses plain HTML, CSS, and JavaScript with no build step.

## Structure

- `index.html` — Homepage
- `pricing.html` — Pricing overview
- `about.html` — Story + mission
- `start.html` — Get started wizard
- `styles.css` — Global styles
- `script.js` — Interactions (wizard, modal, motion toggle)
- `assets/` — Logo + UI placeholders

## Deploy

### GitHub Pages
1. Commit the `dist` folder.
2. In GitHub, go to **Settings → Pages**.
3. Choose the `main` branch (or your branch) and `/dist` folder.
4. Save and wait for the published URL.

### Vercel
1. Import the repo into Vercel.
2. Set the root directory to `/dist`.
3. Deploy (no build command needed).

## Local preview

From the repo root:

```bash
cd dist
python -m http.server 8080
```

Then visit `http://localhost:8080`.
