# Story

The manuscript lives here. The original concept document at the project root
remains unchanged. The UI is a preview of this evolving book, not a finished edition.

## Approved reading order

| Section | Content / source | Status |
| --- | --- | --- |
| Title page | Ripples - A Rajesh Kodaganti's Unavailability | Author's wording |
| Dedication | [book.json](en/book.json) | Supplied by the author |
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

### Established setting and family background

- The present-day story takes place in **Chicago**. Both families are originally
  from India and settled in America.
- **Mukund:** graduated in California, then moved to Chicago for work. His
  mother and elder brother live in San Jose. His brother is a software engineer;
  his mother makes podcasts with celebrities and prominent people across the US,
  mostly Indian celebrities/public figures settled there.
- **Aarna:** her parents live in New Jersey and own a musical-instrument shop.
  She graduated from college in New York state and now lives in Chicago.
- Both have previous relationships. These are settled history, not a source of
  jealousy, intrusion, comparisons or conflict between them.

The states of education do not specify universities or degrees. Family names,
immigration timing, and other relatives' circumstances remain open. The shop-window
invitation, brother's tomato photograph and mother's recording are draft scenes
using the established backgrounds, not additional author-supplied facts.

The opening uses close third person, with explicit Aarna/Mukund perspective
breaks. It introduces an ordinary morning, the cancellation that afternoon, and
Mukund's arrival. Funding has fallen through; the gallery has not rejected
Aarna's art. The morning invitation, paint-marked cuff, and unfinished practical
task carry through the scenes.

Scene details and the narrative voice remain editable proposals. All seven story
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
Every profile section has an explicit boolean `spoiler`. The UI keeps emotional
interpretation and character-arc discussion collapsed. Each profile also has a
short `gesture` drawn from the story for its spoiler-free landing introduction.

Review the whole draft for voice, pacing, and the balance between perspectives
before treating it as final. The author's dedication is included verbatim.

### Editorial revision

The Chicago pass trims repeated fixing/listening exchanges, removes narration
that explains the preceding gesture, and replaces the closing statement of
principle with an agreement to talk the following day. The two characters'
families appear through ordinary messages and objects, not trauma or exposition
designed to explain every aspect of their personalities.

- **Before / A Pebble:** Room Enough is a specific painting with a personal
  history, not generic vulnerability. The first-date memory shows that Mukund
  can listen; his singing and Aarna's practical competence complicate their roles.
- **The First Ripple:** relief at his arrival becomes distance when his plans
  replace attention.
- **Crosscurrents:** the old successful repair pattern fails; they literally
  hold opposite sides of the painting.
- **The Crest:** imperfect speech escalates into a misunderstanding about
  whether he wants to leave the relationship.
- **The Trough:** he returns, apologizes for that fear, and lets her show him a
  painting he has misunderstood.
- **Still Water:** a small misstep remains after reconciliation. They choose
  one another through an agreement to return after a pause and talk tomorrow.
  Neither claims complete understanding. There is no concluding speech about
  commitment; the bag moves away from the door and the lamp stays on.

Commitment is the ground for learning, not an excuse for repeated hurt. Keep
the ending's physical details and avoid adding a speech explaining the lamp.
The hammer moves from the chair to the windowsill when Mukund arrives, and stays
there. Preserve the same-night ending and its final line: "He left it on."

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
dedication. The current English dedication contains the author's two supplied
paragraphs, beginning "To every pebble I have faced in my life". Preserve their
wording and paragraph break. The `pending` status remains available for genuinely
unwritten front matter, but does not apply to the current dedication.

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
