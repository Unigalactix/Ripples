# Ripples project guidance

## Purpose and structure

- Ripples is Rajesh Kodaganti's relationship story and a companion interactive reading experience.
- `STORY/` owns the chapter content and translations. `UI/` owns the static reader, scene visuals, infographic rendering, and build scripts.
- `Assets/` owns the original cover, favicon, and generated downloadable book editions.
- Read [STORY/README.md](STORY/README.md) and [README.md](README.md) for content conventions and commands.
- Preserve the original concept document at the project root. `agentanalysis.md` contains editorial suggestions, not approved changes to the story.

## Current priority: drafting the story and its book preview

- The author has now requested story drafting alongside a UI that presents the manuscript as a book. This supersedes the earlier pause on UI work.
- Prioritize the manuscript and a readable book preview; defer elaborate scene experiences and deployment unless requested.
- Use https://unigalactix.github.io/JINX/ as a reference for an immersive entry, embedded book, chapter navigation, language selection, and reading controls. Create original styling, text, and assets.
- Do not let the reader or its JSON format constrain the storytelling. Label first drafts, outlines, and unfinished front matter honestly.

## Approved book structure

1. Title page: `Ripples - A Rajesh Kodaganti's Unavailability`. Preserve this author-requested wording.
   The subtitle itself credits the author; do not add a second author-name line on the cover.
2. Dedication on a separate page. The author has not supplied its text; do not invent a personal dedication.
3. `AT THE WATER'S EDGE` on its own divider page, centered horizontally and vertically.
4. Two short, unnumbered opening sections: `Before`, then `A Pebble`.
5. `THE RIPPLES BEGIN` on its own centered divider page.
6. Five wave chapters, ending in `Still Water`.

- `Before` introduces their ordinary affection and familiarity. `A Pebble` introduces the cancellation; the first wave begins with its effect on their relationship, without repeating the incident.
- The author has approved these wave titles: The First Ripple, Crosscurrents, The Crest, The Trough, Still Water.
- Internal chapter IDs remain stable for links and translations even when display titles change.
- Chapter filenames follow the approved titles: `01-first-ripple.json`, `02-crosscurrents.json`, `03-crest.json`, `04-trough.json`, `05-still-water.json`.

## Story continuity

- Aarna, 28, is a painter; Mukund, 27, works in medical-device or pharmaceutical sales. The exact sales specialty remains undecided.
- Their relationship spans three years. The present-day story takes place in one day and ends that night.
- They began dating through `B(L)IND`, a dating app that sets up blind dates between random people. Preserve its exact spelling and the dual BLIND/BIND meaning. The match is random, not evidence of algorithmic compatibility or destiny.
- The cafe, blue shirt, paint on Aarna's wrist, and first-date conversation are editable first-draft details. The app-based origin itself is author-approved canon.
- Full character profiles live in `STORY/en/characters.json` alongside the manuscript. Keep facts, profiles, story, and translations consistent; do not invent diagnoses or label Mukund a doctor.
- Keep five waves in escalating, then settling emotional order.
- The inciting incident is the cancellation of Aarna's first major solo exhibition, two weeks before it opens. The first draft uses a funding-related cancellation; this is an editable draft choice, not personal rejection by the gallery.
- Explore both perspectives: Aarna needs emotional presence; Mukund initially offers practical solutions. Neither should become a caricature or a designated villain.
- The ending is a grounded commitment, not an overnight cure for emotional unavailability.
- `Before`, `A Pebble`, and all five waves have first-draft prose, not final author-approved copy. The dedication is still pending.
- The first draft uses close third-person narration with explicit perspective breaks. New scene details are proposals for author review; do not present invented personal histories as approved canon.
- Draft continuity: invitations and a paint-marked cuff connect the morning to the ending; the failed funding message comes that afternoon. The broken-frame memory and missed sales target are proposed relationship history. They argue, eat, and agree to defer practical plans until tomorrow; the ending stays that night at 11:42.
- Check attribution and publication rights before incorporating externally attributed quotations or media.

## UI and hosting

- Target GitHub Pages: deploy only static HTML, CSS, JavaScript, JSON, and local assets. No runtime server, database, secrets, or private API dependencies.
- Keep the actual `index.html` at the repository root, as requested. `UI/content.js` is generated book data for branch-root hosting; rebuild it from `STORY/` before publishing. The build also creates a self-contained `UI/dist/` artifact with the same root entry point and relative asset structure.
- Keep asset URLs relative and chapter navigation hash-based so repository subpaths work without server rewrites.
- Node.js is local/build-time tooling only. The browser remains dependency-free; the pinned `fflate` development dependency builds EPUB ZIP archives. Use `npm ci` before tests/build on a fresh checkout.
- Generate the reader from `STORY/`; do not hand-edit `UI/content.js`, duplicate story text in UI source, or edit `UI/dist/` by hand.
- Support multiple languages through the locale manifest and matching chapter IDs. Currently only English is authored; do not advertise unfinished translations or silently substitute English.
- Translate reader labels as well as story text, preserve the selected section when switching languages, and support locale direction and Unicode. Translations start at the section's first page because pagination can differ.
- Keep the experience responsive, keyboard-accessible, readable without motion, and free of autoplay audio.
- Use coral/rose for Aarna and cyan/indigo for Mukund in the UI, not as a judgement of either person. Keep manuscript text dark on calm paper.
- Water ripples respond to clicks/taps and have a pause control. Reduced motion disables water and page-turn animation; pause water while reading or offscreen.
- Page-edge buttons turn pages with the same animation as Next/Previous, mirror in RTL, and respect first/last-page boundaries. Preserve text selection in the page body.
- Character profiles open from Meet them and individual cards in an accessible dialog, with explicit close controls, keyboard focus handling, and both character choices.
- Cover direction: expressive painted coral/ochre/teal forms for Aarna, measured blue geometric forms for Mukund, and a shared water/ripple motif inspired by the author's provided covers. Faces are symbolic, not definitive physical descriptions.
- Finish the cover as a premium editorial identity: restrained deep petrol, ivory and muted gold, clean typography and breathing room. The author specifically chose a pebble/stone emoji (U+1FAA8) for the favicon, replacing the earlier R monogram.
- Full-book HTML exports are generated with embedded cover art and styles. `Print / Save PDF` opens that complete edition for the browser's print dialog; it is not a prebuilt PDF file. Do not label it a direct PDF download.
- EPUB 3 downloads are generated for every authored locale, containing the full manuscript, table of contents, metadata, and cover. Rebuild HTML, EPUB and UI content together after manuscript or cover changes.
- Surface build and reader failures explicitly.

## Workflow and project memory

- From `UI/`: `npm test`, `npm run build`, then `npm run preview`. Preview at `http://localhost:4173/Ripples/`.
- Validate book order, page and contents navigation, perspective breaks, language behavior, mobile readability, and repository-subpath hosting after relevant UI changes.
- Keep this file concise and current when the author makes lasting project decisions. Store project guidance here, not secrets, personal data, or chat transcripts.
- Do not commit, create a remote repository, or publish the site without an explicit request.

## Remote:
https://github.com/Unigalactix/Ripples
-- Always Commit and Push Here as "Unigalactix"
