# Ripples UI

A dependency-free, static starter for the story's interactive experience. It
includes a responsive five-wave infographic/navigation map, scene descriptions,
chapter links, perspective controls, and a translation-ready language selector.
It currently displays English chapter outlines, not a finished story or finished
scene illustrations. With only one published language, the selector is disabled.

## Local development

Requires Node.js 22 or later. No package installation is needed.

```powershell
Set-Location D:\Personal\Ripples\UI
npm test
npm run build
npm run preview
```

Open `http://localhost:4173/Ripples/`. Stop the preview with Ctrl+C. The preview
deliberately serves a repository-style subpath to catch broken asset URLs.
Rebuild and refresh after changing content or source files.

- `scripts/build.mjs` validates `../STORY/` and generates `dist/`.
- `src/` contains the static page, styles, and interactive infographic/reader.
- `scripts/preview.mjs` is a local-only server, **not** a hosting requirement.
- `test/` checks content rules and static output.

Edit chapters in `STORY/`, not generated files. See
[the story guide](../STORY/README.md) for the content format and translation steps.
The renderer treats story paragraphs as text rather than executable markup.

## GitHub Pages

The site needs no backend, API keys, database, runtime translation service,
client-side router rewrites, or third-party fonts/scripts. All assets are relative
to the page; links such as `#en/crest` work under a project repository path.
Hash links retain the language and chapter. Language switching keeps the current
chapter and perspective. The first manifest language is the default.

A manual deployment workflow is provided at
[.github/workflows/pages.yml](../.github/workflows/pages.yml). To publish when ready:

1. Create or choose a GitHub repository and push this project, including `STORY/`,
   `UI/`, and the workflow. This scaffold does not create a repository or push files.
2. In repository **Settings > Pages**, select **GitHub Actions** as the source.
3. Run **Deploy Ripples to Pages** from the Actions tab on the desired branch.
   It tests, builds, and uploads only `UI/dist/`.
4. Visit the deployment URL reported by the workflow and verify navigation and
   assets under your repository's path.

Deployment is manual, not triggered on every push, to avoid publishing unfinished
story material accidentally. Only the generated site is in the Pages artifact,
but files in a public source repository are still public. Review content before
publishing. GitHub Pages cannot protect private chapters with client-side code.
