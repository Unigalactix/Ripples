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

- The present-day story begins **Friday evening in Chicago** and ends **Saturday
  night in San Jose**. Both families are originally from India and settled in America.
- **Mukund:** graduated in California, then moved to Chicago for work. His
  mother and elder brother live in San Jose. His brother is a software engineer;
  his mother makes podcasts with celebrities and prominent people across the US,
  mostly Indian celebrities/public figures settled there.
- **Aarna:** her parents live in New Jersey and own a musical-instrument shop.
  She graduated from college in New York state and now lives in Chicago.
- Both have previous relationships. These are settled history, not a source of
  jealousy, intrusion, comparisons or conflict between them.

The states of education do not specify universities or degrees. Family names,
immigration timing, and other relatives' circumstances remain open.

### Shared home and routines

They moved in together during the second year of their three-year relationship.
Their downtown Chicago apartment overlooks the river and has three bedrooms:
one shared bedroom and a separate workspace for each. They each have a car now;
Mukund drove Aarna to work and other places for a year. Why she did not drive then
has not been established.

They mostly eat out, sometimes cook together on weekends, go to Hindi, English
and Telugu films, listen to songs, and take night walks. He reads; she drafts and
thinks through paintings. Their ordinary routines continue through the conflict.

### Current timeline

| Section | Time and movement |
| --- | --- |
| Before | Friday, 6pm: Mukund returns from work to their shared Chicago home. |
| A Pebble | Friday evening: gallery funding cancellation; the dinner celebrating her acceptance is canceled. |
| The First Ripple | They walk to an ordinary restaurant and eat despite the disagreement. |
| Crosscurrents | Friday night: walk by the river and return to the shared apartment; anger rises again. |
| The Crest | Friday, 10:40pm Chicago time: his brother calls from a San Jose hospital; they book Saturday travel. |
| The Trough | Saturday morning: Aarna drives them to the airport; they revisit the conflict on the flight to San Jose. |
| Still Water | Saturday hospital visit; mother doing well after treatment; lobby reconciliation and final hug at 9:30pm California time. |

The author has clarified the health event as a **mild heart attack**. Mukund's
brother calls with the news on Friday and is already with their mother. By
Saturday night's final conversation, the doctor has confirmed that she is doing
well after treatment. She remains under observation and will need recovery and
follow-up care; the story does not treat a heart attack as harmless.
No hospital name, exact flight service or procedure has been invented.

The health scare does not make Aarna's disappointment trivial or automatically
resolve the relationship conflict. She supports him while still hurt. Once they
know his mother is well, both take responsibility and settle the disagreement in
the hospital lobby, ending in an embrace. The previous
one-day ending is superseded; the dedication and approved chapter order remain.

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

The weekend pass gives ordinary life room inside the disagreement: ordering food,
sharing leftovers, carrying a bag, opening the building door, and finding chargers.
Aarna's short temper and repeated attempts to be heard meet Mukund's occasional
frustration, but neither is excused from responsibility for harsh words.

- **Before / A Pebble:** a shared Friday routine and a planned celebration
  establish what is disrupted. Room Enough retains its personal meaning.
- **The First Ripple:** an ordinary meal includes care and a renewed disagreement.
- **Crosscurrents:** the river walk brings pauses, a memory of his driving her,
  and another rise in tension after they reach home.
- **The Crest:** relationship uncertainty is interrupted by a family hospital call.
- **The Trough:** on the flight, she offers the presence she needed and he accepts
  it; they apologize without pretending all hurt has disappeared.
- **Still Water:** reassurance about his mother makes room for the final lobby
  conversation. They settle their argument, agree how to do better, and hug.
  The gallery loss still matters even though the relationship conflict is settled.

Commitment is the ground for learning, not an excuse for repeated hurt. The
ending's relief, direct conversation and embrace carry the emotion. Do not turn
the crisis into a test Aarna must pass to deserve love.

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
