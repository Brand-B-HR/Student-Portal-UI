# CareerBuild — Design System

The visual and component language for the CareerBuild student portal.
Everything here is real: tokens live in [`app/globals.css`](app/globals.css),
components in [`components/`](components/).

---

## 1. Brand colour

The system's default orange is **`#ef9f26`**. It was already the portal's
primary (`--color-orange-500` / `--color-leaf-500` in the old stylesheet) — it is
now the anchor of a full 10-step ramp exposed as `brand-*`.

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#fffaf3` | Page background |
| `brand-100` | `#fdf2e1` | Tinted bands, badge fill, hover wash |
| `brand-200` | `#fbe4bd` | Badge / tinted-band borders |
| `brand-300` | `#f6c57d` | Rank numerals, decorative |
| `brand-400` | `#f2b251` | Gradient partner |
| **`brand-500`** | **`#ef9f26`** | **Primary — buttons, active indicator, focus ring** |
| `brand-600` | `#cf8114` | Primary hover, eyebrow text |
| `brand-700` | `#a5650f` | Link text, badge text (AA on `brand-100`) |
| `brand-800` | `#7a4a0b` | Text on light brand fills |
| `brand-900` | `#4d2f07` | Deepest accent |

**Rule:** orange is an *accent*, not a surface. Large areas stay white or
`surface-subtle`. Orange marks the one thing that matters in a view — the
primary action, the active nav item, the focus ring.

### Ink (warm neutrals)

Text neutrals are warm-tinted so they sit correctly on the cream background —
never pure grey.

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#1c1410` | Headlines |
| `ink-800` | `#2c1810` | Article body |
| `ink-700` | `#43332a` | Strong UI text |
| `ink-600` | `#5c473e` | Body copy |
| `ink-500` | `#7a655a` | Secondary / summaries |
| `ink-400` | `#9c8375` | Meta — dates, read time |
| `ink-300` | `#c4b3a8` | Labels, disabled |

### Surfaces & lines

| Token | Hex | Use |
|---|---|---|
| `surface` | `#ffffff` | Cards, header, footer |
| `surface-subtle` | `#fffaf3` | Page background |
| `surface-muted` | `#fdf7ee` | Inset wells |
| `line` | `#efe4d6` | Default hairline |
| `line-strong` | `#e2d2bf` | Interactive borders |

---

## 2. Typography

Two Google Fonts, each loaded with **real italic axes**.

| Role | Family | Token |
|---|---|---|
| Editorial — headlines, article body, card titles | **Newsreader** | `font-serif` |
| UI — nav, buttons, labels, meta | **Plus Jakarta Sans** | `font-sans` |

### Why italics were broken, and the fix

The old stack loaded Fraunces without a reliable italic axis, so browsers
**synthesised** italics — mechanically slanting the upright face. That is what
"italic text not displaying properly" looked like.

Three changes fix it permanently:

1. Both families load true italic axes (`ital,wght@0,…;1,…` in the font URL).
2. `font-synthesis-weight: none` and `font-synthesis-style: none` on `body` —
   the browser is now **forbidden** from faking a slant. If a real italic is
   missing you see upright text, a loud failure, rather than a bad fake.
3. `em, i, cite, blockquote` explicitly set `font-style: italic`.

Newsreader is a text face designed for on-screen reading with a genuine
drawn italic — the right choice for an article site.

### Scale

| Element | Size | Weight | Family |
|---|---|---|---|
| Page headline (h1) | 34 → 46px | 600 | serif |
| Section title (h2) | 22 → 26px | 600 | serif |
| Featured card title | 26 → 32px | 600 | serif |
| Card title | 17 → 19px | 600 | serif |
| Article body | 19px / 1.75 | 400 | serif |
| UI body | 14–15px | 400–500 | sans |
| Meta | 11px | 400 | sans |
| Eyebrow | 11px, `0.14em` tracking, uppercase | 700 | sans |

---

## 3. Layout

`Container` is the only horizontal-rhythm primitive. Three widths:

| Size | Max width | Use |
|---|---|---|
| `narrow` | `max-w-3xl` | Article reading column |
| `default` | `max-w-6xl` | Standard pages |
| `wide` | `max-w-7xl` | Dense listings |

Padding is `px-5 / sm:px-6 / lg:px-8` at every size. Vertical rhythm between
major sections is `space-y-14`; within a section, `mt-5`/`mt-6`.

**Radii:** `14px` cards, `18px` tinted bands, `999px` buttons and badges.
**Elevation:** `--shadow-card` at rest, `--shadow-lift` on hover, `--shadow-pop`
for menus. Cards never carry a resting drop shadow heavier than 1px — depth
comes from the hairline border.

---

## 4. Components

### Layout & chrome

| Component | Notes |
|---|---|
| `SiteShell` | `AuthGuard` + header + main + footer. Every signed-in page uses it. |
| `SiteHeader` | Sticky, blurred, 64px. Underline active indicator, account dropdown, mobile drawer. |
| `SiteFooter` | Brand blurb + two link columns + legal line. |
| `Container` | Width + gutters. |

### UI primitives — `components/ui/`

| Component | Variants |
|---|---|
| `Button` | `primary` · `secondary` · `ghost` · `inverse` × `sm` · `md` · `lg`. Renders `<a>` when given `href`. |
| `Badge` | `brand` · `neutral` · `solid` · `outline` |
| `SectionHeader` | Title + optional eyebrow, subtitle, trailing action link |
| `States` | `Skeleton`, `ArticleCardSkeleton`, `Spinner`, `EmptyState`, `ErrorState` |

### Content

| Component | Notes |
|---|---|
| `ArticleCard` | **Five variants** — see below |
| `ArticleRail` | Snap-scrolling row + arrow controls that disable at each end |
| `AdBanner` | `strip` (84–104px inline) · `sidebar` (150px) |

#### `ArticleCard` variants

| Variant | Shape | Used on |
|---|---|---|
| `featured` | Image beside a large headline, author block | Dashboard hero |
| `standard` | Vertical card, 16:10 image, badge, excerpt | Grids |
| `rail` | 228–248px fixed width, title only | Horizontal rails |
| `list` | 92px thumbnail + title row | Sidebars, "More like this" |
| `text` | Ranked numeral + title, no image | "Most read" |

One component, one data shape, five presentations — adding a section never
means writing new card markup.

---

## 5. Advertising

Ads are **small, contained slots** — never full-page or full-bleed.

- `strip` — 84px (mobile) / 104px (desktop) leaderboard between content sections
- `sidebar` — 150px box in the sidebar rail

Every slot is labelled **Sponsored** in `ink-300`, carries
`rel="noopener noreferrer sponsored"`, and **renders nothing when no ads are
active** — so an empty ad server never leaves a hole in the layout. Rotation
honours each ad's own `displayDurationSeconds`.

---

## 6. Interaction

- **Focus:** a single global rule — 2px `brand-500` ring, 2px offset, on every
  interactive element. Never removed.
- **Hover on cards:** shadow lift + `1.04` image scale + title turns
  `brand-700`. No transforms on the card box itself, so grids never jitter.
- **Transitions:** 150ms for colour, 300ms for shadow, 500ms for image scale.
- **Motion:** reveals use `fade-in-up`, 350ms, `cubic-bezier(0.22, 1, 0.36, 1)`.

---

## 7. Images

Article covers and adverts render through a plain `<img>` with
`loading="lazy"` and `decoding="async"`, inside an aspect-ratio box so nothing
shifts as they load.

This is deliberate. `next/image` requires every storage hostname to be listed
in `next.config.ts` — which is what produced the
`hostname … is not configured under images` crash when content moved between
`brandbhrstoragedev` and `brandbhrdevstorage`. Plain `<img>` means **any**
storage account works in any environment with no config change.

Articles with no cover get a deterministic branded gradient keyed off the
article id, with the title's first letter — never a broken image, never an
empty box.

---

## 8. Writing style

- Headlines are sentence case, not Title Case.
- Meta reads `Aug 20, 2026 · 4 min read` — middot separated, never boxed.
- Author names come from the API; the fallback is "CareerBuild".
- No emoji in UI chrome. Icons are inline stroke SVG on a 24px grid,
  `stroke-width` 2–2.5, round caps and joins.

---

## 9. Adding a section

```tsx
<ArticleRail
  title="Interview preparation"
  subtitle="Walk in ready."
  articles={interviewArticles}
  actionHref="/blog"
  tinted           // alternate tinted/plain down the page
/>
```

For a grid instead:

```tsx
<SectionHeader title="Latest articles" actionLabel="View all" actionHref="/blog" />
<div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {articles.map((a) => <ArticleCard key={a.id} article={a} variant="standard" />)}
</div>
```

Do not write bespoke card markup. If a new shape is genuinely needed, add a
variant to `ArticleCard` so every page gets it.
