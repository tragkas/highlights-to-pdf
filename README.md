## Deploy to GitHub Pages

The app is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Setup Instructions:

1. Push your code to the `main` branch on GitHub
2. Go to your repository **Settings** → **Pages**
3. Under "Build and deployment", select:
   - **Source**: GitHub Actions
4. The deployment workflow will run automatically on every push to `main`

### Manual Deployment:

To deploy locally using `gh-pages`:

```bash
npm run deploy
```

This builds the project and deploys the `dist/` folder to your `gh-pages` branch.
