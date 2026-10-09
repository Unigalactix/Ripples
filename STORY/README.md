# Story

This folder is the source of truth for chapter content. The original concept
document in the project root remains unchanged.

## Chapter sequence

| Wave | Chapter | Source |
| --- | --- | --- |
| 1 | The Impact | [01-impact.json](en/01-impact.json) |
| 2 | The First Ripple | [02-first-ripple.json](en/02-first-ripple.json) |
| 3 | The Crest | [03-crest.json](en/03-crest.json) |
| 4 | The Trough | [04-trough.json](en/04-trough.json) |
| 5 | Still Water | [05-still-water.json](en/05-still-water.json) |

These are **chapter outlines**, adapted from the author's concept, not finished
prose. Narrative voice, precise backstories, and the cancellation's exact cause
remain open. The website identifies the material as outlines.

## Chapter format

Each UTF-8 JSON file has a stable `id`, a localized `title`, a short `scene`
description, and nonempty paragraph arrays called `together`, `aarna`, and
`mukund`. The reader displays the shared scene and lets readers explore either
perspective or both. Write full chapter prose into these arrays as it develops;
paragraphs are plain text, not HTML or Markdown.

The files are ordered by their numbered filenames. Do not rename chapter IDs
between languages: they link the same scene across translations.

## Languages

[locales.json](locales.json) lists the available languages, text direction,
localized book title, and all reader labels. English is the initial authored
language; no translation has been commissioned or assumed.

To add a language:

1. Create a folder using its language tag, such as `te` or `hi`.
2. Translate all five chapter files, preserving their filenames, IDs, and shape.
3. Add a manifest entry with its tag as `code`, native language name as `name`,
   `dir` (`ltr` or `rtl`), translated `title`, and every `labels` field.
4. Run the UI tests and build. Review the translation with a fluent reader before
   publication. The build rejects missing chapters and labels rather than falling
   back to English.

When completed prose replaces the outlines, update the localized `status` label
and related documentation. Adding a manifest entry makes that language visible
in the reader, so only register ready-to-display content.
