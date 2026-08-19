# KanaMaster PWA

Mobile-first Next.js app shell for daily Japanese kana practice, with a complete installable PWA setup.

## Run locally

```bash
npm install
npm run dev
```

The service worker only registers in production, matching browser and Vercel behavior:

```bash
npm run build
npm start
```

Open `http://localhost:3000`. On a supported Chromium browser, use the in-app install banner or the browser's **Install app** action. On iOS Safari, the banner explains **Share → Add to Home Screen → Add**.

## PWA assets

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- 1024px icon master and generated sizes: `public/icons/`
- iOS launch images: `public/splash/`
- Reproducible asset generator: `scripts/generate_pwa_assets.py`

Learning progress and install-banner dismissal are stored in browser `localStorage` and remain available when KanaMaster is launched in standalone mode.

## Handwriting practice

Open `/practice/handwriting` to use the on-device writing recognizer. It supports mouse, touch and stylus pointer events, per-stroke undo/redo, optional practice guides, a no-hint test mode, Audio → Writing prompts, confidence handling and separate writing-mastery storage. The recognizer implements a provider-independent `HandwritingRecognizer` interface, so a future vision API or on-device ML model can replace the current local template engine without changing the UI.
