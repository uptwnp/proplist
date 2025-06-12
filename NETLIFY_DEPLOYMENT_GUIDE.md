# Netlify Manual Deployment Guide

## Files to Upload

After running `npm run build`, you need to upload the contents of the `dist/` folder to Netlify, NOT the source files.

### Steps:

1. **Build the project locally:**
   ```bash
   npm run build
   ```

2. **Upload ONLY the `dist/` folder contents to Netlify:**
   - Go to Netlify dashboard
   - Drag and drop the **contents** of the `dist/` folder (not the dist folder itself)
   - Or zip the contents of `dist/` and upload the zip

### What should be in the dist folder:
- `index.html` (main HTML file)
- `assets/` folder (contains compiled JS and CSS)
- `icons/` folder (PWA icons)
- `manifest.json` (PWA manifest)
- `sw.js` (service worker)
- `favicon.svg` (favicon)
- `_redirects` (Netlify routing config)

### Important Notes:
- **DO NOT** upload source files like `src/`, `package.json`, etc.
- **ONLY** upload the built/compiled files from the `dist/` folder
- The `_redirects` file is crucial for single-page app routing
- Make sure all files from `dist/` are uploaded to the root of your Netlify site

### Alternative: Use Netlify CLI
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

## Troubleshooting

If you still see a blank page:
1. Check browser console for errors
2. Ensure all files from `dist/` were uploaded
3. Check that `_redirects` file is in the root
4. Verify the site URL is correct