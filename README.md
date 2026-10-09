# Ripples

**Ripples - A Rajesh Kodaganti's Unavailability**

A relationship story and a browser-dependency-free literary website with an embedded
book. The experience uses an original water motif, paper pages, contents and page
navigation, keyboard controls, adjustable type, and translation-ready content.

The water-first theme uses sunlit aqua, pearl, sea-glass green and deep teal,
with an original illustrated water surface and overlapping, expanding ripples.
Aarna's character panel uses expressive watercolor/ochre brushwork; Mukund's uses
measured blue planes and a fine grid. Their actual traits are drawn from the
profile data rather than reduced to a warm/cold binary. Click/tap the hero or use **Make a ripple** to
add a disturbance. **Pause water** freezes the decorative motion; operating-system
reduced-motion preferences show a static surface. Water also pauses while the
book is open, the hero is offscreen, or the tab is hidden. No sound is played.
Character cards and manuscript viewpoint headings share those identities;
the manuscript itself stays on quiet, high-contrast paper.

[JINX](https://unigalactix.github.io/JINX/) informed the immersive entry and
embedded-reader interaction, along with the new editorial flow: hero, premise,
characters, wave/chapter map, then reading/downloads. The header links directly
to these sections. No JINX prose, images, code, or audio were copied.

Both opening sections and all five waves are complete first drafts. The
dedication uses the author's supplied words verbatim. English is the only available language;
no translations are implied.

## Run locally

Requires Node.js 22 or later. Run `npm ci` on a fresh checkout. Pinned build
dependencies provide `fflate` for EPUB packaging and Cormorant Garamond via
Fontsource for local display fonts. No package runtime or third-party services
are required by the deployed browser experience.

```powershell
Set-Location D:\Personal\Ripples\UI
npm ci
npm test
npm run build
npm run preview
```

Visit `http://localhost:4173/Ripples/`. To test the repository-root publishing
layout instead of the deployment artifact, stop that server and run:

```powershell
npm run preview -- --root
```

Both modes serve a repository-style subpath. Stop with Ctrl+C.

- [index.html](index.html) is the **actual root entry point**, not a redirect.
- [UI/src/](UI/src/) holds the styles and browser code.
- [UI/scripts/build.mjs](UI/scripts/build.mjs) validates `STORY/`, generates
  `UI/content.js`, and makes the complete `UI/dist/` deployment artifact.
- `UI/content.js` is generated and tracked for branch-root publishing. Never edit
  it manually; rebuild after story changes and include its changes when
  committing. `UI/dist/` is generated and ignored.
- [Assets/](Assets/) contains the original vector cover, favicon, and generated
  `books/ripples-en.html` whole-book download. Include regenerated book editions
  when committing changes to the manuscript.
- [UI/scripts/preview.mjs](UI/scripts/preview.mjs) is local-only tooling.

See [the story guide](STORY/README.md) for writing and translation conventions.

## Reading behavior

- Open the book from the cover or jump directly to a section from the landing page.
- Returning readers get **Continue reading** and **Start again**. Position,
  language, type size and Paper/Night water preference are kept only in this
  browser, not sent to a server or synchronized across devices.
- Position uses the visible paragraph's text and ordinal inside its section.
  Repagination and inserted paragraphs preserve the passage when it still exists.
  Edited/deleted passages move to the nearest remaining position with a notice.
  Explicit book links take precedence over a different saved position.
- Storage failures or invalid saved data display a notice and log a warning;
  reading remains available without persistence. The key is `ripples.reading.v1`.
- Read title, dedication, opening divider, Before, A Pebble, main divider, then
  the five waves in that order.
- The dedication uses Cormorant Garamond italic; the two section-divider titles
  use its upright face, with centered title-case lettering. Fonts are self-hosted
  and embedded in HTML/EPUB downloads, with the SIL Open Font License retained.
- Next/Previous and arrow keys turn pages. In RTL languages arrow direction is
  reversed. Arrow keys inside selectors keep their native behavior.
- Click or tap the left/right edge of the actual paper page for the same
  animated turn. Edge controls are named buttons, mirror in RTL, and disable at
  book boundaries; the main text area remains selectable.
- Page changes use a 460ms paper-turn animation with mirrored forward/backward
  directions (also mirrored for RTL). Reduced-motion preferences switch pages
  instantly. Rapid navigation cancels the old animation rather than queuing it;
  closing, resizing, or changing type size also clears any in-flight turn.
- The contents selector stays visible. **Reading settings** contains language,
  16-24px type controls and **Paper / Night water** appearances; **Keep this book**
  contains the downloads. Both groups start collapsed.
- Escape or Close book returns to the landing page. Native dialog behavior
  contains keyboard focus and makes the background inert while reading.
- `#en/before/2` links to a specific book page. Earlier `#en/impact`-style links
  still open the relevant chapter despite renamed display titles.
- Language changes retain the section, starting at its first page. Paragraphs
  grow/scroll rather than being clipped, including at large font sizes.
- Pagination is editorial, not a fixed screen-sized leaf or print layout.
  There is no autoplay audio, runtime API, remote font, or tracking.
- **Download book (HTML)** saves the complete manuscript, with embedded styles and
  cover art, for offline reading.
- **Download EPUB** saves a reflowable EPUB 3 book with its full manuscript,
  cover, metadata, and table of contents for compatible ebook readers.
- **Print / Save PDF** opens the complete edition in a new tab. Use its print
  button, then choose **Save as PDF** in the browser. This prints every chapter
  in manuscript order, with separate cover, dedication, and divider pages.
  There is no prebuilt PDF download; EPUB and HTML are direct file downloads.
- **Download cover** saves the original vector artwork. The refined cover pairs
  painted and geometric character profiles with water, ivory typography and muted
  gold details. The favicon uses the author's requested pebble/stone emoji.
  Both SVGs are local and editable.
- **Meet them** and the character-card profile buttons open full Aarna/Mukund
  profiles. Emotional interpretation is behind a spoiler-labeled disclosure,
  closed by default and reset on each profile switch. Switch between them without leaving the popup; Escape or Close
  profiles returns focus to the opener. Profiles include personality, work,
  strengths, difficulties, ways of showing love, and their B(L)IND origin.

## Revised emotional arc

The story now lives in **Chicago**, with Indian-American families in San Jose
and New Jersey. Mukund studied in California before moving for work; Aarna
graduated in New York state. His mother's podcast work, his software-engineer
brother, and her parents' musical-instrument shop enter through ordinary details.
Their earlier relationships are settled history and do not intrude.

The manuscript develops **Room Enough**, Aarna's widened-doorway painting, and
her wish not to pack herself away to make space for another person. Mukund's
patient first-date curiosity and his imperfect singing complicate his practical
habits; Aarna also handles bookings and money competently. The confrontation
includes a statement of inadequacy mistaken for an intention to leave.

Their ending puts mutual commitment before a claim of complete understanding:
choosing to come back, listen, correct themselves, and keep learning rather than
put the whole relationship on trial with each misunderstanding. It does not
treat staying as permission to ignore harm. The quiet lamp-and-shoulder ending,
the original dedication, and the one-day structure remain.
The latest pass removes the speech spelling out that principle and tightens
the repeated exchanges. They agree to talk tomorrow, move the bag, and leave
the lamp on; the narration does not explain those actions afterward.

## Relationship origin

They began dating three years ago through **B(L)IND**, an app that arranges
blind dates with random people. Its spelling holds BLIND and BIND together.
That origin is established in the manuscript and in the character profiles;
the cafe details remain editable first-draft choices.

## GitHub Pages: two supported layouts

GitHub Pages requires `index.html` at the root of the **published content**.
This project also keeps it at the **repository root**, as requested.
Its assets use `./UI/...` relative paths, so both publishing methods work at
`https://unigalactix.github.io/Ripples/`.

### GitHub Actions (recommended)

1. Commit/push the project when authorized.
2. In **Settings > Pages**, select **GitHub Actions**.
3. Run [Deploy Ripples to Pages](.github/workflows/pages.yml) manually.
4. The workflow tests, builds, and uploads only `UI/dist/`. Its root contains
   `index.html`, `.nojekyll`, `Assets/`, and `UI/` assets.

### Deploy from a branch

1. Run `npm run build` inside `UI/` and include generated `UI/content.js`, root
   `index.html`, `.nojekyll`, `Assets/`, and `UI/src/` assets in the commit.
2. In **Settings > Pages**, choose **Deploy from a branch**, `main`, and `/(root)`.
3. Verify the site after GitHub finishes its deployment.

Branch publishing exposes other tracked repository files as static files.
The Actions artifact is preferable when only the reader should be in the
published site. Files in a public source repository are public regardless.
Neither option offers private chapters or access control.

No publication is triggered by local builds. The Actions workflow remains
manual; switching to branch-based Pages enables deployment on branch updates.
