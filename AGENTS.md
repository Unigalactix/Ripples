# Ripples project guidance

## Purpose and structure

- Ripples is Rajesh Kodaganti's relationship story and a companion interactive reading experience.
- `STORY/` owns the chapter content and translations. `UI/` owns the static reader, scene visuals, infographic rendering, and build scripts.
- Read [STORY/README.md](STORY/README.md) and [UI/README.md](UI/README.md) for content conventions and commands.
- Preserve the original concept document at the project root. `agentanalysis.md` contains editorial suggestions, not approved changes to the story.

## Current priority: story first

- Complete and revise the story with the author before resuming UI development.
- Focus on character development, narrative decisions, chapter prose, continuity, and the ending.
- Leave the existing UI scaffold in place, but defer UI features, infographic work, interactive scene adaptation, and deployment until the author confirms the story is ready and asks to move to the UI phase.
- Do not let the current reader or its JSON format constrain the storytelling.

## Story continuity

- Aarna, 28, is a painter; Mukund, 27, works in medical-device or pharmaceutical sales. The exact sales specialty remains undecided.
- Their relationship spans three years. The present-day story takes place in one day and ends that night.
- Keep the five-wave sequence: The Impact, The First Ripple, The Crest, The Trough, Still Water.
- The inciting incident is the cancellation of Aarna's first major solo exhibition, two weeks before it opens. Funding issues or a management change are proposed causes, not a finalized choice.
- Explore both perspectives: Aarna needs emotional presence; Mukund initially offers practical solutions. Neither should become a caricature or a designated villain.
- The ending is a grounded commitment, not an overnight cure for emotional unavailability.
- Current chapter files are outlines, not a completed manuscript. Preserve that distinction in the reader until actual prose is written.
- Do not invent definitive backstories, choose a narrative voice, or turn editorial suggestions into canon without the author's direction.
- Check attribution and publication rights before incorporating externally attributed quotations or media.

## UI and hosting

- Target GitHub Pages: deploy only static HTML, CSS, JavaScript, JSON, and local assets. No runtime server, database, secrets, or private API dependencies.
- Keep asset URLs relative and chapter navigation hash-based so repository subpaths work without server rewrites.
- Node.js is local/build-time tooling only. Use the dependency-free setup unless a requirement warrants a change.
- Generate the reader from `STORY/`; do not maintain duplicate hand-edited story text inside UI files or edit `UI/dist/` by hand.
- Support multiple languages through the locale manifest and matching chapter IDs. Currently only English is authored; do not advertise unfinished translations or silently substitute English.
- Translate reader labels as well as story text, preserve the selected chapter when switching languages, and support locale direction and Unicode.
- Keep the experience responsive, keyboard-accessible, readable without motion, and free of autoplay audio.
- Surface build and reader failures explicitly.

## Workflow and project memory

- From `UI/`: `npm test`, `npm run build`, then `npm run preview`. Preview at `http://localhost:4173/Ripples/`.
- Validate chapter navigation, perspective controls, language behavior, and repository-subpath hosting after relevant UI changes.
- Keep this file concise and current when the author makes lasting project decisions. Store project guidance here, not secrets, personal data, or chat transcripts.
- Do not commit, create a remote repository, or publish the site without an explicit request.
