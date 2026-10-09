# Story

The manuscript lives here. The original concept document at the project root
remains unchanged. The UI is a preview of this evolving book, not a finished edition.

## Approved reading order

| Section | Content / source | Status |
| --- | --- | --- |
| Title page | Ripples - A Rajesh Kodaganti's Unavailability | Author's wording |
| Dedication | [book.json](en/book.json) | Awaiting the author |
| AT THE WATER'S EDGE | Separate centered divider | Approved |
| Before | [00-before.json](en/opening/00-before.json) | First draft |
| A Pebble | [01-pebble.json](en/opening/01-pebble.json) | First draft |
| THE RIPPLES BEGIN | Separate centered divider | Approved |
| Wave One - The First Ripple | [01-first-ripple.json](en/01-first-ripple.json) | First draft |
| Wave Two - Crosscurrents | [02-crosscurrents.json](en/02-crosscurrents.json) | First draft |
| Wave Three - The Crest | [03-crest.json](en/03-crest.json) | First draft |
| Wave Four - The Trough | [04-trough.json](en/04-trough.json) | First draft |
| Wave Five - Still Water | [05-still-water.json](en/05-still-water.json) | First draft |

The author approved the section order and revised wave titles. Filenames match
the new titles. Internal IDs `impact` (Wave One) and `first-ripple` (Wave Two)
remain stable solely to preserve existing reader links and translation mappings.

## First-draft choices

The opening uses close third person, with explicit Aarna/Mukund perspective
breaks. It introduces an ordinary morning, the cancellation that afternoon, and
Mukund's arrival. Funding has fallen through; the gallery has not rejected
Aarna's art. The morning invitation, paint-marked cuff, and unfinished practical
task carry through the scenes.

These details and the narrative voice are editable proposals. All seven story
sections now contain first-draft prose. The later waves recall the broken frame
at a group exhibition and Mukund's missed sales target, then move through the
argument, vulnerable honesty, dinner, and a same-night commitment. These are
proposed shared memories, not final canon. No new childhood trauma is asserted.
The ending is at 11:42 that night; practical plans wait until tomorrow.

The author has established that they began dating through **B(L)IND**, which
sets up blind dates between random people. Preserve that exact name and its
BLIND/BIND dual meaning. `Before` now recalls their introduction. The cafe,
blue shirt and first conversation are draft details, not additional fixed canon.

[characters.json](en/characters.json) holds both full profiles and their shared
origin for the website. It is not an extra chapter in the book. Keep profiles
consistent with ages 28 (Aarna) and 27 (Mukund), their work, and the manuscript.

Review the whole draft for voice, pacing, and the balance between perspectives
before treating it as final. The dedication is the only unfilled book section.

## Content format

Each numbered UTF-8 JSON chapter has `id`, `title`, `scene`, and `status`.
For `status: "draft"`, add a `manuscript` array of blocks:

```json
{
  "perspective": "aarna",
  "paragraphs": ["A paragraph of prose.", "The next paragraph."]
}
```

Perspectives are `aarna`, `mukund`, or `together`. Blocks appear in manuscript
order, including repeated viewpoint changes. Unlike the earlier outline viewer,
the book does not filter out either person's passages.

For `status: "outline"`, retain the existing `together`, `aarna`, and `mukund`
paragraph arrays. Outlines are clearly labeled in the reader and contents.
Paragraphs are plain text, not HTML or Markdown.

The outline format remains supported for future revisions; the current English
book has no outline chapters.

[book.json](en/book.json) holds the title-page subtitle, divider headings, and
dedication. Keep the dedication `pending` with empty paragraphs until the author
supplies it. Then set it to `draft` and fill its paragraphs.

Pagination never cuts or discards a paragraph. It targets up to 220 words or
seven paragraphs per page, but allows a long paragraph to grow. Pages scroll on
small screens or with larger type; this preview is not a fixed print layout.

## Languages

[locales.json](locales.json) supplies language names, direction, book title,
reader controls, and landing-page labels. Only English has been authored.

To add a reviewed translation:

1. Copy the entire `en` folder to a language-tag folder such as `te` or `hi`.
2. Translate `book.json`, `characters.json`, both opening sections, and all five waves. Preserve IDs,
   numbered filenames, JSON structure, and honest draft/outline status.
3. Add a manifest entry with `code`, native `name`, `dir`, translated `title`,
   and all `labels`. Do not register unfinished translations.
4. Run the UI tests and build. Review with a fluent reader before publication.

Missing sections and labels fail the build; there is no silent English fallback.
Language switching preserves the section and returns to its first page because
translations may have different page counts.
