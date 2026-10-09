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
- `books/ripples-<language>.html`: generated complete-book downloads. Each file
  embeds its cover and styles so it can be read offline and printed without
  fetching assets. Do not edit these files; run `npm run build` from `UI/`.
- `books/ripples-<language>.epub`: generated EPUB 3 edition with navigation,
  cover metadata, XHTML manuscript and reflowable styling. Do not edit manually.

The SVG artwork is editable source created for this project. No stock artwork,
external fonts, or JINX assets are embedded. To produce a PDF, open the full-book
edition, choose **Print / Save PDF**, then select **Save as PDF** in the browser.
The dedication remains an explicitly marked placeholder until supplied by the author.
