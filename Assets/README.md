# Assets

- [cover.svg](cover.svg): original 1000 x 1500 vector book cover, inspired by the
  author's painted/geometric references, refined into a restrained editorial
  cover with deep petrol, warm ivory, muted gold and generous title spacing.
  Aarna's symbolic profile uses rose, ochre and teal brush forms; Mukund's uses
  blue facets and measured lines. Shared water rings connect their sides. English lettering
  belongs to the current English edition; translated editions use live title text
  until localized cover artwork is supplied.
- [favicon.svg](favicon.svg): the author's requested pebble/stone emoji (U+1FAA8)
  on a transparent background. It uses the device's built-in emoji font, so the
  precise stone artwork can vary by platform; no remote font is loaded.
- [water-surface.svg](water-surface.svg): original sunlit aqua water illustration,
  including reflected elliptical ripples and a stone. Used behind the live
  ripple layer; remains visible with reduced motion enabled.
- [aarna-study.svg](aarna-study.svg): a watercolor/brush study suggesting attention,
  expression and persistence without inventing a physical appearance.
- [mukund-study.svg](mukund-study.svg): a blue geometric/grid study suggesting
  structure, attention and practical care. It is not a clinical diagnosis or a
  claim about his medical specialty.
- `books/ripples-<language>.html`: generated complete-book downloads. Each file
  embeds its cover and styles so it can be read offline and printed without
  fetching assets. Do not edit these files; run `npm run build` from `UI/`.
- `books/ripples-<language>.epub`: generated EPUB 3 edition with navigation,
  cover metadata, XHTML manuscript and reflowable styling. Do not edit manually.

- `fonts/`: Cormorant Garamond regular and italic WOFF files, copied from the pinned
  Fontsource package by the build. `fonts/OFL.txt` retains the font's SIL Open Font
  License and copyright notice. These Latin-subset display faces style the dedication
  and divider pages; other scripts can use the serif fallback.

The SVG artwork is editable source created for this project. No stock artwork
or JINX assets are embedded. To produce a PDF, open the full-book
edition, choose **Print / Save PDF**, then select **Save as PDF** in the browser.
The dedication contains the author's supplied wording. HTML and EPUB downloads
embed the two display fonts and their license for offline reading.
