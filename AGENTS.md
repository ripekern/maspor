# Working notes for this site

Things that are not obvious from the code, and that cost time to work out.
Written October 2026.

## Verifying Scripture quotations

**Use `purebible`, which is installed, before shipping any quotation.** Do not
quote from memory and do not trust a general-purpose Bible API for this.

```
purebible lookup --no-color "Acts 17:24"     # exact text of a verse or range
purebible search --count "LORD"              # count an occurrence
purebible search --gospels "love"             # scope: --law --prophets --ot --nt --gospels --letters
```

Flags go **before** the reference. `purebible lookup "Acts 17:24" --no-color`
fails with `not a reference` — put the option first.

Database 1 is the **KJV 1769** (King James Pure Bible). Source:
<https://github.com/ripekern/purebible-py>. The full text file is
`SW1769Bible_both.txt`.

### Why this matters, and what went wrong once

Ten of thirteen quotations in the first draft of `code-licensing.html` were
wrong. The errors were not typos — they were plausible-sounding misrememberings
that read like KJV:

- `Acts 2:4` was given as "filled with the Holy Ghost, and spake boldly". That
  clause is **Acts 4:31**; Acts 2:4 reads "and began to speak with other tongues".
  The verse number was right and the wording was borrowed from a different verse.
- `1 Corinthians 3:23` was given as "Ye are the world's; ye are not your own." The
  verse is "And ye are Christ's; and Christ's [is] God's." The quote is real, from
  the *previous* verse.
- `Galatians 5:1` was given as "Stand ye in the liberty..." — that is not this
  verse in this translation.
- `John 11:25` was "believeth **on** me"; the KJV reads "believeth **in** me".

A mis-citation of Scripture is a serious fault in a site whose whole claim is
that it holds the KJV to be the word of God. **Check every single one.**

### How the site presents quotations

The house style, from the existing pages:

- Text in `&ldquo;…&rdquo;` with `&rsquo;` for apostrophes and `&mdash;` for em dashes.
- Bracketed insertions from the 1769 translators are kept as `[ought]`,
  `[that]`, `[is]` — e.g. `&ldquo;For the kingdom of God [is] not in word, but in
  power.&rdquo;`. Do not silently drop them and do not add your own.
- `Cæsar` is written with the ligature: `C&aelig;sar`.
- Ranges use an en dash in the cite: `<cite>John 11:25&ndash;26</cite>`.

### A reliable automated check

This walks every page, pulls each `<p>&ldquo;…&rdquo;</p>` + `<cite>` pair, and
compares it to `purebible lookup`. Run it after editing any page with
quotations:

```python
import re, subprocess, pathlib
from functools import lru_cache

@lru_cache(maxsize=None)
def lookup(ref):
    return subprocess.run(['purebible','lookup','--no-color',ref],
                          capture_output=True, text=True).stdout

def norm(s):
    for a,b in [('&rsquo;',"'"),('&lsquo;',"'"),('&mdash;','-'),('&ndash;','-'),
                ('&aelig;','æ'),('&amp;','&'),('&para;','')]:
        s = s.replace(a,b)
    return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",
                  re.sub(r'<[^>]+>','',s).lower())).strip()

def verses(ref):
    """Every line of KJV a cite points at, with the verse prefixes stripped.

    Handles all three cite shapes the site uses: a single reference, a range
    ("Luke 13:7-8"), a list ("Psalm 103:2, 5", where the book and chapter
    carry over), and an annotated cite ("Genesis 3:15 &mdash; fulfilled in
    Galatians 4:4"), which names the prophecy first and is checked against
    that alone.
    """
    # A bare class of [\d,-] stops at the space in a list cite ("Psalm 103:2, 5"),
    # silently dropping every verse after the first, so allow more digit runs
    # after whitespace. It still stops at "&mdash;" in an annotated cite.
    m = re.match(r'\s*([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d,-]+(?:\s+[\d,-]+)*)', ref)
    if not m:
        return []
    book, chapter, spec = m.group(1), m.group(2), m.group(3)
    out = []
    for part in spec.split(','):
        part = part.strip()
        # A bare verse after the first inherits the chapter: "103:2, 5" -> 103:5
        out.append(lookup(f'{book} {part}' if ':' in part
                          else f'{book} {chapter}:{part}').strip())
    # Strip EVERY verse prefix, not just the first. A range prints as
    # "Luke 13:7 ...\nLuke 13:8 ...", and leaving the second in injects
    # "luke 13 8" into the middle of the text being searched. Match lazily to
    # the verse numbers, so "1 Corinthians 12:9" comes off whole.
    return [re.sub(r'^\s*[^\n]*?\d+:\d+\s+', '', v, flags=re.M) for v in out if v.strip()]

def matches(text, src):
    """True when every piece of a quotation appears in the KJV, in order.

    A quotation may be shortened with `&hellip;`, which drops whole clauses,
    so it cannot be tested as one substring: "them also I must bring&hellip; and
    there shall be one fold" skips "and they shall hear my voice" in the
    middle. Split on the elision and require each piece to be found in turn,
    each one starting where the last left off.
    """
    src, pos = norm(src), 0
    for frag in re.split(r'&hellip;|&#8230;|\u2026', text):
        frag = norm(frag)
        if not frag:
            continue
        i = src.find(frag, pos)
        if i < 0:
            return False
        pos = i + len(frag)
    return True

for f in sorted(pathlib.Path('.').glob('*.html')):
    h = f.read_text(encoding='utf-8')
    for text, cite in re.findall(r'<p>&ldquo;(.*?)&rdquo;</p>\s*<cite>(.*?)</cite>', h, re.S):
        ref = cite.replace('&ndash;','-').replace('&amp;','&')
        src = verses(ref)
        if not src:
            print("UNRESOLVED", f.name, ref); continue
        print("OK   " if matches(text, ' '.join(src)) else "WRONG", f.name, ref)
```

**The elision is why this works.** A quotation may be shortened with
`&hellip;`, and `norm` must reduce it to a space rather than to `...` — so a
verse quoted with a gap still matches the untruncated source. Both kinds are
correct:

```html
<p>&ldquo;There is neither Jew nor Greek, there is neither bond nor free&hellip;
for ye are all one in Christ Jesus.&rdquo;</p>
```

`&hellip;` is an elision the site made deliberately, never a licence to alter a
word. Three traps this check used to fall into, all now handled: ranges carried
a verse number into the middle of the text, elisions were compared literally,
and annotated cites could not be resolved at all.

### Do not use general-purpose Bible APIs for this

`bible-api.com?translation=kjv` and similar were tried and rejected. They
silently return a **modernised** text for some verses — "Render *therefore* unto
Caesar the things *which* are Caesar's" is not KJV — while returning true KJV for
others, so a spot check passes and then fails on the next passage. Two different
GitHub "KJV" JSON files proved to be byte-identical to each other and both
modernised. `purebible` is the only source here to trust.

## Images

Provenance for every file is in `images/CREDITS.md`, with AIC object numbers.
Add a row when you add a picture.

Artwork comes from the Art Institute of Chicago open-access API
(<https://api.artic.edu/api/v1/artworks/>). Only use works flagged
`is_public_domain: true`, and check that flag — do not assume.

## Image conventions

Three slots, and they crop differently. Getting this wrong silently breaks the
layout, and it has:

- **Banners** — 16:9, 1280px wide master. Derivatives key to **width**: `-480`
  is exactly 480px wide.
- **Figures** (`section-art`, `card-art`, `feature-art`) — master is 1000px on
  the **long edge**. Derivatives key to the long edge, so a portrait master
  gives a `-480` narrower than 480px.
- **Footer seal** — the arms, rendered from `images/maspor-arms.svg`.

Every JPEG is progressive, sRGB, no ICC profile. AVIF and WebP at 480 and 960.

### The `height` attribute will beat `aspect-ratio`

`.card-art img` carries `aspect-ratio: 16 / 10` **and `height: auto`**. The
`height: auto` is load-bearing. Without it the presentational `height="750"`
attribute wins and the crop is lost — cards render as tall strips. If you touch
that rule, check a card renders at 1.60, not just that it still displays.

`.post-card .card-art` had the same problem in a separate rule with higher
specificity. Check both.

## Checking your work

Headless Chromium is at `chromium`. Serve the site and screenshot it:

```
python3 -m http.server 8731 &
chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=1280,1700 --screenshot=shot.png --virtual-time-budget=9000 \
  'http://localhost:8731/PAGE.html'
```

**Measure, do not eyeball.** Drop a `<script>` into a copy of the page that
replaces `document.body` with the computed rects, then `--dump-dom` and read
the numbers.

Two traps when screenshotting:

- Lazy-loaded images further down the page are blank unless you strip
  `loading="lazy"` from a throwaway copy. That is a capture artifact, not a bug —
  confirm with the DOM before "fixing" it.
- A very tall `--window-size` changes the layout and can leave the footer far
  from where a normal viewport puts it. For the footer, inject a stylesheet that
  hides everything but the footer instead.

## Before committing

```
python3 - <<'PY'
import re, pathlib
from PIL import Image
for f in sorted(pathlib.Path('.').glob('*.html')):
    h = f.read_text(encoding='utf-8')
    for r in set(re.findall(r'images/[A-Za-z0-9._-]+', h)):
        if not pathlib.Path(r).exists(): print('MISSING', f.name, r)
    for tag in re.findall(r'<img[^>]*>', h):
        if 'alt=' not in tag: print('NO ALT', f.name)
    for r, w, hh in re.findall(
        r'src="(images/[a-z0-9.-]+\.(?:jpg|png))"[^>]*?width="(\d+)"[^>]*?height="(\d+)"', h, re.S):
        if (int(w), int(hh)) != Image.open(r).size: print('DIM', f.name, r)
PY
```

Every `<img>` needs real alt text. The footer seal renders at 64px via CSS while
its attributes say 256 — that is deliberate, not a bug.

## Section hand-offs — the site reads as one book

Every content section closes with `<p class="note">`, and the last clause of that
note carries the opening words of whatever comes next, wrapped in
`<span class="carry">`. At a page boundary it carries the first heading of the next
page instead. This is a house rule, not decoration: **a new section without a
closing note is an unfinished section.**

The reading order is fixed, and each page's last section hands to the next one:

```
index → king → charter → heritage → citizenship → benefits
      → code-clean-browsing → code-bitcoin-cash → code-licensing → citizenship#codes
```

404 is outside the book and hands back to the first heading on `index.html`.

Three rules that are easy to break by accident:

- **The carried words must be verbatim** from the next heading — at least two words,
  and never paraphrased. `Every knee shall bow` must be carried as written. Do not
  "improve" the heading to make a carry fit; fix the carry. The one exception is a
  heading too short to carry two words from (`Spotless`), where the carry may come
  from that section's opening prose instead.
- **The carry is the note's last clause.** Anything after it reads as belonging to
  the section that follows, which is the whole point.
- **`link-more` sits after the note**, never inside it. The note carries the words;
  the link carries the reader. Keep them as separate elements so the grammar stays
  the same on every page.

`.note` is `grid-column: 1 / -1`, so it spans the full width of a section whatever
layout that section uses (`.feature`, `.contact-grid`). Don't wrap it in a column.

### Checking the chain

Walk every content section in book order and confirm each closing note's carry is a
verbatim word run of the next unit's heading. `faq`, `post-foot`, `page-head` and
`banner` sections are back matter and carry no note.

## Tone

The register is plain, declarative, and unhurried. Scripture is quoted, never
paraphrased, and the site is careful to state a claim. When you add
a claim, check whether it needs a qualifying paragraph — the codes each close
with one. Keep that habit.

### Never head a section with what it is not or make a counterclaim to an existing claim

The one thing this register will not do is open with a negation. "What this does
not say", "What this code does not say", and every other heading that puts a
denial first is out, and none of them are to be reintroduced. It reads as double
mindedness, which is exactly the fault James 1:8 names: a double minded man is
unstable in all his ways. The site says one thing, plainly, and stops.

*The conclusion of the
matter* (Our King, "The seventh day is his, and it is signed") is the model: the
qualifications now read as the end of an argument rather than a retraction of it.

Deity is referred to in the reverent forms already in use: the LORD, the Father,
the Son, the Shepherd. Do not introduce a new register for one page.